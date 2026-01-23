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
  proxyCorsOptions,
} from "@/lib/proxy";

// Handle CORS preflight requests
export async function OPTIONS() {
  return proxyCorsOptions();
}
import { AppAuthProxyRequestSchema } from "@/types/proxy";
import { createClient } from "@/lib/supabase/server";

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
  if (!hasServiceAccess(services, "app_auth")) {
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

  const supabase = await createClient();

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
        const { data: existing, error: existingError } = await supabase
          .from("app_users")
          .select("*")
          .eq("project_id", projectId)
          .eq("email", requestData.email.toLowerCase())
          .single();

        if (existing && !existingError) {
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
        const { data: newUser, error: createError } = await supabase
          .from("app_users")
          .insert({
            project_id: projectId,
            email: requestData.email.toLowerCase(),
            password_hash: passwordHash,
            name: requestData.name,
            metadata: requestData.metadata,
            verify_token: verifyToken,
          })
          .select()
          .single();

        if (createError || !newUser) {
          throw new Error("Failed to create user");
        }

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
        const { data: user, error: userError } = await supabase
          .from("app_users")
          .select("*")
          .eq("project_id", projectId)
          .eq("email", requestData.email.toLowerCase())
          .single();

        if (userError || !user || !user.active) {
          return proxyError(
            "Invalid email or password",
            "INVALID_CREDENTIALS",
            401,
          );
        }

        // Verify password
        const validPassword = await bcrypt.compare(
          requestData.password,
          user.password_hash,
        );
        if (!validPassword) {
          return proxyError(
            "Invalid email or password",
            "INVALID_CREDENTIALS",
            401,
          );
        }

        // Update last login
        await supabase
          .from("app_users")
          .update({ last_login_at: new Date().toISOString() })
          .eq("id", user.id);

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
        await supabase.from("app_sessions").delete().eq("token", tokenHash);

        result = {
          success: true,
          message: "Logged out successfully",
        };
        break;
      }

      case "me": {
        const session = await validateSession(
          requestData.sessionToken,
          supabase,
        );
        if (!session) {
          return proxyError(
            "Invalid or expired session",
            "INVALID_SESSION",
            401,
          );
        }

        const { data: user, error: userError } = await supabase
          .from("app_users")
          .select("*")
          .eq("id", session.app_user_id)
          .single();

        if (userError || !user || !user.active) {
          return proxyError("User not found", "USER_NOT_FOUND", 404);
        }

        result = {
          success: true,
          user: formatUser(user),
        };
        break;
      }

      case "updateProfile": {
        const session = await validateSession(
          requestData.sessionToken,
          supabase,
        );
        if (!session) {
          return proxyError(
            "Invalid or expired session",
            "INVALID_SESSION",
            401,
          );
        }

        const updateData: Record<string, unknown> = {};
        if (requestData.name !== undefined) updateData.name = requestData.name;
        if (requestData.avatarUrl !== undefined)
          updateData.avatar_url = requestData.avatarUrl;
        if (requestData.metadata !== undefined)
          updateData.metadata = requestData.metadata;

        const { data: updatedUser, error: updateError } = await supabase
          .from("app_users")
          .update(updateData)
          .eq("id", session.app_user_id)
          .select()
          .single();

        if (updateError || !updatedUser) {
          throw new Error("Failed to update user");
        }

        result = {
          success: true,
          user: formatUser(updatedUser),
          message: "Profile updated successfully",
        };
        break;
      }

      case "changePassword": {
        const session = await validateSession(
          requestData.sessionToken,
          supabase,
        );
        if (!session) {
          return proxyError(
            "Invalid or expired session",
            "INVALID_SESSION",
            401,
          );
        }

        const { data: user, error: userError } = await supabase
          .from("app_users")
          .select("*")
          .eq("id", session.app_user_id)
          .single();

        if (userError || !user) {
          return proxyError("User not found", "USER_NOT_FOUND", 404);
        }

        // Verify current password
        const validPassword = await bcrypt.compare(
          requestData.currentPassword,
          user.password_hash,
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

        await supabase
          .from("app_users")
          .update({ password_hash: newPasswordHash })
          .eq("id", user.id);

        // Invalidate all other sessions
        const currentTokenHash = hashToken(requestData.sessionToken);
        await supabase
          .from("app_sessions")
          .delete()
          .eq("app_user_id", user.id)
          .neq("token", currentTokenHash);

        result = {
          success: true,
          message: "Password changed successfully",
        };
        break;
      }

      case "forgotPassword": {
        const { data: user, error: userError } = await supabase
          .from("app_users")
          .select("*")
          .eq("project_id", projectId)
          .eq("email", requestData.email.toLowerCase())
          .single();

        // Always return success to prevent email enumeration
        if (user && !userError && user.active) {
          // Generate reset token
          const resetToken = randomBytes(32).toString("hex");
          const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

          await supabase
            .from("app_users")
            .update({
              reset_token: resetToken,
              reset_expires: resetExpires.toISOString(),
            })
            .eq("id", user.id);

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
        const { data: users, error: usersError } = await supabase
          .from("app_users")
          .select("*")
          .eq("project_id", projectId)
          .eq("reset_token", requestData.token)
          .gt("reset_expires", new Date().toISOString());

        const user = users?.[0];

        if (usersError || !user) {
          return proxyError(
            "Invalid or expired reset token",
            "INVALID_TOKEN",
            400,
          );
        }

        // Hash new password
        const newPasswordHash = await bcrypt.hash(requestData.newPassword, 12);

        await supabase
          .from("app_users")
          .update({
            password_hash: newPasswordHash,
            reset_token: null,
            reset_expires: null,
          })
          .eq("id", user.id);

        // Invalidate all sessions
        await supabase.from("app_sessions").delete().eq("app_user_id", user.id);

        result = {
          success: true,
          message:
            "Password reset successfully. Please log in with your new password.",
        };
        break;
      }

      case "verifyEmail": {
        const { data: users, error: usersError } = await supabase
          .from("app_users")
          .select("*")
          .eq("project_id", projectId)
          .eq("verify_token", requestData.token);

        const user = users?.[0];

        if (usersError || !user) {
          return proxyError("Invalid verification token", "INVALID_TOKEN", 400);
        }

        await supabase
          .from("app_users")
          .update({
            email_verified: true,
            verify_token: null,
          })
          .eq("id", user.id);

        result = {
          success: true,
          message: "Email verified successfully",
        };
        break;
      }

      case "deleteAccount": {
        const session = await validateSession(
          requestData.sessionToken,
          supabase,
        );
        if (!session) {
          return proxyError(
            "Invalid or expired session",
            "INVALID_SESSION",
            401,
          );
        }

        const { data: user, error: userError } = await supabase
          .from("app_users")
          .select("*")
          .eq("id", session.app_user_id)
          .single();

        if (userError || !user) {
          return proxyError("User not found", "USER_NOT_FOUND", 404);
        }

        // Verify password
        const validPassword = await bcrypt.compare(
          requestData.password,
          user.password_hash,
        );
        if (!validPassword) {
          return proxyError("Password is incorrect", "INVALID_PASSWORD", 401);
        }

        // Delete user and all sessions (cascade handled by DB)
        await supabase.from("app_users").delete().eq("id", user.id);

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
      service: "app_auth",
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
      service: "app_auth",
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

  const supabase = await createClient();

  await supabase.from("app_sessions").insert({
    app_user_id: appUserId,
    token: tokenHash,
    expires_at: expiresAt.toISOString(),
    user_agent: request.headers.get("user-agent") || undefined,
    ip_address:
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      undefined,
  });

  return { sessionToken: rawToken, expiresAt };
}

/**
 * Validate a session token and return the session if valid
 */
async function validateSession(
  rawToken: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const tokenHash = hashToken(rawToken);

  const { data: session, error: sessionError } = await supabase
    .from("app_sessions")
    .select("*")
    .eq("token", tokenHash)
    .single();

  if (sessionError || !session || new Date(session.expires_at) < new Date()) {
    // Clean up expired session
    if (session) {
      try {
        await supabase.from("app_sessions").delete().eq("id", session.id);
      } catch {}
    }
    return null;
  }

  // Update last active
  try {
    await supabase
      .from("app_sessions")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", session.id);
  } catch {}

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
  avatar_url: string | null;
  email_verified: boolean;
  metadata: unknown;
  created_at: string;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    emailVerified: user.email_verified,
    metadata: user.metadata,
    createdAt: user.created_at,
  };
}
