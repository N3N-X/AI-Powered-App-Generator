import { NextRequest } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import {
  extractProxyAuth,
  checkProxyRateLimit,
  hasServiceAccess,
  proxyError,
  proxyCorsOptions,
} from "@/lib/proxy";
import { handleChatCompletion } from "./chat";
import { handleImageGeneration } from "./image";

// Handle CORS preflight requests
export async function OPTIONS() {
  return proxyCorsOptions();
}

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  const startTime = Date.now();

  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { apiKeyId, projectId, userId, plan, services } = auth.context;

  if (!hasServiceAccess(services, "xai")) {
    return proxyError(
      "This API key does not have access to the xAI service",
      "FORBIDDEN",
      403,
    );
  }

  const rateLimit = await checkProxyRateLimit(projectId, "xai");
  if (!rateLimit.success) {
    return proxyError(
      `Rate limit exceeded. Try again in ${Math.ceil((rateLimit.reset - Date.now()) / 1000)}s`,
      "RATE_LIMITED",
      429,
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return proxyError("Invalid JSON body", "INVALID_REQUEST", 400);
  }

  const xaiApiKey = process.env.XAI_API_KEY;
  if (!xaiApiKey) {
    return proxyError("xAI service not configured", "SERVICE_UNAVAILABLE", 503);
  }

  // Check if this is an image generation request
  if (body.operation === "image" || body.prompt) {
    return handleImageGeneration(body, {
      apiKeyId,
      projectId,
      userId,
      plan,
      xaiApiKey,
      startTime,
    });
  }

  // Otherwise, handle as chat completion
  return handleChatCompletion(body, {
    apiKeyId,
    projectId,
    userId,
    plan,
    xaiApiKey,
    startTime,
  });
}
