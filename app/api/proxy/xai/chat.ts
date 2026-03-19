import { AIProxyRequestSchema } from "@/types/proxy";
import {
  checkCredits,
  deductCredits,
  logProxyUsage,
  proxyError,
  proxySuccess,
} from "@/lib/proxy";
import type { HandlerContext } from "./types";

export async function handleChatCompletion(
  body: Record<string, unknown>,
  ctx: HandlerContext,
) {
  const { apiKeyId, projectId, userId, plan, xaiApiKey, startTime } = ctx;

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
        service: "xai",
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

    // 8 credits per 1K tokens
    const creditsUsed = actualUnits * 8;
    const deduction = await deductCredits(userId, "xai", creditsUsed);

    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: "xai",
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
      service: "xai",
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
