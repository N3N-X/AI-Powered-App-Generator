/**
 * Pre-Build Validation Checks - Barrel Export
 *
 * Re-exports all types, checks, and utilities so existing imports continue to work.
 */

export type {
  BuildIssueTier,
  BuildPlatform,
  BuildIssue,
  PreBuildCheckResult,
  PreBuildCheck,
  AppConfig,
} from "./pre-build-checks-types";

export { CRITICAL_CHECKS } from "./checks-critical";
export { WARNING_CHECKS } from "./checks-warning";
export { TIP_CHECKS } from "./checks-tips";

export {
  PRE_BUILD_CHECKS,
  runPreBuildChecks,
  getAutoFixableIssues,
} from "./checks-runner";
