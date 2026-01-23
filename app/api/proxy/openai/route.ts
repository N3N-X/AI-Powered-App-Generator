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
 * /api/proxy/openai:
 *   post:
 *     summary: OpenAI Chat Completions Proxy
 *     description: |
 *       Proxied access to OpenAI's chat completions API. Generated apps can use this
 *       endpoint without needing their own OpenAI API key. Usage is tracked and
 *       deducted from the project's credit balance.
 *
 *       **Authentication:** Requires a valid RUX API key in the `x-rux-api-key` header
 *       or as a Bearer token in the `Authorization` header.
 *
 *       **Rate Limits:** 60 requests per minute per project.
 *
 *       **Credits:** 10 credits per 1K tokens used.
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
 *                 default: gpt-4o-mini
 *                 description: OpenAI model to use (gpt-4o-mini, gpt-4o, gpt-3.5-turbo)
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
 *                 minimum: 0
 *                 maximum: 2
 *                 description: Sampling temperature
 *               max_tokens:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 4096
 *                 description: Maximum tokens to generate
 *               stream:
 *                 type: boolean
 *                 default: false
 *                 description: Whether to stream the response
 *     responses:
 *       200:
 *         description: Successful completion
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 choices:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       message:
 *                         type: object
 *                         properties:
 *                           role:
 *                             type: string
 *                           content:
 *                             type: string
 *                       finish_reason:
 *                         type: string
 *                 usage:
 *                   type: object
 *                   properties:
 *                     prompt_tokens:
 *                       type: integer
 *                     completion_tokens:
 *                       type: integer
 *                     total_tokens:
 *                       type: integer
 *                 creditsUsed:
 *                   type: integer
 *                   description: Credits deducted for this request
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid or missing API key
 *       402:
 *         description: Insufficient credits
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: OpenAI API error
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
  if (!hasServiceAccess(services, "openai")) {
    return proxyError(
      "This API key does not have access to the OpenAI service",
      "FORBIDDEN",
      403,
    );
  }

  // Check rate limit
  const rateLimit = await checkProxyRateLimit(projectId, "openai");
  if (!rateLimit.success) {
    return proxyError(
      `Rate limit exceeded. Try again in ${Math.ceil((rateLimit.reset - Date.now()) / 1000)}s`,
      "RATE_LIMITED",
      429,
    );
  }

  // Parse and validate request
  let body;
  try {
    body = await request.json();
  } catch {
    return proxyError("Invalid JSON body", "INVALID_REQUEST", 400);
  }

  const parsed = AIProxyRequestSchema.safeParse({
    ...body,
    provider: "openai",
  });
  if (!parsed.success) {
    return proxyError(
      `Validation error: ${parsed.error.errors[0]?.message}`,
      "VALIDATION_ERROR",
      400,
    );
  }

  const { model, messages, temperature, max_tokens } = parsed.data;
  const openaiModel = model || "gpt-4o-mini"; // Default model for OpenAI

  // Estimate tokens for credit check (rough estimate)
  const estimatedTokens = messages.reduce(
    (acc, m) => acc + Math.ceil(m.content.length / 4),
    0,
  );
  const estimatedUnits = Math.ceil(estimatedTokens / 1000);

  // Check credits
  const creditCheck = await checkCredits(
    userId,
    plan,
    "openai",
    estimatedUnits,
  );
  if (!creditCheck.hasCredits) {
    return proxyError(
      `Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}`,
      "INSUFFICIENT_CREDITS",
      402,
    );
  }

  // Call OpenAI API
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return proxyError(
      "OpenAI service not configured",
      "SERVICE_UNAVAILABLE",
      503,
    );
  }

  try {
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          messages,
          temperature,
          max_tokens,
          stream: false, // We don't support streaming yet
        }),
      },
    );

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      const errorMessage =
        (errorData as { error?: { message?: string } })?.error?.message ||
        "OpenAI API error";

      await logProxyUsage({
        apiKeyId,
        projectId,
        userId,
        service: "openai",
        operation: "chat.completions",
        creditsUsed: 0,
        success: false,
        errorCode: `OPENAI_${openaiResponse.status}`,
        metadata: { model, messageCount: messages.length },
        latencyMs: Date.now() - startTime,
      });

      return proxyError(errorMessage, "OPENAI_ERROR", openaiResponse.status);
    }

    const data = await openaiResponse.json();
    const totalTokens = data.usage?.total_tokens || estimatedTokens;
    const actualUnits = Math.ceil(totalTokens / 1000);

    // Deduct credits based on actual usage
    const deduction = await deductCredits(userId, "openai", actualUnits);

    // Log usage
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: "openai",
      operation: "chat.completions",
      creditsUsed: actualUnits * 10, // 10 credits per 1K tokens
      success: true,
      metadata: {
        model,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
        totalTokens,
      },
      latencyMs: Date.now() - startTime,
    });

    return proxySuccess({
      ...data,
      creditsUsed: actualUnits * 10,
      creditsRemaining: deduction.newBalance,
    });
  } catch (error) {
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: "openai",
      operation: "chat.completions",
      creditsUsed: 0,
      success: false,
      errorCode: "NETWORK_ERROR",
      metadata: { error: error instanceof Error ? error.message : "Unknown" },
      latencyMs: Date.now() - startTime,
    });

    return proxyError(
      "Failed to connect to OpenAI",
      "SERVICE_UNAVAILABLE",
      503,
    );
  }
}
