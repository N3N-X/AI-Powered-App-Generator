import { randomBytes } from "crypto";
import {
  checkCredits,
  deductCredits,
  logProxyUsage,
  proxyError,
  proxySuccess,
} from "@/lib/proxy";
import {
  uploadToR2,
  getPublicUrl,
  getStorageLimit,
  getStorageUsage,
} from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/server";
import type { HandlerContext } from "./types";
import type { Plan } from "@/types";

export async function handleImageGeneration(
  body: Record<string, unknown>,
  ctx: HandlerContext,
) {
  const { apiKeyId, projectId, userId, plan, xaiApiKey, startTime } = ctx;

  const prompt = body.prompt as string;
  if (!prompt || typeof prompt !== "string") {
    return proxyError(
      "prompt is required for image generation",
      "VALIDATION_ERROR",
      400,
    );
  }

  const IMAGE_CREDIT_COST = 50;

  const creditCheck = await checkCredits(
    userId,
    plan,
    "xai",
    IMAGE_CREDIT_COST,
  );
  if (!creditCheck.hasCredits) {
    return proxyError(
      `Insufficient credits. Required: ${creditCheck.required}, Available: ${creditCheck.available}`,
      "INSUFFICIENT_CREDITS",
      402,
    );
  }

  try {
    const xaiResponse = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${xaiApiKey}`,
      },
      body: JSON.stringify({
        model: "grok-imagine-image",
        prompt,
        n: 1,
        response_format: "url",
      }),
    });

    if (!xaiResponse.ok) {
      const errorData = await xaiResponse.json().catch(() => ({}));
      const errorMessage =
        (errorData as { error?: { message?: string } })?.error?.message ||
        "xAI image generation failed";

      await logProxyUsage({
        apiKeyId,
        projectId,
        userId,
        service: "xai",
        operation: "image.generation",
        creditsUsed: 0,
        success: false,
        errorCode: `XAI_${xaiResponse.status}`,
        metadata: { promptLength: prompt.length },
        latencyMs: Date.now() - startTime,
      });

      return proxyError(errorMessage, "XAI_ERROR", xaiResponse.status);
    }

    const data = await xaiResponse.json();
    const tempUrl = data.data?.[0]?.url;

    if (!tempUrl) {
      return proxyError("No image URL returned from xAI", "XAI_ERROR", 500);
    }

    const permanentUrl = await uploadGeneratedImage(
      tempUrl,
      projectId,
      userId,
      prompt,
      plan,
    );

    const deduction = await deductCredits(userId, "xai", IMAGE_CREDIT_COST);

    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: "xai",
      operation: "image.generation",
      creditsUsed: IMAGE_CREDIT_COST,
      success: true,
      metadata: { promptLength: prompt.length, imageUrl: permanentUrl },
      latencyMs: Date.now() - startTime,
    });

    return proxySuccess({
      url: permanentUrl,
      prompt,
      creditsUsed: IMAGE_CREDIT_COST,
      creditsRemaining: deduction.newBalance,
    });
  } catch (error) {
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: "xai",
      operation: "image.generation",
      creditsUsed: 0,
      success: false,
      errorCode:
        error instanceof Error &&
        error.message.toLowerCase().includes("storage limit")
          ? "STORAGE_LIMIT"
          : "NETWORK_ERROR",
      metadata: { error: error instanceof Error ? error.message : "Unknown" },
      latencyMs: Date.now() - startTime,
    });

    return proxyError(
      error instanceof Error ? error.message : "Failed to generate image",
      error instanceof Error &&
        error.message.toLowerCase().includes("storage limit")
        ? "STORAGE_LIMIT"
        : "SERVICE_UNAVAILABLE",
      error instanceof Error &&
        error.message.toLowerCase().includes("storage limit")
        ? 413
        : 503,
    );
  }
}

async function uploadGeneratedImage(
  tempUrl: string,
  projectId: string,
  userId: string,
  prompt: string,
  plan: Plan,
): Promise<string> {
  const imageResponse = await fetch(tempUrl);
  if (!imageResponse.ok) {
    throw new Error(
      `Failed to download generated image: ${imageResponse.status}`,
    );
  }

  const contentType = imageResponse.headers.get("content-type") || "image/png";
  const ext =
    contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
  const buffer = Buffer.from(await imageResponse.arrayBuffer());

  const supabase = createAdminClient();
  const usedStorage = await getStorageUsage(supabase, projectId);
  const storageLimit = getStorageLimit(plan);
  if (usedStorage + buffer.length > storageLimit) {
    throw new Error(
      `Storage limit exceeded. Used: ${Math.round(usedStorage / 1024 / 1024)}MB, Limit: ${Math.round(storageLimit / 1024 / 1024)}MB`,
    );
  }

  const fileId = randomBytes(16).toString("hex");
  const filename = `ai-generated-${fileId.slice(0, 8)}.${ext}`;
  const key = `${projectId}/${fileId}.${ext}`;

  await uploadToR2(key, buffer, contentType);
  const permanentUrl = getPublicUrl(key);

  await supabase.from("storage_files").insert({
    id: fileId,
    filename,
    content_type: contentType,
    size: buffer.length,
    bucket: process.env.STORAGE_BUCKET || "rux-storage",
    key,
    url: permanentUrl,
    is_public: true,
    project_id: projectId,
    user_id: userId,
    metadata: {
      source: "ai-generated",
      prompt: prompt.slice(0, 500),
    },
  });

  return permanentUrl;
}
