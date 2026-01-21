import { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import {
  extractProxyAuth,
  checkProxyRateLimit,
  checkCredits,
  deductCredits,
  logProxyUsage,
  hasServiceAccess,
  proxyError,
  proxySuccess,
} from "@/lib/proxy";
import { AppAuthProxyRequestSchema } from "@/types/proxy";
import { ProxyService, Prisma } from "@prisma/client";
import prisma from "@/lib/db";

// Session token validity: 30 days
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * @swagger
 * /api/proxy/auth:
 *   post:
 *     summary: App User Authentication Proxy
 *     description: |
 *       Complete user authentication system for generated apps.
 *       Supports signup, login, logout, profile management, and password reset.
 *
 *       **Authentication:** Requires a valid RUX API key.
 *
 *       **Rate Limits:** 60 auth operations per minute per project.
 *
 *       **Credits:** 1 credit per operation.
 *
 *       Users are automatically scoped to your project - each project has
 *       its own isolated user pool.
 *     tags:
 *       - Proxy Services
 *     security:
 *       - ApiKeyAuth: []
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Authenticate
  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { apiKeyId, projectId, userId, plan, services } = auth.context;

  // Check service access
  if (!hasServiceAccess(services, ProxyService.APP_AUTH)) {
    return proxyError(
      "This API key does not have access to the App Auth service",
      "FORBIDDEN",
      403,
    );
  }

  // Check rate limit
  const rateLimit = await checkProxyRateLimit(projectId, "app_auth");
  if (!rateLimit.success) {
    return proxyError(
      `Rate limit exceeded. Try again in ${Math.ceil((rateLimit.reset - Date.now()) / 1000)}s`,
      "RATE_LIMITED",
      429,
    );
  }

  // Parse request
  let body;
  try {
    body = await request.json();
  } catch {
    return proxyError("Invalid JSON body", "INVALID_REQUEST", 400);
  }

  const parsed = AppAuthProxyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return proxyError(
      `Validation error: ${parsed.error.errors[0]?.message}`,
      "VALIDATION_ERROR",
      400,
    );
  }

  const requestData = parsed.data;

  // Check credits (1 credit per operation)
  const creditCheck = await checkCredits(userId, plan, "app_auth", 1);
  if (!creditCheck.hasCredits) {
    return proxyError(
      `Insufficient credits. Required: 1, Available: ${creditCheck.available}`,
      "INSUFFICIENT_CREDITS",
      402,
    );
  }

  try {
    let result: {
      success: boolean;
      user?: {
        id: string;
        email: string;
        name: string | null;
        avatarUrl: string | null;
        emailVerified: boolean;
        metadata: unknown;
        createdAt: string;
      };
      sessionToken?: string;
      expiresAt?: string;
      message?: string;
    };

    switch (requestData.operation) {
      case "signup": {
        // Check if user already exists
        const existing = await prisma.appUser.findUnique({
          where: {
            projectId_email: {
              projectId,
              email: requestData.email.toLowerCase(),
            },
          },
        });

        if (existing) {
          return proxyError(
            "A user with this email already exists",
            "USER_EXISTS",
            409,
          );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(requestData.password, 12);

        // Generate verification token
        const verifyToken = randomBytes(32).toString("hex");

        // Create user
        const newUser = await prisma.appUser.create({
          data: {
            projectId,
            email: requestData.email.toLowerCase(),
            passwordHash,
            name: requestData.name,
            metadata: requestData.metadata as Prisma.InputJsonValue | undefined,
            verifyToken,
          },
        });

        // Create session
        const { sessionToken, expiresAt } = await createSession(
          newUser.id,
          request,
        );

        result = {
          success: true,
          user: formatUser(newUser),
          sessionToken,
          expiresAt: expiresAt.toISOString(),
          message: "Account created successfully",
        };
        break;
      }

      case "login": {
        const user = await prisma.appUser.findUnique({
          where: {
            projectId_email: {
              projectId,
              email: requestData.email.toLowerCase(),
            },
          },
        });

        if (!user || !user.active) {
          return proxyError(
            "Invalid email or password",
            "INVALID_CREDENTIALS",
            401,
          );
        }

        // Verify password
        const validPassword = await bcrypt.compare(
          requestData.password,
          user.passwordHash,
        );
        if (!validPassword) {
          return proxyError(
            "Invalid email or password",
            "INVALID_CREDENTIALS",
            401,
          );
        }

        // Update last login
        await prisma.appUser.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Create session
        const { sessionToken, expiresAt } = await createSession(
          user.id,
          request,
        );

        result = {
          success: true,
          user: formatUser(user),
          sessionToken,
          expiresAt: expiresAt.toISOString(),
        };
        break;
      }

      case "logout": {
        // Find and delete session
        const tokenHash = hashToken(requestData.sessionToken);
        await prisma.appSession.deleteMany({
          where: { token: tokenHash },
        });

        result = {
          success: true,
          message: "Logged out successfully",
        };
        break;
      }

      case "me": {
        const session = await validateSession(requestData.sessionToken);
        if (!session) {
          return proxyError(
            "Invalid or expired session",
            "INVALID_SESSION",
            401,
          );
        }

        const user = await prisma.appUser.findUnique({
          where: { id: session.appUserId },
        });

        if (!user || !user.active) {
          return proxyError("User not found", "USER_NOT_FOUND", 404);
        }

        result = {
          success: true,
          user: formatUser(user),
        };
        break;
      }

      case "updateProfile": {
        const session = await validateSession(requestData.sessionToken);
        if (!session) {
          return proxyError(
            "Invalid or expired session",
            "INVALID_SESSION",
            401,
          );
        }

        const updateData: Prisma.AppUserUpdateInput = {};
        if (requestData.name !== undefined) updateData.name = requestData.name;
        if (requestData.avatarUrl !== undefined)
          updateData.avatarUrl = requestData.avatarUrl;
        if (requestData.metadata !== undefined)
          updateData.metadata = requestData.metadata as Prisma.InputJsonValue;

        const updatedUser = await prisma.appUser.update({
          where: { id: session.appUserId },
          data: updateData,
        });

        result = {
          success: true,
          user: formatUser(updatedUser),
          message: "Profile updated successfully",
        };
        break;
      }

      case "changePassword": {
        const session = await validateSession(requestData.sessionToken);
        if (!session) {
          return proxyError(
            "Invalid or expired session",
            "INVALID_SESSION",
            401,
          );
        }

        const user = await prisma.appUser.findUnique({
          where: { id: session.appUserId },
        });

        if (!user) {
          return proxyError("User not found", "USER_NOT_FOUND", 404);
        }

        // Verify current password
        const validPassword = await bcrypt.compare(
          requestData.currentPassword,
          user.passwordHash,
        );
        if (!validPassword) {
          return proxyError(
            "Current password is incorrect",
            "INVALID_PASSWORD",
            401,
          );
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(requestData.newPassword, 12);

        await prisma.appUser.update({
          where: { id: user.id },
          data: { passwordHash: newPasswordHash },
        });

        // Invalidate all other sessions
        const currentTokenHash = hashToken(requestData.sessionToken);
        await prisma.appSession.deleteMany({
          where: {
            appUserId: user.id,
            token: { not: currentTokenHash },
          },
        });

        result = {
          success: true,
          message: "Password changed successfully",
        };
        break;
      }

      case "forgotPassword": {
        const user = await prisma.appUser.findUnique({
          where: {
            projectId_email: {
              projectId,
              email: requestData.email.toLowerCase(),
            },
          },
        });

        // Always return success to prevent email enumeration
        if (user && user.active) {
          // Generate reset token
          const resetToken = randomBytes(32).toString("hex");
          const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

          await prisma.appUser.update({
            where: { id: user.id },
            data: {
              resetToken,
              resetExpires,
            },
          });

          // Note: In a real implementation, you would send an email here
          // using the email proxy with the reset token
        }

        result = {
          success: true,
          message:
            "If an account exists with this email, a password reset link has been sent",
        };
        break;
      }

      case "resetPassword": {
        const user = await prisma.appUser.findFirst({
          where: {
            projectId,
            resetToken: requestData.token,
            resetExpires: { gt: new Date() },
          },
        });

        if (!user) {
          return proxyError(
            "Invalid or expired reset token",
            "INVALID_TOKEN",
            400,
          );
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(requestData.newPassword, 12);

        await prisma.appUser.update({
          where: { id: user.id },
          data: {
            passwordHash: newPasswordHash,
            resetToken: null,
            resetExpires: null,
          },
        });

        // Invalidate all sessions
        await prisma.appSession.deleteMany({
          where: { appUserId: user.id },
        });

        result = {
          success: true,
          message:
            "Password reset successfully. Please log in with your new password.",
        };
        break;
      }

      case "verifyEmail": {
        const user = await prisma.appUser.findFirst({
          where: {
            projectId,
            verifyToken: requestData.token,
          },
        });

        if (!user) {
          return proxyError("Invalid verification token", "INVALID_TOKEN", 400);
        }

        await prisma.appUser.update({
          where: { id: user.id },
          data: {
            emailVerified: true,
            verifyToken: null,
          },
        });

        result = {
          success: true,
          message: "Email verified successfully",
        };
        break;
      }

      case "deleteAccount": {
        const session = await validateSession(requestData.sessionToken);
        if (!session) {
          return proxyError(
            "Invalid or expired session",
            "INVALID_SESSION",
            401,
          );
        }

        const user = await prisma.appUser.findUnique({
          where: { id: session.appUserId },
        });

        if (!user) {
          return proxyError("User not found", "USER_NOT_FOUND", 404);
        }

        // Verify password
        const validPassword = await bcrypt.compare(
          requestData.password,
          user.passwordHash,
        );
        if (!validPassword) {
          return proxyError("Password is incorrect", "INVALID_PASSWORD", 401);
        }

        // Delete user and all sessions (cascade)
        await prisma.appUser.delete({
          where: { id: user.id },
        });

        result = {
          success: true,
          message: "Account deleted successfully",
        };
        break;
      }

      default:
        return proxyError("Unknown operation", "INVALID_OPERATION", 400);
    }

    // Deduct credits
    const deduction = await deductCredits(userId, "app_auth", 1);

    // Log usage
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: ProxyService.APP_AUTH,
      operation: requestData.operation,
      creditsUsed: 1,
      success: true,
      metadata: {
        operation: requestData.operation,
      },
      latencyMs: Date.now() - startTime,
    });

    return proxySuccess({
      ...result,
      creditsUsed: 1,
      creditsRemaining: deduction.newBalance,
    });
  } catch (error) {
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: ProxyService.APP_AUTH,
      operation: requestData.operation,
      creditsUsed: 0,
      success: false,
      errorCode: "AUTH_ERROR",
      metadata: { error: error instanceof Error ? error.message : "Unknown" },
      latencyMs: Date.now() - startTime,
    });

    return proxyError(
      error instanceof Error
        ? error.message
        : "Authentication operation failed",
      "AUTH_ERROR",
      500,
    );
  }
}

/**
 * Create a new session for a user
 */
async function createSession(
  appUserId: string,
  request: NextRequest,
): Promise<{ sessionToken: string; expiresAt: Date }> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.appSession.create({
    data: {
      appUserId,
      token: tokenHash,
      expiresAt,
      userAgent: request.headers.get("user-agent") || undefined,
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        undefined,
    },
  });

  return { sessionToken: rawToken, expiresAt };
}

/**
 * Validate a session token and return the session if valid
 */
async function validateSession(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  const session = await prisma.appSession.findUnique({
    where: { token: tokenHash },
  });

  if (!session || session.expiresAt < new Date()) {
    // Clean up expired session
    if (session) {
      await prisma.appSession
        .delete({ where: { id: session.id } })
        .catch(() => {});
    }
    return null;
  }

  // Update last active
  await prisma.appSession
    .update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    })
    .catch(() => {});

  return session;
}

/**
 * Hash a token for storage
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Format user for response
 */
function formatUser(user: {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  metadata: unknown;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    metadata: user.metadata,
    createdAt: user.createdAt.toISOString(),
  };
}
