import { z } from "zod";

// ============================================
// Search Types
// ============================================

export const SearchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  type: z.enum(["web", "image", "news"]).default("web"),
  num: z.number().min(1).max(20).default(10),
  start: z.number().optional(),
  dateRestrict: z.string().optional(), // e.g., "d7" for last 7 days
  gl: z.string().optional(), // Country code
  hl: z.string().optional(), // Language
});
export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export const SearchResponseSchema = z.object({
  results: z.array(
    z.object({
      title: z.string(),
      link: z.string(),
      snippet: z.string(),
      thumbnail: z.string().optional(),
    }),
  ),
  totalResults: z.number().optional(),
  creditsUsed: z.number(),
});
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
