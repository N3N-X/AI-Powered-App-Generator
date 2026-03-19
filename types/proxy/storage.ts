import { z } from "zod";

// ============================================
// Storage Proxy Types
// ============================================

export const StorageUploadRequestSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  size: z.number().max(50 * 1024 * 1024), // 50MB max
  isPublic: z.boolean().default(false),
});
export type StorageUploadRequest = z.infer<typeof StorageUploadRequestSchema>;

export const StorageUploadResponseSchema = z.object({
  success: z.boolean(),
  uploadUrl: z.string(), // Presigned URL for upload
  fileUrl: z.string(), // Final URL after upload
  fileId: z.string(),
  expiresAt: z.string(),
});
export type StorageUploadResponse = z.infer<typeof StorageUploadResponseSchema>;

export const StorageDeleteRequestSchema = z.object({
  fileId: z.string(),
});
export type StorageDeleteRequest = z.infer<typeof StorageDeleteRequestSchema>;

export const StorageListRequestSchema = z.object({
  prefix: z.string().optional(),
  limit: z.number().max(100).default(20),
  cursor: z.string().optional(),
});
export type StorageListRequest = z.infer<typeof StorageListRequestSchema>;
