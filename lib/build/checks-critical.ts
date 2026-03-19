/**
 * Pre-Build Checks - CRITICAL tier (blocks build)
 */

import type { PreBuildCheck } from "./pre-build-checks-types";

export const CRITICAL_CHECKS: PreBuildCheck[] = [
  {
    id: "essential-files",
    name: "Essential Project Files",
    tier: "critical",
    platform: "both",
    check: (files) => {
      // Check for app entry point
      const entryPoints = [
        "App.tsx",
        "App.js",
        "app/index.tsx",
        "app/index.js",
        "index.tsx",
        "index.js",
      ];
      const hasEntry = entryPoints.some((f) => files[f]);

      if (!hasEntry) {
        return {
          id: "essential-files",
          tier: "critical",
          title: "Missing App Entry Point",
          message:
            "No App.tsx, App.js, or entry file found. Your app needs a main entry point.",
          autoFixable: false,
        };
      }
      return null;
    },
  },

  {
    id: "app-icon",
    name: "App Icon",
    tier: "critical",
    platform: "both",
    check: (files, config) => {
      const iconPath = config?.expo?.icon;
      if (!iconPath) {
        return {
          id: "app-icon",
          tier: "critical",
          title: "Missing App Icon",
          message:
            "App icon is required. iOS needs 1024x1024, Android needs 512x512.",
          autoFixable: true,
          autoFixDescription:
            "Generate a placeholder app icon based on app name",
        };
      }
      // Check if icon file exists in files
      const normalizedPath = iconPath.replace(/^\.\//, "");
      if (!files[normalizedPath] && !files[iconPath]) {
        return {
          id: "app-icon",
          tier: "critical",
          title: "App Icon Not Found",
          message: `Icon file "${iconPath}" referenced in app.json but not found`,
          file: "app.json",
          autoFixable: true,
          autoFixDescription: "Generate a placeholder app icon",
        };
      }
      return null;
    },
  },

  {
    id: "app-json-required",
    name: "Required app.json Fields",
    tier: "critical",
    platform: "both",
    check: (files, config) => {
      const missing: string[] = [];
      if (!config?.expo?.name) missing.push("name");
      if (!config?.expo?.slug) missing.push("slug");
      if (!config?.expo?.version) missing.push("version");

      if (missing.length > 0) {
        return {
          id: "app-json-required",
          tier: "critical",
          title: "Missing Required Fields",
          message: `app.json missing required fields: ${missing.join(", ")}`,
          file: "app.json",
          autoFixable: true,
          autoFixDescription: "Add missing required fields with defaults",
        };
      }
      return null;
    },
  },

  {
    id: "native-compatibility",
    name: "Native Package Compatibility",
    tier: "critical",
    platform: "both",
    check: (files) => {
      const webOnlyPackages = [
        "react-router-dom",
        "react-dom",
        "webpack",
        "vite",
        "next",
        "gatsby",
      ];

      const packageJson = files["package.json"];
      if (!packageJson) return null;

      try {
        const pkg = JSON.parse(packageJson);
        const deps = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
        };

        const found = webOnlyPackages.filter((p) => deps[p]);
        if (found.length > 0) {
          return {
            id: "native-compatibility",
            tier: "critical",
            title: "Web-Only Packages",
            message: `These packages don't work in native builds: ${found.join(", ")}`,
            file: "package.json",
            autoFixable: true,
            autoFixDescription: "Remove web-only packages from dependencies",
          };
        }
      } catch {
        // Invalid JSON, will be caught elsewhere
      }
      return null;
    },
  },

  {
    id: "typescript-errors",
    name: "TypeScript Compilation",
    tier: "warning",
    platform: "both",
    check: (files) => {
      const errors: string[] = [];

      for (const [path, content] of Object.entries(files)) {
        if (!path.endsWith(".ts") && !path.endsWith(".tsx")) continue;

        const anyCount = (content.match(/:\s*any\b/g) || []).length;
        if (anyCount > 10) {
          errors.push(`${path}: ${anyCount} 'any' types (may indicate issues)`);
        }

        const ignoreCount = (content.match(/@ts-ignore|@ts-nocheck/g) || [])
          .length;
        if (ignoreCount > 3) {
          errors.push(`${path}: ${ignoreCount} TypeScript ignores`);
        }
      }

      if (errors.length > 0) {
        return {
          id: "typescript-errors",
          tier: "warning",
          title: "TypeScript Issues",
          message: errors.slice(0, 3).join("; "),
          autoFixable: false,
        };
      }
      return null;
    },
  },

  {
    id: "expo-sdk-version",
    name: "Expo SDK Compatibility",
    tier: "critical",
    platform: "both",
    check: (files) => {
      const packageJson = files["package.json"];
      if (!packageJson) return null;

      try {
        const pkg = JSON.parse(packageJson);
        const expoVersion = pkg.dependencies?.expo;

        if (!expoVersion) {
          return {
            id: "expo-sdk-version",
            tier: "critical",
            title: "Missing Expo",
            message: "Expo package not found in dependencies",
            file: "package.json",
            autoFixable: false,
          };
        }

        const deps = pkg.dependencies || {};

        if (deps["react-native-reanimated"] && !deps["expo"]) {
          return {
            id: "expo-sdk-version",
            tier: "critical",
            title: "Missing Expo with Reanimated",
            message: "react-native-reanimated requires expo to be installed",
            file: "package.json",
            autoFixable: false,
          };
        }
      } catch {
        return {
          id: "expo-sdk-version",
          tier: "critical",
          title: "Invalid package.json",
          message: "Could not parse package.json",
          file: "package.json",
          autoFixable: false,
        };
      }
      return null;
    },
  },

  {
    id: "bundle-identifier",
    name: "Bundle Identifier",
    tier: "critical",
    platform: "ios",
    check: (_, config) => {
      if (!config?.expo?.ios?.bundleIdentifier && !config?.expo?.slug) {
        return {
          id: "bundle-identifier",
          tier: "critical",
          title: "Missing Bundle Identifier",
          message:
            "iOS requires bundleIdentifier in app.json (or slug as fallback)",
          file: "app.json",
          autoFixable: true,
          autoFixDescription: "Generate bundle identifier from app name",
        };
      }
      return null;
    },
  },

  {
    id: "android-package",
    name: "Android Package Name",
    tier: "critical",
    platform: "android",
    check: (_, config) => {
      if (!config?.expo?.android?.package && !config?.expo?.slug) {
        return {
          id: "android-package",
          tier: "critical",
          title: "Missing Package Name",
          message:
            "Android requires package name in app.json (or slug as fallback)",
          file: "app.json",
          autoFixable: true,
          autoFixDescription: "Generate package name from app name",
        };
      }
      return null;
    },
  },
];
