import { z } from "zod";

// ============================================
// Content API Types
// ============================================

export const NewsRequestSchema = z.object({
  query: z.string().optional(),
  category: z
    .enum([
      "general",
      "business",
      "technology",
      "sports",
      "entertainment",
      "health",
      "science",
    ])
    .optional(),
  country: z.string().optional(),
  pageSize: z.number().min(1).max(100).default(10),
});
export type NewsRequest = z.infer<typeof NewsRequestSchema>;

export const StocksRequestSchema = z.object({
  symbol: z.string(),
  interval: z
    .enum([
      "1min",
      "5min",
      "15min",
      "30min",
      "60min",
      "daily",
      "weekly",
      "monthly",
    ])
    .default("daily"),
});
export type StocksRequest = z.infer<typeof StocksRequestSchema>;

export const CryptoRequestSchema = z.object({
  symbols: z.array(z.string()).max(10),
  convert: z.string().default("USD"),
});
export type CryptoRequest = z.infer<typeof CryptoRequestSchema>;

export const MoviesRequestSchema = z.object({
  query: z.string().optional(),
  id: z.number().optional(),
  type: z.enum(["movie", "tv"]).default("movie"),
  category: z
    .enum(["popular", "top_rated", "upcoming", "now_playing"])
    .optional(),
});
export type MoviesRequest = z.infer<typeof MoviesRequestSchema>;
