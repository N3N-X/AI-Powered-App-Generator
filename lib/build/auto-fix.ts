/**
 * Auto-fix utilities for pre-build issues.
 * Applies deterministic fixes for auto-fixable build issues.
 */

import type { BuildIssue, BuildPlatform } from "./pre-build-checks";
import { runPreBuildChecks } from "./pre-build-checks";
import { checkStoreGuidelines } from "./store-guidelines";
import { asObject, parseJson } from "./auto-fix-utils";
import {
  fixAndroidPackage,
  fixAppIcon,
  fixBundleIdentifier,
  fixDetectedPermissions,
  fixKnownPermissions,
  fixPrivacyPolicy,
  fixRequiredAppFields,
  fixSplash,
  fixWebOnlyPackages,
  type JsonObject,
} from "./auto-fix-handlers";

export interface AutoFixOptions {
  files: Record<string, string>;
  platform: BuildPlatform;
  projectName: string;
  issueIds?: string[];
  fixAll?: boolean;
  onProgress?: (message: string) => void;
}

export interface AutoFixResult {
  updatedFiles: Record<string, string>;
  fixedCount: number;
}

export function applyAutoFixes(options: AutoFixOptions): AutoFixResult {
  const {
    files,
    platform,
    projectName,
    issueIds,
    fixAll = true,
    onProgress,
  } = options;
  onProgress?.("Analyzing files for auto-fixable issues...");

  const updatedFiles = { ...files };
  const selectedIssues = selectIssuesToFix(
    updatedFiles,
    platform,
    issueIds,
    fixAll,
  );
  if (selectedIssues.length === 0) {
    onProgress?.("No auto-fixable issues found.");
    return { updatedFiles, fixedCount: 0 };
  }

  let appConfig: JsonObject | null = null;
  let appConfigChanged = false;
  let packageJson: JsonObject | null = null;
  let packageChanged = false;
  let fixedCount = 0;

  const ensureAppConfig = () => {
    if (appConfig) return appConfig;
    appConfig = parseJson<JsonObject>(updatedFiles["app.json"]) || {};
    appConfig.expo = asObject(appConfig.expo);
    return appConfig;
  };

  const ensurePackageJson = () => {
    if (packageJson) return packageJson;
    packageJson = parseJson<JsonObject>(updatedFiles["package.json"]) || {};
    return packageJson;
  };

  for (const issue of selectedIssues) {
    onProgress?.(`Applying fix: ${issue.title}...`);
    let changed = false;

    switch (issue.id) {
      case "app-icon":
      case "ios-app-icon":
      case "android-app-icon":
        changed = fixAppIcon(ensureAppConfig(), updatedFiles);
        appConfigChanged ||= changed;
        break;
      case "privacy-policy":
      case "ios-privacy-policy":
      case "android-privacy-policy":
        changed = fixPrivacyPolicy(ensureAppConfig());
        appConfigChanged ||= changed;
        break;
      case "app-json-required":
      case "ios-app-name":
      case "android-app-name":
        changed = fixRequiredAppFields(ensureAppConfig(), projectName);
        appConfigChanged ||= changed;
        break;
      case "bundle-identifier":
        changed = fixBundleIdentifier(ensureAppConfig(), projectName);
        appConfigChanged ||= changed;
        break;
      case "android-package":
        changed = fixAndroidPackage(ensureAppConfig(), projectName);
        appConfigChanged ||= changed;
        break;
      case "native-compatibility":
        changed = fixWebOnlyPackages(ensurePackageJson());
        packageChanged ||= changed;
        break;
      case "splash-screen":
        changed = fixSplash(ensureAppConfig(), updatedFiles);
        appConfigChanged ||= changed;
        break;
      case "ios-camera-permission":
      case "ios-location-permission":
      case "ios-photo-permission":
        changed = fixKnownPermissions(ensureAppConfig(), issue.id);
        appConfigChanged ||= changed;
        break;
      default:
        if (issue.id.startsWith("ios-permission-")) {
          changed = fixDetectedPermissions(ensureAppConfig(), updatedFiles);
          appConfigChanged ||= changed;
        }
    }

    if (changed) {
      fixedCount += 1;
      onProgress?.(`Fixed: ${issue.title}`);
    } else {
      onProgress?.(`Skipped: ${issue.title} (already satisfied)`);
    }
  }

  if (appConfigChanged && appConfig) {
    updatedFiles["app.json"] = JSON.stringify(appConfig, null, 2);
  }
  if (packageChanged && packageJson) {
    updatedFiles["package.json"] = JSON.stringify(packageJson, null, 2);
  }

  onProgress?.(`Auto-fix complete. Applied ${fixedCount} fix(es).`);
  return { updatedFiles, fixedCount };
}

function selectIssuesToFix(
  files: Record<string, string>,
  platform: BuildPlatform,
  issueIds?: string[],
  fixAll = true,
): BuildIssue[] {
  const preBuild = runPreBuildChecks(files, platform);
  const store = checkStoreGuidelines(files, platform);
  const autoFixable = [
    ...preBuild.critical,
    ...preBuild.warnings,
    ...preBuild.tips,
    ...store.issues,
  ].filter((issue) => issue.autoFixable);

  const unique = new Map<string, BuildIssue>();
  for (const issue of autoFixable) {
    if (!unique.has(issue.id)) unique.set(issue.id, issue);
  }

  if (!fixAll && issueIds && issueIds.length > 0) {
    const requested = new Set(issueIds);
    return [...unique.values()].filter((issue) => requested.has(issue.id));
  }

  return [...unique.values()];
}
