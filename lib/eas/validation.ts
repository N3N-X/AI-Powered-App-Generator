import { BuildPlatform } from "@/types";
import { SubmissionCredentials } from "./types";

/**
 * Validate credentials for store submission.
 * Build credentials are NOT needed — the platform handles signing.
 * Only submission credentials (ASC API Key / Google Service Account) are required.
 */
export function validateSubmitCredentials(
  platform: BuildPlatform,
  credentials: SubmissionCredentials,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (platform === "IOS") {
    if (!credentials?.apple) {
      errors.push(
        "App Store Connect API Key is required for App Store submission",
      );
    } else {
      if (!credentials.apple.keyId)
        errors.push("App Store Connect Key ID is required");
      if (!credentials.apple.issuerId)
        errors.push("App Store Connect Issuer ID is required");
      if (!credentials.apple.p8Key)
        errors.push("App Store Connect API Key (P8) is required");
    }
  }

  if (platform === "ANDROID") {
    if (!credentials?.google?.serviceAccountJson) {
      errors.push(
        "Google Play Service Account is required for Play Store submission",
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Estimate build time based on platform and profile
 */
export function estimateBuildTime(
  platform: BuildPlatform,
  profile: string,
): { min: number; max: number; unit: "minutes" } {
  const estimates: Record<string, { min: number; max: number }> = {
    "android-development": { min: 5, max: 15 },
    "android-preview": { min: 8, max: 20 },
    "android-production": { min: 10, max: 25 },
    "ios-development": { min: 10, max: 25 },
    "ios-preview": { min: 12, max: 30 },
    "ios-production": { min: 15, max: 35 },
  };

  const key = `${platform.toLowerCase()}-${profile}`;
  return {
    ...(estimates[key] || { min: 10, max: 30 }),
    unit: "minutes",
  };
}
