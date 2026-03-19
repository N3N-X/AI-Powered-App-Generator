import { CodeFiles, AppConfig } from "@/types";

function generateAppConfig(
  config: AppConfig,
  platform?: "ANDROID" | "IOS",
): string {
  const appConfig: Record<string, unknown> = {
    expo: {
      name: config.name,
      slug: config.slug,
      version: config.version || "1.0.0",
      orientation: config.orientation || "portrait",
      icon: config.icon || "./assets/icon.png",
      userInterfaceStyle: "automatic",
      splash: config.splash || {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
      // Only include the relevant platform config
      ...(platform !== "ANDROID"
        ? {
            ios: {
              supportsTablet: config.ios?.supportsTablet ?? true,
              bundleIdentifier:
                config.ios?.bundleIdentifier || `com.rux.${config.slug}`,
            },
          }
        : {}),
      ...(platform !== "IOS"
        ? {
            android: {
              adaptiveIcon: config.android?.adaptiveIcon || {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff",
              },
              package: config.android?.package || `com.rux.${config.slug}`,
            },
          }
        : {}),
      web: {
        favicon: "./assets/favicon.png",
      },
      extra: {
        eas: {
          projectId: process.env.EXPO_PROJECT_ID,
        },
      },
    },
  };

  return JSON.stringify(appConfig, null, 2);
}

function generateEASConfig(profile: string): string {
  return JSON.stringify(
    {
      cli: {
        version: ">= 5.0.0",
      },
      build: {
        development: {
          developmentClient: true,
          distribution: "internal",
          android: {
            gradleCommand: ":app:assembleDebug",
          },
          ios: {
            buildConfiguration: "Debug",
          },
        },
        preview: {
          distribution: "internal",
          android: {
            buildType: "apk",
          },
        },
        production: {
          android: {
            buildType: "app-bundle",
          },
        },
      },
      submit: {
        production: {
          android: {
            serviceAccountKeyPath: "./google-service-account.json",
            track: "internal",
          },
          ios: {
            ascAppId: "",
          },
        },
      },
    },
    null,
    2,
  );
}

function generatePackageJson(config: AppConfig): string {
  return JSON.stringify(
    {
      name: config.slug,
      version: config.version || "1.0.0",
      main: "node_modules/expo/AppEntry.js",
      scripts: {
        start: "expo start",
        android: "expo start --android",
        ios: "expo start --ios",
        web: "expo start --web",
      },
      dependencies: {
        expo: "~54.0.0",
        "expo-asset": "~12.0.12",
        "expo-blur": "~15.0.8",
        "expo-constants": "~18.0.13",
        "expo-font": "~14.0.11",
        "expo-haptics": "~15.0.8",
        "expo-linear-gradient": "~15.0.8",
        "expo-linking": "~8.0.11",
        "expo-splash-screen": "~31.0.13",
        "expo-status-bar": "~3.0.9",
        "@expo/vector-icons": "^15.0.3",
        "@react-native-async-storage/async-storage": "2.2.0",
        react: "19.1.0",
        "react-native": "0.81.5",
        "@react-navigation/native": "^7.0.0",
        "@react-navigation/native-stack": "^7.0.0",
        "@react-navigation/bottom-tabs": "^7.0.0",
        "react-native-screens": "~4.16.0",
        "react-native-safe-area-context": "~5.6.0",
      },
      devDependencies: {
        "@babel/core": "^7.26.0",
        "@types/react": "~19.1.0",
        typescript: "~5.7.2",
      },
      private: true,
    },
    null,
    2,
  );
}

/**
 * Prepare project files for EAS Build
 */
export function prepareProjectForBuild(
  codeFiles: CodeFiles,
  appConfig: AppConfig,
  profile: string = "production",
  platform?: "ANDROID" | "IOS",
): CodeFiles {
  const preparedFiles: CodeFiles = { ...codeFiles };

  if (!preparedFiles["app.json"]) {
    preparedFiles["app.json"] = generateAppConfig(appConfig, platform);
  }

  preparedFiles["eas.json"] = generateEASConfig(profile);

  if (!preparedFiles["package.json"]) {
    preparedFiles["package.json"] = generatePackageJson(appConfig);
  }

  if (!preparedFiles["tsconfig.json"]) {
    preparedFiles["tsconfig.json"] = JSON.stringify(
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

  if (!preparedFiles["babel.config.js"]) {
    preparedFiles["babel.config.js"] = `module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};`;
  }

  if (!preparedFiles["assets/.gitkeep"]) {
    preparedFiles["assets/.gitkeep"] = "";
  }

  return preparedFiles;
}
