/**
 * Deterministic auto-fix handlers for common pre-build issues.
 */

import { detectPermissionsUsed } from "./store-guidelines-helpers";
import { asObject, slugify } from "./auto-fix-utils";

const DEFAULT_ICON_PATH = "./assets/icon.png";
const DEFAULT_SPLASH_PATH = "./assets/splash.png";
const DEFAULT_PRIVACY_URL = "https://example.com/privacy";
const ICON_PLACEHOLDER =
  "// Replace with a real 1024x1024 PNG icon before store submission";
const SPLASH_PLACEHOLDER =
  "// Replace with a real splash image before store submission";
const WEB_ONLY_PACKAGES = new Set([
  "react-router-dom",
  "react-dom",
  "webpack",
  "vite",
  "next",
  "gatsby",
]);

export type JsonObject = Record<string, unknown>;

export function fixAppIcon(
  appConfig: JsonObject,
  files: Record<string, string>,
): boolean {
  const expo = asObject(appConfig.expo);
  let changed = false;

  if (!expo.icon || typeof expo.icon !== "string") {
    expo.icon = DEFAULT_ICON_PATH;
    changed = true;
  }

  const iconPath = String(expo.icon).replace(/^\.\//, "");
  if (!files[iconPath] && !files[String(expo.icon)]) {
    files[iconPath] = ICON_PLACEHOLDER;
    changed = true;
  }

  appConfig.expo = expo;
  return changed;
}

export function fixPrivacyPolicy(appConfig: JsonObject): boolean {
  const expo = asObject(appConfig.expo);
  if (expo.privacyPolicyUrl) return false;
  expo.privacyPolicyUrl = DEFAULT_PRIVACY_URL;
  appConfig.expo = expo;
  return true;
}

export function fixRequiredAppFields(
  appConfig: JsonObject,
  projectName: string,
): boolean {
  const expo = asObject(appConfig.expo);
  let changed = false;

  if (!expo.name) {
    expo.name = projectName || "Rulxy App";
    changed = true;
  }
  if (!expo.slug) {
    expo.slug = slugify(String(expo.name || projectName || "rux-app"));
    changed = true;
  }
  if (!expo.version) {
    expo.version = "1.0.0";
    changed = true;
  }

  appConfig.expo = expo;
  return changed;
}

export function fixBundleIdentifier(
  appConfig: JsonObject,
  projectName: string,
): boolean {
  const expo = asObject(appConfig.expo);
  const ios = asObject(expo.ios);
  if (ios.bundleIdentifier) return false;

  const slug = String(expo.slug || slugify(projectName || "rux-app"));
  ios.bundleIdentifier = `com.rux.${slug.replace(/-/g, "")}`;
  expo.ios = ios;
  appConfig.expo = expo;
  return true;
}

export function fixAndroidPackage(
  appConfig: JsonObject,
  projectName: string,
): boolean {
  const expo = asObject(appConfig.expo);
  const android = asObject(expo.android);
  if (android.package) return false;

  const slug = String(expo.slug || slugify(projectName || "rux-app"));
  android.package = `com.rux.${slug.replace(/-/g, "")}`;
  expo.android = android;
  appConfig.expo = expo;
  return true;
}

export function fixWebOnlyPackages(packageJson: JsonObject): boolean {
  const deps = asObject(packageJson.dependencies);
  const devDeps = asObject(packageJson.devDependencies);
  let changed = false;

  for (const pkg of WEB_ONLY_PACKAGES) {
    if (pkg in deps) {
      delete deps[pkg];
      changed = true;
    }
    if (pkg in devDeps) {
      delete devDeps[pkg];
      changed = true;
    }
  }

  packageJson.dependencies = deps;
  packageJson.devDependencies = devDeps;
  return changed;
}

export function fixSplash(
  appConfig: JsonObject,
  files: Record<string, string>,
): boolean {
  const expo = asObject(appConfig.expo);
  const splash = asObject(expo.splash);
  let changed = false;

  if (!splash.image) {
    splash.image = DEFAULT_SPLASH_PATH;
    changed = true;
  }
  if (!splash.backgroundColor) {
    splash.backgroundColor = "#ffffff";
    changed = true;
  }
  if (!splash.resizeMode) {
    splash.resizeMode = "contain";
    changed = true;
  }

  const splashPath = String(splash.image).replace(/^\.\//, "");
  if (!files[splashPath] && !files[String(splash.image)]) {
    files[splashPath] = SPLASH_PLACEHOLDER;
    changed = true;
  }

  expo.splash = splash;
  appConfig.expo = expo;
  return changed;
}

export function fixKnownPermissions(
  appConfig: JsonObject,
  issueId: string,
): boolean {
  const map: Record<string, string> = {
    "ios-camera-permission": "NSCameraUsageDescription",
    "ios-location-permission": "NSLocationWhenInUseUsageDescription",
    "ios-photo-permission": "NSPhotoLibraryUsageDescription",
  };
  const key = map[issueId];
  if (!key) return false;

  const expo = asObject(appConfig.expo);
  const ios = asObject(expo.ios);
  const infoPlist = asObject(ios.infoPlist);
  if (infoPlist[key]) return false;

  infoPlist[key] = defaultPermissionMessage(key);
  ios.infoPlist = infoPlist;
  expo.ios = ios;
  appConfig.expo = expo;
  return true;
}

export function fixDetectedPermissions(
  appConfig: JsonObject,
  files: Record<string, string>,
): boolean {
  const expo = asObject(appConfig.expo);
  const ios = asObject(expo.ios);
  const infoPlist = asObject(ios.infoPlist);
  let changed = false;

  for (const perm of detectPermissionsUsed(files)) {
    if (!infoPlist[perm.iosKey]) {
      infoPlist[perm.iosKey] = defaultPermissionMessage(perm.iosKey);
      changed = true;
    }
  }
  if (!changed) return false;

  ios.infoPlist = infoPlist;
  expo.ios = ios;
  appConfig.expo = expo;
  return true;
}

function defaultPermissionMessage(iosKey: string): string {
  if (iosKey.includes("Camera")) {
    return "This app uses the camera for user features.";
  }
  if (iosKey.includes("Location")) {
    return "This app uses location to provide nearby results.";
  }
  if (iosKey.includes("Photo")) {
    return "This app uses photo library access for uploads.";
  }
  if (iosKey.includes("Microphone")) {
    return "This app uses microphone access for audio input.";
  }
  if (iosKey.includes("Contact")) {
    return "This app uses contacts to improve user experience.";
  }
  if (iosKey.includes("Calendar")) {
    return "This app uses calendar access for scheduling features.";
  }
  return "This permission is used to support app functionality.";
}
