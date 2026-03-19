/**
 * Pre-Build Checks - WARNING tier (may cause store rejection)
 */

import type { PreBuildCheck } from "./pre-build-checks-types";

export const WARNING_CHECKS: PreBuildCheck[] = [
  {
    id: "privacy-policy",
    name: "Privacy Policy",
    tier: "warning",
    platform: "both",
    check: (_, config) => {
      if (!config?.expo?.privacyPolicyUrl) {
        return {
          id: "privacy-policy",
          tier: "warning",
          title: "No Privacy Policy",
          message:
            "Privacy policy URL is required for App Store and Play Store submissions",
          file: "app.json",
          autoFixable: true,
          autoFixDescription:
            "Add placeholder privacy policy URL (you'll need to create an actual policy)",
        };
      }
      return null;
    },
  },

  {
    id: "ios-camera-permission",
    name: "iOS Camera Permission",
    tier: "warning",
    platform: "ios",
    check: (files, config) => {
      const usesCamera = Object.values(files).some(
        (content) =>
          content.includes("expo-camera") ||
          content.includes("ImagePicker") ||
          content.includes("launchCameraAsync"),
      );

      if (usesCamera) {
        const infoPlist = config?.expo?.ios?.infoPlist || {};
        if (!infoPlist.NSCameraUsageDescription) {
          return {
            id: "ios-camera-permission",
            tier: "warning",
            title: "Missing Camera Permission",
            message:
              "App uses camera but NSCameraUsageDescription not set. Apple will reject without this.",
            file: "app.json",
            autoFixable: true,
            autoFixDescription:
              "Add camera usage description to app.json",
          };
        }
      }
      return null;
    },
  },

  {
    id: "ios-location-permission",
    name: "iOS Location Permission",
    tier: "warning",
    platform: "ios",
    check: (files, config) => {
      const usesLocation = Object.values(files).some(
        (content) =>
          content.includes("expo-location") ||
          content.includes("getCurrentPositionAsync") ||
          content.includes("watchPositionAsync"),
      );

      if (usesLocation) {
        const infoPlist = config?.expo?.ios?.infoPlist || {};
        if (
          !infoPlist.NSLocationWhenInUseUsageDescription &&
          !infoPlist.NSLocationAlwaysUsageDescription
        ) {
          return {
            id: "ios-location-permission",
            tier: "warning",
            title: "Missing Location Permission",
            message:
              "App uses location but NSLocationWhenInUseUsageDescription not set",
            file: "app.json",
            autoFixable: true,
            autoFixDescription:
              "Add location usage description to app.json",
          };
        }
      }
      return null;
    },
  },

  {
    id: "ios-photo-permission",
    name: "iOS Photo Library Permission",
    tier: "warning",
    platform: "ios",
    check: (files, config) => {
      const usesPhotos = Object.values(files).some(
        (content) =>
          content.includes("launchImageLibraryAsync") ||
          content.includes("MediaLibrary"),
      );

      if (usesPhotos) {
        const infoPlist = config?.expo?.ios?.infoPlist || {};
        if (!infoPlist.NSPhotoLibraryUsageDescription) {
          return {
            id: "ios-photo-permission",
            tier: "warning",
            title: "Missing Photo Library Permission",
            message:
              "App uses photo library but NSPhotoLibraryUsageDescription not set",
            file: "app.json",
            autoFixable: true,
            autoFixDescription:
              "Add photo library usage description to app.json",
          };
        }
      }
      return null;
    },
  },

  {
    id: "placeholder-content",
    name: "Placeholder Content",
    tier: "warning",
    platform: "both",
    check: (files) => {
      const placeholders = [
        "Lorem ipsum",
        "TODO:",
        "FIXME:",
        "placeholder",
        "example.com",
        "test@test.com",
      ];

      for (const [path, content] of Object.entries(files)) {
        if (path.endsWith(".json")) continue;

        for (const placeholder of placeholders) {
          if (content.toLowerCase().includes(placeholder.toLowerCase())) {
            return {
              id: "placeholder-content",
              tier: "warning",
              title: "Placeholder Content Found",
              message: `Found "${placeholder}" in ${path}. Remove placeholder content before submission.`,
              file: path,
              autoFixable: false,
            };
          }
        }
      }
      return null;
    },
  },
];
