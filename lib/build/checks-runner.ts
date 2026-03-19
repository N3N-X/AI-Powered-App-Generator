/**
 * Pre-Build Checks - Runner & utilities
 */

import type {
  AppConfig,
  BuildIssue,
  BuildPlatform,
  PreBuildCheck,
  PreBuildCheckResult,
} from "./pre-build-checks-types";
import { CRITICAL_CHECKS } from "./checks-critical";
import { WARNING_CHECKS } from "./checks-warning";
import { TIP_CHECKS } from "./checks-tips";

// ---------------------------------------------------------------------------
// Combined registry
// ---------------------------------------------------------------------------

export const PRE_BUILD_CHECKS: PreBuildCheck[] = [
  ...CRITICAL_CHECKS,
  ...WARNING_CHECKS,
  ...TIP_CHECKS,
];

// ---------------------------------------------------------------------------
// Run Pre-Build Checks
// ---------------------------------------------------------------------------

export function runPreBuildChecks(
  files: Record<string, string>,
  platform: BuildPlatform,
): PreBuildCheckResult {
  // Parse app.json if it exists
  let appConfig: AppConfig | null = null;
  const appJsonContent = files["app.json"];
  if (appJsonContent) {
    try {
      appConfig = JSON.parse(appJsonContent);
    } catch {
      // Invalid JSON, will be caught by checks
    }
  }

  const critical: BuildIssue[] = [];
  const warnings: BuildIssue[] = [];
  const tips: BuildIssue[] = [];

  for (const check of PRE_BUILD_CHECKS) {
    // Skip checks not applicable to this platform
    if (check.platform !== "both" && check.platform !== platform) {
      continue;
    }

    const issue = check.check(files, appConfig);
    if (issue) {
      switch (issue.tier) {
        case "critical":
          critical.push(issue);
          break;
        case "warning":
          warnings.push(issue);
          break;
        case "tip":
          tips.push(issue);
          break;
      }
    }
  }

  return {
    canBuild: critical.length === 0,
    critical,
    warnings,
    tips,
    checkedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Get Auto-Fixable Issues
// ---------------------------------------------------------------------------

export function getAutoFixableIssues(
  result: PreBuildCheckResult,
): BuildIssue[] {
  return [
    ...result.critical.filter((i) => i.autoFixable),
    ...result.warnings.filter((i) => i.autoFixable),
    ...result.tips.filter((i) => i.autoFixable),
  ];
}
