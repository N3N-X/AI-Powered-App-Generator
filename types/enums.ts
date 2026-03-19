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

export const RoleEnum = z.enum(["USER", "ADMIN"]);
export type Role = z.infer<typeof RoleEnum>;

export const PlatformEnum = z.enum(["WEB", "IOS", "ANDROID"]);
export type Platform = z.infer<typeof PlatformEnum>;
