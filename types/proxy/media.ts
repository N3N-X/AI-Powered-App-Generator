import { z } from "zod";

// ============================================
// Media Processing Types
// ============================================

export const TranscribeRequestSchema = z.object({
  audio_url: z.string().url().optional(),
  audio_base64: z.string().optional(),
  language: z.string().optional(),
  response_format: z.enum(["json", "text", "srt", "vtt"]).default("json"),
});
export type TranscribeRequest = z.infer<typeof TranscribeRequestSchema>;

export const TTSRequestSchema = z.object({
  text: z.string().min(1).max(4096),
  voice: z.string().default("alloy"),
  model: z.string().default("tts-1"),
  speed: z.number().min(0.25).max(4).default(1),
  response_format: z.enum(["mp3", "opus", "aac", "flac"]).default("mp3"),
});
export type TTSRequest = z.infer<typeof TTSRequestSchema>;

export const PDFGenerateRequestSchema = z.object({
  html: z.string().optional(),
  url: z.string().url().optional(),
  options: z
    .object({
      format: z.enum(["A4", "Letter", "Legal"]).default("A4"),
      landscape: z.boolean().default(false),
      margin: z
        .object({
          top: z.string().optional(),
          right: z.string().optional(),
          bottom: z.string().optional(),
          left: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});
export type PDFGenerateRequest = z.infer<typeof PDFGenerateRequestSchema>;

export const OCRRequestSchema = z.object({
  image_url: z.string().url().optional(),
  image_base64: z.string().optional(),
  language: z.string().optional(),
});
export type OCRRequest = z.infer<typeof OCRRequestSchema>;
