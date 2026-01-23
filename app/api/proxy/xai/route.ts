import { NextRequest } from "next/server";
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
import { AIProxyRequestSchema } from "@/types/proxy";
import type { ProxyService } from "@/lib/supabase/types";

/**
 * @swagger
 * /api/proxy/xai:
 *   post:
 *     summary: xAI Grok Chat Completions Proxy (DEFAULT AI)
 *     description: |
 *       Proxied access to xAI's Grok chat completions API. This is the PRIMARY/DEFAULT
 *       AI service for RUX apps. Generated apps can use this endpoint without needing
 *       their own xAI API key.
 *
 *       **Authentication:** Requires a valid RUX API key.
 *       **Rate Limits:** 60 requests per minute per project.
 *       **Credits:** 8 credits per 1K tokens (cheaper than OpenAI).
 *     tags:
 *       - Proxy Services
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               model:
 *                 type: string
 *                 default: grok-3-fast-beta
 *                 description: xAI model (grok-3-fast-beta, grok-2)
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [system, user, assistant]
 *                     content:
 *                       type: string
 *               temperature:
 *                 type: number
 *               max_tokens:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Successful completion
 *       401:
 *         description: Unauthorized
 *       402:
 *         description: Insufficient credits
 *       429:
 *         description: Rate limit exceeded
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { apiKeyId, projectId, userId, plan, services } = auth.context;

  if (!hasServiceAccess(services, "XAI)) {
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

  const parsed = AIProxyRequestSchema.safeParse({
    ...body,
    provider: "xai",
  });
  if (!parsed.success) {
    return proxyError(
      `Validation error: ${parsed.error.errors[0]?.message}`,
      "VALIDATION_ERROR",
      400,
    );
  }

  const { model, messages, temperature, max_tokens } = parsed.data;
  const xaiModel = model || "grok-3-fast-beta";

  const estimatedTokens = messages.reduce(
    (acc, m) => acc + Math.ceil(m.content.length / 4),
    0,
  );
  const estimatedUnits = Math.ceil(estimatedTokens / 1000);

  const creditCheck = await checkCredits(userId, plan, "xai", estimatedUnits);
  if (!creditCheck.hasCredits) {
    return proxyError(
      `Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}`,
      "INSUFFICIENT_CREDITS",
      402,
    );
  }

  const xaiApiKey = process.env.XAI_API_KEY;
  if (!xaiApiKey) {
    return proxyError("xAI service not configured", "SERVICE_UNAVAILABLE", 503);
  }

  try {
    const xaiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify({
        model: xaiModel,
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 4096,
      }),
    });

    if (!xaiResponse.ok) {
      const errorData = await xaiResponse.json().catch(() => ({}));
      const errorMessage =
        (errorData as { error?: { message?: string } })?.error?.message ||
        "xAI API error";

      await logProxyUsage({
        apiKeyId,
        projectId,
        userId,
        service: "XAI,
        operation: "chat.completions",
        creditsUsed: 0,
        success: false,
        errorCode: `XAI_${xaiResponse.status}`,
        metadata: { model: xaiModel, messageCount: messages.length },
        latencyMs: Date.now() - startTime,
      });

      return proxyError(errorMessage, "XAI_ERROR", xaiResponse.status);
    }

    const data = await xaiResponse.json();
    const totalTokens = data.usage?.total_tokens || estimatedTokens;
    const actualUnits = Math.ceil(totalTokens / 1000);

    // 8 credits per 1K tokens (cheaper than OpenAI)
    const creditsUsed = actualUnits * 8;
    const deduction = await deductCredits(userId, "xai", creditsUsed);

    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: "XAI,
      operation: "chat.completions",
      creditsUsed,
      success: true,
      metadata: {
        model: xaiModel,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens,
      },
      latencyMs: Date.now() - startTime,
    });

    return proxySuccess({
      ...data,
      creditsUsed,
      creditsRemaining: deduction.newBalance,
    });
  } catch (error) {
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: "XAI,
      operation: "chat.completions",
      creditsUsed: 0,
      success: false,
      errorCode: "NETWORK_ERROR",
      metadata: { error: error instanceof Error ? error.message : "Unknown" },
      latencyMs: Date.now() - startTime,
    });

    return proxyError("Failed to connect to xAI", "SERVICE_UNAVAILABLE", 503);
  }
}
