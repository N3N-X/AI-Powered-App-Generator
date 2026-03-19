/**
 * Pre-Build Checks - TIP tier (recommendations)
 */

import type { PreBuildCheck } from "./pre-build-checks-types";

export const TIP_CHECKS: PreBuildCheck[] = [
  {
    id: "splash-screen",
    name: "Splash Screen",
    tier: "tip",
    platform: "both",
    check: (_, config) => {
      if (!config?.expo?.splash?.image) {
        return {
          id: "splash-screen",
          tier: "tip",
          title: "No Splash Screen",
          message:
            "Adding a splash screen improves first impression and perceived load time",
          file: "app.json",
          autoFixable: true,
          autoFixDescription: "Generate a simple splash screen",
        };
      }
      return null;
    },
  },

  {
    id: "bundle-size",
    name: "Bundle Size",
    tier: "tip",
    platform: "both",
    check: (files) => {
      let totalSize = 0;
      for (const content of Object.values(files)) {
        totalSize += content.length;
      }

      if (totalSize > 2_000_000) {
        return {
          id: "bundle-size",
          tier: "tip",
          title: "Large Codebase",
          message: `Code size is ${Math.round(totalSize / 1024)}KB. Consider code splitting for faster loads.`,
          autoFixable: false,
        };
      }
      return null;
    },
  },

  {
    id: "accessibility",
    name: "Accessibility Labels",
    tier: "tip",
    platform: "both",
    check: (files) => {
      let hasImages = false;
      let hasAccessibilityLabels = false;

      for (const content of Object.values(files)) {
        if (content.includes("<Image") || content.includes("source={")) {
          hasImages = true;
        }
        if (
          content.includes("accessibilityLabel") ||
          content.includes("accessible={")
        ) {
          hasAccessibilityLabels = true;
        }
      }

      if (hasImages && !hasAccessibilityLabels) {
        return {
          id: "accessibility",
          tier: "tip",
          title: "Missing Accessibility Labels",
          message:
            "Consider adding accessibilityLabel to images for screen reader support",
          autoFixable: false,
        };
      }
      return null;
    },
  },
];
