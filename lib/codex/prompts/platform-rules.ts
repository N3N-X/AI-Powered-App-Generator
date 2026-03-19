/**
 * Platform rules router — returns the correct rules for each platform.
 * Rules are split into separate files to stay under 300 lines.
 */
import type { Platform } from "./types";
import { WEB_RULES } from "./rules-web";
import { IOS_RULES } from "./rules-ios";
import { ANDROID_RULES } from "./rules-android";

export function getPlatformRules(platform: Platform): string {
  if (platform === "WEB") return WEB_RULES;
  if (platform === "IOS") return IOS_RULES;
  return ANDROID_RULES;
}
