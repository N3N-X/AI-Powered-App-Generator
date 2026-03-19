import { uploadToR2, getPublicUrl } from "@/lib/storage";
import crypto from "crypto";

export async function callGrok(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 16384,
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY not configured");

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4-1-fast-reasoning",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

async function uploadImageToR2(imageUrl: string): Promise<string> {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.status}`);
  }

  const contentType = imageResponse.headers.get("content-type") || "image/png";
  const ext =
    contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";
  const buffer = Buffer.from(await imageResponse.arrayBuffer());

  const filename = `blog-${crypto.randomUUID()}.${ext}`;
  const key = `blog/covers/${filename}`;

  await uploadToR2(key, buffer, contentType);

  return getPublicUrl(key);
}

export async function generateCoverImage(prompt: string): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY not configured");

  const response = await fetch("https://api.x.ai/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-imagine-image",
      prompt,
      n: 1,
      response_format: "url",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok Image API error: ${error}`);
  }

  const data = await response.json();
  const tempUrl = data.data?.[0]?.url;
  if (!tempUrl) throw new Error("No image URL returned from xAI");

  const permanentUrl = await uploadImageToR2(tempUrl);
  return permanentUrl;
}

export function parseJsonResponse(raw: string): Record<string, unknown> {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
  }
  return JSON.parse(cleaned);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
