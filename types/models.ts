import { z } from "zod";
import {
  PlanEnum,
  RoleEnum,
  BuildPlatformEnum,
  BuildStatusEnum,
  AIModelEnum,
} from "./enums";

// ============================================
// User Types
// ============================================

export const UserSchema = z.object({
  id: z.string(),
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
