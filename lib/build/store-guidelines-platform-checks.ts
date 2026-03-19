/**
 * Platform-specific store guidelines checks for iOS and Android.
 */

import type { BuildIssue, AppConfig } from "./pre-build-checks";
import {
  checkIfCollectsData,
  checkForMatureContent,
  checkForPrivateAPIs,
  detectPermissionsUsed,
} from "./store-guidelines-helpers";

// ---------------------------------------------------------------------------
// iOS App Store Guidelines
// ---------------------------------------------------------------------------

export function checkiOSGuidelines(
  files: Record<string, string>,
  appConfig: AppConfig | null,
): BuildIssue[] {
  const issues: BuildIssue[] = [];

  // 1. Required metadata
  if (!appConfig?.expo?.name) {
    issues.push({
      id: "ios-app-name",
      tier: "critical",
      title: "Missing App Name",
      message: "App Store requires an app name",
      file: "app.json",
      autoFixable: true,
      autoFixDescription: "Add app name to app.json",
    });
  }

  // 2. Icon requirements (1024x1024 for App Store)
  if (!appConfig?.expo?.icon) {
    issues.push({
      id: "ios-app-icon",
      tier: "critical",
      title: "Missing App Icon",
      message: "App Store requires a 1024x1024 app icon",
      file: "app.json",
      autoFixable: true,
      autoFixDescription: "Generate app icon",
    });
  }

  // 3. Privacy Policy (required if collecting any data)
  const collectsData = checkIfCollectsData(files);
  if (collectsData && !appConfig?.expo?.privacyPolicyUrl) {
    issues.push({
      id: "ios-privacy-policy",
      tier: "critical",
      title: "Privacy Policy Required",
      message:
        "App collects user data but no privacy policy URL is set. Apple requires this.",
      file: "app.json",
      autoFixable: true,
      autoFixDescription: "Add placeholder privacy policy URL",
    });
  }

  // 4. Permission descriptions (required for any permission used)
  const permissionsUsed = detectPermissionsUsed(files);
  const infoPlist = appConfig?.expo?.ios?.infoPlist || {};

  for (const perm of permissionsUsed) {
    if (!infoPlist[perm.iosKey]) {
      issues.push({
        id: `ios-permission-${perm.name}`,
        tier: "warning",
        title: `Missing ${perm.name} Permission Description`,
        message: `App uses ${perm.name} but ${perm.iosKey} not set. Apple will reject.`,
        file: "app.json",
        autoFixable: true,
        autoFixDescription: `Add ${perm.iosKey} to app.json`,
      });
    }
  }

  // 5. No private APIs
  const privateAPIs = checkForPrivateAPIs(files);
  if (privateAPIs.length > 0) {
    issues.push({
      id: "ios-private-apis",
      tier: "critical",
      title: "Private API Usage Detected",
      message: `Detected potentially private API usage: ${privateAPIs.join(", ")}. Apple may reject.`,
      autoFixable: false,
    });
  }

  // 6. Age rating content check
  const matureContent = checkForMatureContent(files);
  if (matureContent) {
    issues.push({
      id: "ios-mature-content",
      tier: "warning",
      title: "Potential Mature Content",
      message:
        "App may contain content requiring age rating adjustment. Review before submission.",
      autoFixable: false,
    });
  }

  // 7. Minimum functionality (not just a wrapper)
  const hasMinimalCode = Object.keys(files).length < 5;
  if (hasMinimalCode) {
    issues.push({
      id: "ios-minimal-functionality",
      tier: "warning",
      title: "Minimal Functionality",
      message:
        "App has very few files. Apple may reject apps that are too simple or just wrappers.",
      autoFixable: false,
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Google Play Store Guidelines
// ---------------------------------------------------------------------------

export function checkPlayStoreGuidelines(
  files: Record<string, string>,
  appConfig: AppConfig | null,
): BuildIssue[] {
  const issues: BuildIssue[] = [];

  // 1. Required metadata
  if (!appConfig?.expo?.name) {
    issues.push({
      id: "android-app-name",
      tier: "critical",
      title: "Missing App Name",
      message: "Play Store requires an app name",
      file: "app.json",
      autoFixable: true,
      autoFixDescription: "Add app name to app.json",
    });
  }

  // 2. Icon requirements (512x512 for Play Store)
  if (!appConfig?.expo?.icon) {
    issues.push({
      id: "android-app-icon",
      tier: "critical",
      title: "Missing App Icon",
      message: "Play Store requires a 512x512 app icon",
      file: "app.json",
      autoFixable: true,
      autoFixDescription: "Generate app icon",
    });
  }

  // 3. Privacy Policy (required for all apps)
  if (!appConfig?.expo?.privacyPolicyUrl) {
    issues.push({
      id: "android-privacy-policy",
      tier: "warning",
      title: "Privacy Policy Recommended",
      message: "Play Store requires privacy policy for apps that collect data",
      file: "app.json",
      autoFixable: true,
      autoFixDescription: "Add placeholder privacy policy URL",
    });
  }

  // 4. Permission rationales
  const permissionsUsed = detectPermissionsUsed(files);
  for (const perm of permissionsUsed) {
    if (perm.androidPermission) {
      issues.push({
        id: `android-permission-${perm.name}`,
        tier: "tip",
        title: `${perm.name} Permission Used`,
        message: `App uses ${perm.name}. Ensure you have a rationale for Play Console submission.`,
        autoFixable: false,
      });
    }
  }

  // 5. Content rating questionnaire reminder
  issues.push({
    id: "android-content-rating",
    tier: "tip",
    title: "Content Rating Questionnaire",
    message:
      "Remember to complete the content rating questionnaire in Play Console",
    autoFixable: false,
  });

  // 6. Target SDK version
  issues.push({
    id: "android-target-sdk",
    tier: "tip",
    title: "Target SDK Version",
    message:
      "Ensure app targets recent Android SDK version (Expo handles this automatically)",
    autoFixable: false,
  });

  // 7. Data safety form reminder
  const collectsData = checkIfCollectsData(files);
  if (collectsData) {
    issues.push({
      id: "android-data-safety",
      tier: "warning",
      title: "Data Safety Form Required",
      message:
        "App collects data. Complete the Data Safety form in Play Console.",
      autoFixable: false,
    });
  }

  return issues;
}
