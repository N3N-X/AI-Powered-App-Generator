import { z } from "zod";

// ============================================
// AI Model Types (XAI Primary)
// ============================================

export const XAIModels = ["grok-beta", "grok-2", "grok-2-mini"] as const;
export const OpenAIModels = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "o1-preview",
  "o1-mini",
] as const;
export const AnthropicModels = [
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "claude-3-opus-20240229",
] as const;
export const GoogleAIModels = [
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
] as const;
export const GroqModels = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
] as const;
export const MistralModels = [
  "mistral-large-latest",
  "mistral-medium-latest",
  "mistral-small-latest",
] as const;

export const AIProxyRequestSchema = z.object({
  provider: z.enum([
    "xai",
    "openai",
    "anthropic",
    "google_ai",
    "groq",
    "cohere",
    "mistral",
    "perplexity",
  ]),
  model: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    }),
  ),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).max(16384).optional(),
  stream: z.boolean().optional().default(false),
});
export type AIProxyRequest = z.infer<typeof AIProxyRequestSchema>;

export const AIProxyResponseSchema = z.object({
  id: z.string(),
  provider: z.string(),
  model: z.string(),
  choices: z.array(
    z.object({
      message: z.object({
        role: z.string(),
        content: z.string(),
      }),
      finish_reason: z.string(),
    }),
  ),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
  creditsUsed: z.number(),
});
export type AIProxyResponse = z.infer<typeof AIProxyResponseSchema>;

// ============================================
// Image Generation Types
// ============================================

export const ImageGenerationRequestSchema = z.object({
  provider: z.enum(["dall_e", "stable_diffusion", "midjourney", "flux"]),
  prompt: z.string().min(1).max(4000),
  negative_prompt: z.string().optional(),
  size: z
    .enum(["256x256", "512x512", "1024x1024", "1024x1792", "1792x1024"])
    .default("1024x1024"),
  n: z.number().min(1).max(4).default(1),
  style: z.string().optional(),
  quality: z.enum(["standard", "hd"]).optional(),
});
export type ImageGenerationRequest = z.infer<
  typeof ImageGenerationRequestSchema
>;

export const ImageGenerationResponseSchema = z.object({
  images: z.array(
    z.object({
      url: z.string(),
      revised_prompt: z.string().optional(),
    }),
  ),
  creditsUsed: z.number(),
});
export type ImageGenerationResponse = z.infer<
  typeof ImageGenerationResponseSchema
>;
