/**
 * App Store / Play Store Guidelines Checks
 *
 * Validates compliance with store submission requirements.
 * These are separate from technical pre-build checks.
 */

import type { BuildPlatform, AppConfig } from "./pre-build-checks";
import {
  checkiOSGuidelines,
  checkPlayStoreGuidelines,
} from "./store-guidelines-platform-checks";

// Re-export everything so existing imports continue to work
export { checkiOSGuidelines, checkPlayStoreGuidelines };
export type { PermissionInfo } from "./store-guidelines-helpers";

export interface StoreGuidelinesResult {
  platform: BuildPlatform;
  compliant: boolean;
  issues: import("./pre-build-checks").BuildIssue[];
  checkedAt: Date;
}

// ---------------------------------------------------------------------------
// Run Store Guidelines Check
// ---------------------------------------------------------------------------

export function checkStoreGuidelines(
  files: Record<string, string>,
  platform: BuildPlatform,
): StoreGuidelinesResult {
  // Parse app.json
  let appConfig: AppConfig | null = null;
  const appJsonContent = files["app.json"];
  if (appJsonContent) {
    try {
      appConfig = JSON.parse(appJsonContent);
    } catch {
      // Invalid JSON
    }
  }

  const issues =
    platform === "ios"
      ? checkiOSGuidelines(files, appConfig)
      : checkPlayStoreGuidelines(files, appConfig);

  const hasCritical = issues.some((i) => i.tier === "critical");

  return {
    platform,
    compliant: !hasCritical,
    issues,
    checkedAt: new Date(),
  };
}
