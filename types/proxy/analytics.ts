import { z } from "zod";

// ============================================
// Analytics Proxy Types
// ============================================

export const AnalyticsEventRequestSchema = z.object({
  events: z
    .array(
      z.object({
        name: z.string().max(100),
        properties: z.record(z.unknown()).optional(),
        timestamp: z.string().optional(),
        userId: z.string().optional(),
        deviceId: z.string().optional(),
      }),
    )
    .max(100),
});
export type AnalyticsEventRequest = z.infer<typeof AnalyticsEventRequestSchema>;

export const AnalyticsEventResponseSchema = z.object({
  success: z.boolean(),
  eventsProcessed: z.number(),
  creditsUsed: z.number(),
});
export type AnalyticsEventResponse = z.infer<
  typeof AnalyticsEventResponseSchema
>;
