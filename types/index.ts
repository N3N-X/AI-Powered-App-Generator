import { z } from "zod";
import type {
  Plan as PlanType,
  ProxyService as ProxyServiceType,
} from "@/lib/supabase/types";

// Re-export Supabase types
export type Plan = PlanType;
export type ProxyService = ProxyServiceType;

// ============================================
// Enums
// ============================================

export const PlanEnum = z.enum(["FREE", "PRO", "ELITE"]);

export const BuildStatusEnum = z.enum([
  "PENDING",
  "QUEUED",
  "BUILDING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
]);
export type BuildStatus = z.infer<typeof BuildStatusEnum>;

export const BuildPlatformEnum = z.enum(["ANDROID", "IOS"]);
export type BuildPlatform = z.infer<typeof BuildPlatformEnum>;

export const AIModelEnum = z.enum(["grok", "claude"]);
export type AIModel = z.infer<typeof AIModelEnum>;

export const RoleEnum = z.enum(["USER", "ADMIN"]);
export type Role = z.infer<typeof RoleEnum>;

export const PlatformEnum = z.enum(["WEB", "IOS", "ANDROID"]);
export type Platform = z.infer<typeof PlatformEnum>;

// ============================================
// Schema Types
// ============================================

export const CodeFilesSchema = z.record(z.string(), z.string());
export type CodeFiles = z.infer<typeof CodeFilesSchema>;

export const AppConfigSchema = z.object({
  name: z.string(),
  slug: z.string(),
  version: z.string(),
  orientation: z.enum(["portrait", "landscape", "default"]).optional(),
  icon: z.string().optional(),
  splash: z
    .object({
      image: z.string().optional(),
      backgroundColor: z.string().optional(),
    })
    .optional(),
  ios: z
    .object({
      bundleIdentifier: z.string().optional(),
      supportsTablet: z.boolean().optional(),
    })
    .optional(),
  android: z
    .object({
      package: z.string().optional(),
      adaptiveIcon: z
        .object({
          foregroundImage: z.string().optional(),
          backgroundColor: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});
export type AppConfig = z.infer<typeof AppConfigSchema>;

// ============================================
// API Request/Response Types
// ============================================

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

export const RefineRequestSchema = z.object({
  prompt: z.string().min(1).max(10000),
  projectId: z.string(),
  targetFiles: z.array(z.string()).optional(),
  model: AIModelEnum.optional(),
});
export type RefineRequest = z.infer<typeof RefineRequestSchema>;

export const BuildRequestSchema = z.object({
  projectId: z.string(),
  platform: BuildPlatformEnum,
  profile: z
    .enum(["development", "preview", "production"])
    .default("production"),
});
export type BuildRequest = z.infer<typeof BuildRequestSchema>;

export const CreateRepoRequestSchema = z.object({
  projectId: z.string(),
  repoName: z.string().min(1).max(100),
  isPrivate: z.boolean().default(true),
  description: z.string().max(500).optional(),
});
export type CreateRepoRequest = z.infer<typeof CreateRepoRequestSchema>;

export const PushCodeRequestSchema = z.object({
  projectId: z.string(),
  commitMessage: z.string().min(1).max(500).default("Update from RUX"),
});
export type PushCodeRequest = z.infer<typeof PushCodeRequestSchema>;

export const AppleCredentialSchema = z.object({
  name: z.string().min(1),
  keyId: z.string().min(1),
  issuerId: z.string().min(1),
  p8Key: z.string().min(1),
  teamId: z.string().min(1),
  bundleId: z.string().optional(),
});
export type AppleCredential = z.infer<typeof AppleCredentialSchema>;

export const GoogleCredentialSchema = z.object({
  name: z.string().min(1),
  serviceAccountJson: z.string().min(1),
  packageName: z.string().optional(),
});
export type GoogleCredential = z.infer<typeof GoogleCredentialSchema>;

export const ExpoCredentialSchema = z.object({
  name: z.string().min(1),
  accessToken: z.string().min(1),
  username: z.string().optional(),
});
export type ExpoCredential = z.infer<typeof ExpoCredentialSchema>;

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.date(),
  model: AIModelEnum.optional(),
  codeChanges: CodeFilesSchema.optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const PreviewRequestSchema = z.object({
  code: z.string(),
  entryFile: z.string().default("App.tsx"),
});
export type PreviewRequest = z.infer<typeof PreviewRequestSchema>;

// ============================================
// Plan Limits
// ============================================

export interface PlanLimits {
  monthlyCredits: number;
  creditsRefresh: boolean;
  maxProjects: number;
  maxFilesPerProject: number;
  priorityQueue: boolean;
  githubIntegration: boolean;
  buildAccess: boolean;
  customApiKey: boolean;
  privateProjects: boolean;
  removeBranding: boolean;
  defaultModel: AIModel;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    monthlyCredits: 3000,
    creditsRefresh: false,
    maxProjects: 3,
    maxFilesPerProject: 20,
    priorityQueue: false,
    githubIntegration: false,
    buildAccess: false,
    customApiKey: false,
    privateProjects: false,
    removeBranding: false,
    defaultModel: "grok",
  },
  PRO: {
    monthlyCredits: 20000,
    creditsRefresh: true,
    maxProjects: 20,
    maxFilesPerProject: 100,
    priorityQueue: true,
    githubIntegration: true,
    buildAccess: true,
    customApiKey: false,
    privateProjects: true,
    removeBranding: true,
    defaultModel: "grok",
  },
  ELITE: {
    monthlyCredits: 50000,
    creditsRefresh: true,
    maxProjects: -1,
    maxFilesPerProject: -1,
    priorityQueue: true,
    githubIntegration: true,
    buildAccess: true,
    customApiKey: true,
    privateProjects: true,
    removeBranding: true,
    defaultModel: "grok",
  },
};

export const CREDIT_COSTS = {
  codeGeneration: 100,
  codeRefinement: 50,
  buildAndroid: 500,
  buildIOS: 500,
  exportProject: 0,
  githubPush: 10,
} as const;

// ============================================
// Utility Types
// ============================================

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ErrorCodes = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  PLAN_LIMIT_EXCEEDED: "PLAN_LIMIT_EXCEEDED",
  BUILD_FAILED: "BUILD_FAILED",
  GITHUB_ERROR: "GITHUB_ERROR",
  AI_ERROR: "AI_ERROR",
} as const;
