import { z } from "zod";
import { AIModelEnum, BuildPlatformEnum } from "./enums";
import { CodeFilesSchema } from "./models";

// ============================================
// API Request/Response Types
// ============================================

// Vibe Generate
export const GenerateRequestSchema = z.object({
  prompt: z.string().min(1).max(10000),
  projectId: z.string(),
  model: AIModelEnum.optional(),
});
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

export const GenerateResponseSchema = z.object({
  success: z.boolean(),
  codeFiles: CodeFilesSchema.optional(),
  message: z.string().optional(),
  tokensUsed: z.number().optional(),
});
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;

// Build Request
export const BuildRequestSchema = z.object({
  projectId: z.string(),
  platform: BuildPlatformEnum,
  profile: z
    .enum(["development", "preview", "production"])
    .default("production"),
});
export type BuildRequest = z.infer<typeof BuildRequestSchema>;

// GitHub
export const CreateRepoRequestSchema = z.object({
  projectId: z.string(),
  repoName: z.string().min(1).max(100),
  isPrivate: z.boolean().default(true),
  description: z.string().max(500).optional(),
});
export type CreateRepoRequest = z.infer<typeof CreateRepoRequestSchema>;

export const PushCodeRequestSchema = z.object({
  projectId: z.string(),
  commitMessage: z.string().min(1).max(500).default("Update from Rulxy"),
});
export type PushCodeRequest = z.infer<typeof PushCodeRequestSchema>;

// Credentials
export const AppleCredentialSchema = z.object({
  name: z.string().min(1),
  keyId: z.string().min(1),
  issuerId: z.string().min(1),
  p8Key: z.string().min(1),
  teamId: z.string().optional(),
  bundleId: z.string().optional(),
});
export type AppleCredential = z.infer<typeof AppleCredentialSchema>;

export const GoogleCredentialSchema = z.object({
  name: z.string().min(1),
  serviceAccountJson: z.string().min(1),
  packageName: z.string().optional(),
});
export type GoogleCredential = z.infer<typeof GoogleCredentialSchema>;

// Preview
export const PreviewRequestSchema = z.object({
  code: z.string(),
  entryFile: z.string().default("App.tsx"),
});
export type PreviewRequest = z.infer<typeof PreviewRequestSchema>;
