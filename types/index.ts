import { z } from "zod";

// ============================================
// Enums
// ============================================

export const PlanEnum = z.enum(["FREE", "PRO", "ELITE"]);
export type Plan = z.infer<typeof PlanEnum>;

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

// ============================================
// User Types
// ============================================

export const RoleEnum = z.enum(["USER", "ADMIN"]);
export type Role = z.infer<typeof RoleEnum>;

export const PlatformEnum = z.enum(["WEB", "IOS", "ANDROID"]);
export type Platform = z.infer<typeof PlatformEnum>;

export const UserSchema = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string().email(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  plan: PlanEnum,
  role: RoleEnum,
  credits: z.number(),
  totalCreditsUsed: z.number(),
  lastCreditReset: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type User = z.infer<typeof UserSchema>;

// ============================================
// Project Types
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

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  codeFiles: CodeFilesSchema,
  appConfig: AppConfigSchema.nullable(),
  githubRepo: z.string().nullable(),
  githubUrl: z.string().nullable(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Project = z.infer<typeof ProjectSchema>;

// ============================================
// Build Types
// ============================================

export const BuildSchema = z.object({
  id: z.string(),
  platform: BuildPlatformEnum,
  status: BuildStatusEnum,
  easBuildId: z.string().nullable(),
  buildUrl: z.string().nullable(),
  artifactUrl: z.string().nullable(),
  buildProfile: z.string(),
  version: z.string().nullable(),
  buildNumber: z.number().nullable(),
  logs: z.string().nullable(),
  errorMessage: z.string().nullable(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  projectId: z.string(),
  userId: z.string(),
});
export type Build = z.infer<typeof BuildSchema>;

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

// Vibe Refine
export const RefineRequestSchema = z.object({
  prompt: z.string().min(1).max(10000),
  projectId: z.string(),
  targetFiles: z.array(z.string()).optional(),
  model: AIModelEnum.optional(),
});
export type RefineRequest = z.infer<typeof RefineRequestSchema>;

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
  commitMessage: z.string().min(1).max(500).default("Update from RUX"),
});
export type PushCodeRequest = z.infer<typeof PushCodeRequestSchema>;

// Credentials
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

// ============================================
// Chat/Message Types
// ============================================

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  timestamp: z.date(),
  model: AIModelEnum.optional(),
  codeChanges: CodeFilesSchema.optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ============================================
// Plan Limits (Credits aligned with createanything.com)
// ============================================

export interface PlanLimits {
  monthlyCredits: number;
  creditsRefresh: boolean; // Whether credits reset monthly
  maxProjects: number;
  maxFilesPerProject: number;
  priorityQueue: boolean;
  githubIntegration: boolean;
  buildAccess: boolean;
  customApiKey: boolean; // Can use own API keys
  privateProjects: boolean;
  removeBranding: boolean;
  defaultModel: AIModel;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    monthlyCredits: 3000, // One-time, no monthly reset
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
    monthlyCredits: 20000, // Resets monthly
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
    monthlyCredits: 50000, // Resets monthly
    creditsRefresh: true,
    maxProjects: -1, // unlimited
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

// ============================================
// Credit Costs per Operation
// ============================================

export const CREDIT_COSTS = {
  // Code generation (AI)
  codeGeneration: 100, // Per generation request
  codeRefinement: 50, // Per refinement

  // Builds
  buildAndroid: 500, // Per Android build
  buildIOS: 500, // Per iOS build

  // Other operations
  exportProject: 0, // Free
  githubPush: 10, // Per push
} as const;

// ============================================
// File Tree Types
// ============================================

export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
}

// ============================================
// Preview Types
// ============================================

export const PreviewRequestSchema = z.object({
  code: z.string(),
  entryFile: z.string().default("App.tsx"),
});
export type PreviewRequest = z.infer<typeof PreviewRequestSchema>;

// ============================================
// Error Types
// ============================================

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
