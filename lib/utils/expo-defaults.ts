/**
 * Generate default app.json for Expo project
 */
export function getDefaultAppJson(
  projectName: string,
  slug: string,
  platform?: "IOS" | "ANDROID" | "WEB",
): string {
  return JSON.stringify(
    {
      expo: {
        name: projectName,
        slug: slug,
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        splash: {
          image: "./assets/splash.png",
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
        assetBundlePatterns: ["**/*"],
        // Only include the relevant platform config
        ...(platform !== "ANDROID"
          ? {
              ios: {
                supportsTablet: true,
              },
            }
          : {}),
        ...(platform !== "IOS"
          ? {
              android: {
                adaptiveIcon: {
                  foregroundImage: "./assets/adaptive-icon.png",
                  backgroundColor: "#ffffff",
                },
              },
            }
          : {}),
        web: {
          favicon: "./assets/favicon.png",
        },
      },
    },
    null,
    2,
  );
}

/**
 * Generate default package.json for Expo project
 */
export function getDefaultPackageJson(
  projectName: string,
  slug: string,
): string {
  const sanitizedName = slug.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase();

  return JSON.stringify(
    {
      name: sanitizedName,
      version: "1.0.0",
      main: "expo/AppEntry.js",
      scripts: {
        start: "expo start",
        android: "expo start --android",
        ios: "expo start --ios",
        web: "expo start --web",
      },
      dependencies: {
        expo: "~51.0.28",
        "expo-status-bar": "~1.12.1",
        react: "18.2.0",
        "react-native": "0.74.5",
      },
      devDependencies: {
        "@babel/core": "^7.20.0",
      },
      private: true,
    },
    null,
    2,
  );
}

/**
 * Generate default tsconfig.json for Expo project
 */
export function getDefaultTsconfig(): string {
  return JSON.stringify(
    {
      extends: "expo/tsconfig.base",
      compilerOptions: {
        strict: true,
      },
    },
    null,
    2,
  );
}

/**
 * Generate default assets structure
 */
export function getDefaultAssets(): Record<string, string> {
  return {
    "assets/icon.png": "// Default icon placeholder - replace with actual icon",
    "assets/splash.png":
      "// Default splash screen placeholder - replace with actual splash",
    "assets/adaptive-icon.png":
      "// Default adaptive icon placeholder - replace with actual icon",
    "assets/favicon.png":
      "// Default favicon placeholder - replace with actual favicon",
  };
}
