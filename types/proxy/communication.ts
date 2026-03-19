import { z } from "zod";

// ============================================
// Email Proxy Types
// ============================================

export const EmailProxyRequestSchema = z
  .object({
    to: z.union([z.string().email(), z.array(z.string().email())]).optional(),
    toOwner: z.boolean().optional(), // Send to app owner's notification email
    subject: z.string().min(1).max(500),
    text: z.string().optional(),
    html: z.string().optional(),
    from: z.string().optional(), // Will use platform default if not provided
    replyTo: z.string().email().optional(),
    cc: z.array(z.string().email()).optional(),
    bcc: z.array(z.string().email()).optional(),
    attachments: z
      .array(
        z.object({
          filename: z.string(),
          content: z.string(), // Base64 encoded
          contentType: z.string().optional(),
        }),
      )
      .optional(),
  })
  .refine((data) => data.to || data.toOwner, {
    message: "Either 'to' or 'toOwner' must be provided",
  });
export type EmailProxyRequest = z.infer<typeof EmailProxyRequestSchema>;

export const EmailProxyResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
  creditsUsed: z.number(),
});
export type EmailProxyResponse = z.infer<typeof EmailProxyResponseSchema>;

// ============================================
// SMS Proxy Types
// ============================================

export const SMSProxyRequestSchema = z.object({
  to: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Phone number must be in E.164 format"),
  message: z.string().min(1).max(1600),
  from: z.string().optional(), // Will use platform default if not provided
});
export type SMSProxyRequest = z.infer<typeof SMSProxyRequestSchema>;

export const SMSProxyResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
  creditsUsed: z.number(),
});
export type SMSProxyResponse = z.infer<typeof SMSProxyResponseSchema>;

// ============================================
// Push Notification Proxy Types
// ============================================

export const PushNotificationRequestSchema = z.object({
  tokens: z.array(z.string()).max(500),
  title: z.string().max(100),
  body: z.string().max(500),
  data: z.record(z.string()).optional(),
  badge: z.number().optional(),
  sound: z.string().optional(),
  priority: z.enum(["default", "high"]).default("default"),
});
export type PushNotificationRequest = z.infer<
  typeof PushNotificationRequestSchema
>;

export const PushNotificationResponseSchema = z.object({
  success: z.boolean(),
  successCount: z.number(),
  failureCount: z.number(),
  creditsUsed: z.number(),
});
export type PushNotificationResponse = z.infer<
  typeof PushNotificationResponseSchema
>;
