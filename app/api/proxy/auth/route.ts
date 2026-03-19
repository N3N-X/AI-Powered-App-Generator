import { NextRequest } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
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
import { AppAuthProxyRequestSchema } from "@/types/proxy";
import { type AuthResult } from "./helpers";
import {
  handleSignup,
  handleLogin,
  handleLogout,
  handleAnonymousSession,
  handleDeleteAccount,
} from "./handlers-account";
import {
  handleMe,
  handleUpdateProfile,
  handleChangePassword,
  handleForgotPassword,
  handleResetPassword,
  handleVerifyEmail,
} from "./handlers-session";

// Handle CORS preflight requests
export async function OPTIONS() {
  return proxyCorsOptions();
}

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 60, window: 60_000 });
  if (limited) return limited;

  const startTime = Date.now();

  // Authenticate
  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    console.error("Auth proxy: API key auth failed:", auth.error);
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { apiKeyId, projectId, userId, plan, services } = auth.context;

  // Check service access
  if (!hasServiceAccess(services, "auth")) {
    return proxyError(
      "This API key does not have access to the Auth service",
      "FORBIDDEN",
      403,
    );
  }

  // Check rate limit
  const rateLimit = await checkProxyRateLimit(projectId, "auth");
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
    console.error(
      "Auth proxy validation error:",
      JSON.stringify({ body, errors: parsed.error.errors }, null, 2),
    );
    return proxyError(
      `Validation error: ${parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
      "VALIDATION_ERROR",
      400,
    );
  }

  const requestData = parsed.data;

  // Check credits (1 credit per operation)
  const creditCheck = await checkCredits(userId, plan, "auth", 1);
  if (!creditCheck.hasCredits) {
    return proxyError(
      `Insufficient credits. Required: 1, Available: ${creditCheck.available}`,
      "INSUFFICIENT_CREDITS",
      402,
    );
  }

  try {
    let result: AuthResult | Response;

    switch (requestData.operation) {
      case "signup":
        result = await handleSignup(requestData, projectId, request);
        break;
      case "login":
        result = await handleLogin(requestData, projectId, request);
        break;
      case "logout":
        result = await handleLogout(requestData);
        break;
      case "me":
        result = await handleMe(requestData);
        break;
      case "updateProfile":
        result = await handleUpdateProfile(requestData);
        break;
      case "changePassword":
        result = await handleChangePassword(requestData);
        break;
      case "forgotPassword":
        result = await handleForgotPassword(requestData, projectId);
        break;
      case "resetPassword":
        result = await handleResetPassword(requestData, projectId);
        break;
      case "verifyEmail":
        result = await handleVerifyEmail(requestData, projectId);
        break;
      case "anonymousSession":
        result = await handleAnonymousSession(projectId, request);
        break;
      case "deleteAccount":
        result = await handleDeleteAccount(requestData);
        break;
      default:
        return proxyError("Unknown operation", "INVALID_OPERATION", 400);
    }

    // If handler returned a Response (error), return it directly
    if (result instanceof Response) {
      return result;
    }

    // Deduct credits
    const deduction = await deductCredits(userId, "auth", 1);

    // Log usage
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: "auth",
      operation: requestData.operation,
      creditsUsed: 1,
      success: true,
      metadata: { operation: requestData.operation },
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
      service: "auth",
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
