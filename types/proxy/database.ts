import { z } from "zod";

// ============================================
// Generic Database Proxy Types (Collections & Documents)
// ============================================

export const DatabaseOperationEnum = z.enum([
  "create",
  "findOne",
  "findMany",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "count",
  "seed",
]);
export type DatabaseOperation = z.infer<typeof DatabaseOperationEnum>;

export const DatabaseProxyRequestSchema = z.object({
  collection: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, {
      message:
        "Collection name must start with a letter and contain only alphanumeric characters and underscores",
    }),
  operation: DatabaseOperationEnum,
  data: z
    .union([z.record(z.unknown()), z.array(z.record(z.unknown()))])
    .optional(), // For create/update/seed
  filter: z.record(z.unknown()).optional(), // For find/update/delete
  scope: z.enum(["global", "user", "all"]).optional().default("all"), // Content scope filtering
  sessionToken: z.string().nullable().optional(), // Required for user-scoped operations
  options: z
    .object({
      limit: z.number().min(1).max(100).default(20),
      skip: z.number().min(0).default(0),
      sort: z.record(z.enum(["asc", "desc"])).optional(),
    })
    .optional(),
});
export type DatabaseProxyRequest = z.infer<typeof DatabaseProxyRequestSchema>;

export const DatabaseProxyResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .union([
      z.record(z.unknown()), // Single document
      z.array(z.record(z.unknown())), // Multiple documents
      z.null(),
    ])
    .optional(),
  count: z.number().optional(),
  creditsUsed: z.number(),
});
export type DatabaseProxyResponse = z.infer<typeof DatabaseProxyResponseSchema>;
