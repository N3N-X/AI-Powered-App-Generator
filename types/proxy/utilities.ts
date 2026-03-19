import { z } from "zod";

// ============================================
// Utility Types
// ============================================

export const QRCodeRequestSchema = z.object({
  data: z.string().min(1).max(2000),
  size: z.number().min(100).max(1000).default(300),
  format: z.enum(["png", "svg"]).default("png"),
  errorCorrection: z.enum(["L", "M", "Q", "H"]).default("M"),
});
export type QRCodeRequest = z.infer<typeof QRCodeRequestSchema>;

export const WeatherRequestSchema = z.object({
  location: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  units: z.enum(["metric", "imperial"]).default("metric"),
});
export type WeatherRequest = z.infer<typeof WeatherRequestSchema>;

export const TranslateRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  source: z.string().optional(), // Auto-detect if not provided
  target: z.string(),
});
export type TranslateRequest = z.infer<typeof TranslateRequestSchema>;

export const CurrencyRequestSchema = z.object({
  from: z.string().length(3),
  to: z.string().length(3),
  amount: z.number().positive().default(1),
});
export type CurrencyRequest = z.infer<typeof CurrencyRequestSchema>;
