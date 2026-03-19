import type { Plan, AIModel } from "./enums";

// ============================================
// Plan Limits (Credits aligned with createanything.com)
// ============================================

export interface PlanLimits {
  monthlyCredits: number;
  creditsRefresh: boolean; // Whether credits reset monthly
  maxProjects: number;
  maxFilesPerProject: number;
  priorityBuilds: boolean;
  githubIntegration: boolean;
  buildAccess: boolean;
  storePublishing: boolean; // App Store & Play Store publishing
  customDomains: boolean; // Custom domains for web apps
  privateProjects: boolean;
  removeBranding: boolean;
  earlyAccess: boolean;
  defaultModel: AIModel;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    monthlyCredits: 3000, // One-time, no monthly reset
    creditsRefresh: false,
    maxProjects: -1, // unlimited
    maxFilesPerProject: -1, // unlimited
    priorityBuilds: false,
    githubIntegration: true,
    buildAccess: true,
    storePublishing: false,
    customDomains: false,
    privateProjects: false,
    removeBranding: false,
    earlyAccess: false,
    defaultModel: "grok",
  },
  PRO: {
    monthlyCredits: 50000, // Resets monthly
    creditsRefresh: true,
    maxProjects: -1, // unlimited
    maxFilesPerProject: -1, // unlimited
    priorityBuilds: true,
    githubIntegration: true,
    buildAccess: true,
    storePublishing: true,
    customDomains: true,
    privateProjects: true,
    removeBranding: true,
    earlyAccess: false,
    defaultModel: "grok",
  },
  ELITE: {
    monthlyCredits: 200000, // Resets monthly
    creditsRefresh: true,
    maxProjects: -1, // unlimited
    maxFilesPerProject: -1, // unlimited
    priorityBuilds: true,
    githubIntegration: true,
    buildAccess: true,
    storePublishing: true,
    customDomains: true,
    privateProjects: true,
    removeBranding: true,
    earlyAccess: true,
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
