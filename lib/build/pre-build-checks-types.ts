/**
 * Pre-Build Validation - Types & Interfaces
 */

export type BuildIssueTier = "critical" | "warning" | "tip";
export type BuildPlatform = "ios" | "android";

export interface BuildIssue {
  id: string;
  tier: BuildIssueTier;
  title: string;
  message: string;
  file?: string;
  line?: number;
  autoFixable: boolean;
  autoFixDescription?: string;
}

export interface PreBuildCheckResult {
  canBuild: boolean;
  critical: BuildIssue[];
  warnings: BuildIssue[];
  tips: BuildIssue[];
  checkedAt: Date;
}

export interface PreBuildCheck {
  id: string;
  name: string;
  tier: BuildIssueTier;
  platform: BuildPlatform | "both";
  check: (
    files: Record<string, string>,
    appConfig: AppConfig | null,
  ) => BuildIssue | null;
}

export interface AppConfig {
  expo?: {
    name?: string;
    slug?: string;
    version?: string;
    icon?: string;
    splash?: {
      image?: string;
      backgroundColor?: string;
    };
    ios?: {
      bundleIdentifier?: string;
      infoPlist?: Record<string, string>;
    };
    android?: {
      package?: string;
      permissions?: string[];
    };
    privacyPolicyUrl?: string;
  };
}
