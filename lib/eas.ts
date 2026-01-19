import { BuildPlatform, BuildStatus, CodeFiles, AppConfig } from "@/types";

const EAS_API_BASE = "https://api.expo.dev/v2";

interface EASBuildRequest {
  platform: "android" | "ios";
  profile: string;
  projectId: string;
}

interface EASBuildResponse {
  id: string;
  status: string;
  platform: string;
  artifacts?: {
    buildUrl?: string;
    applicationArchiveUrl?: string;
  };
  error?: {
    message: string;
  };
}

interface BuildSubmission {
  platform: BuildPlatform;
  profile: "development" | "preview" | "production";
  codeFiles: CodeFiles;
  appConfig: AppConfig;
  credentials?: {
    expo?: { accessToken: string };
    apple?: { keyId: string; issuerId: string; p8Key: string; teamId: string };
    google?: { serviceAccountJson: string };
  };
}

/**
 * Get EAS API token
 */
function getEASToken(): string {
  const token = process.env.EAS_ACCESS_TOKEN;
  if (!token) {
    throw new Error("EAS_ACCESS_TOKEN is not configured");
  }
  return token;
}

/**
 * Make authenticated request to EAS API
 */
async function easFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getEASToken();

  const response = await fetch(`${EAS_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`EAS API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Generate app.json/app.config.js content
 */
function generateAppConfig(config: AppConfig): string {
  const appConfig = {
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
      ios: {
        supportsTablet: config.ios?.supportsTablet ?? true,
        bundleIdentifier: config.ios?.bundleIdentifier || `com.rux.${config.slug}`,
      },
      android: {
        adaptiveIcon: config.android?.adaptiveIcon || {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#ffffff",
        },
        package: config.android?.package || `com.rux.${config.slug}`,
      },
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

/**
 * Generate eas.json configuration
 */
function generateEASConfig(): string {
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
        production: {},
      },
    },
    null,
    2
  );
}

/**
 * Generate package.json for the Expo project
 */
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
        expo: "~52.0.0",
        "expo-status-bar": "~2.0.0",
        react: "18.3.1",
        "react-native": "0.76.3",
        "@react-navigation/native": "^7.0.0",
        "@react-navigation/native-stack": "^7.0.0",
        "react-native-screens": "~4.3.0",
        "react-native-safe-area-context": "4.14.0",
      },
      devDependencies: {
        "@babel/core": "^7.24.0",
        "@types/react": "~18.3.0",
        typescript: "~5.3.0",
      },
      private: true,
    },
    null,
    2
  );
}

/**
 * Prepare project files for EAS Build
 */
export function prepareProjectForBuild(
  codeFiles: CodeFiles,
  appConfig: AppConfig
): CodeFiles {
  const preparedFiles: CodeFiles = { ...codeFiles };

  // Add app.json if not present
  if (!preparedFiles["app.json"]) {
    preparedFiles["app.json"] = generateAppConfig(appConfig);
  }

  // Add eas.json
  preparedFiles["eas.json"] = generateEASConfig();

  // Add package.json if not present
  if (!preparedFiles["package.json"]) {
    preparedFiles["package.json"] = generatePackageJson(appConfig);
  }

  // Add tsconfig.json if using TypeScript
  if (!preparedFiles["tsconfig.json"]) {
    preparedFiles["tsconfig.json"] = JSON.stringify(
      {
        extends: "expo/tsconfig.base",
        compilerOptions: {
          strict: true,
        },
      },
      null,
      2
    );
  }

  // Add babel.config.js
  if (!preparedFiles["babel.config.js"]) {
    preparedFiles["babel.config.js"] = `module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};`;
  }

  // Add default assets directory structure
  if (!preparedFiles["assets/.gitkeep"]) {
    preparedFiles["assets/.gitkeep"] = "";
  }

  return preparedFiles;
}

/**
 * Trigger EAS Build via API
 * Note: This is a simplified version. In production, you'd use the EAS CLI
 * or the full EAS Build API which requires uploading the project first.
 */
export async function triggerEASBuild(
  submission: BuildSubmission
): Promise<{ buildId: string; buildUrl: string }> {
  const { platform, profile } = submission;

  // In a real implementation, you would:
  // 1. Create a tarball of the project files
  // 2. Upload to EAS
  // 3. Trigger the build via GraphQL API

  // For now, we'll use the EAS CLI approach via a webhook/worker
  // This returns a placeholder that would be replaced with actual build info

  const buildId = `build-${Date.now()}-${platform}`;

  // Store build request for background processing
  const buildRequest = {
    id: buildId,
    platform: platform.toLowerCase(),
    profile,
    status: "queued",
    createdAt: new Date().toISOString(),
  };

  // In production, this would be sent to a queue for processing
  console.log("Build request created:", buildRequest);

  return {
    buildId,
    buildUrl: `https://expo.dev/accounts/rux/projects/app/builds/${buildId}`,
  };
}

/**
 * Check build status
 */
export async function getBuildStatus(buildId: string): Promise<{
  status: BuildStatus;
  artifactUrl?: string;
  logs?: string;
  error?: string;
}> {
  try {
    // Query EAS for build status
    // This would use the actual EAS GraphQL API in production

    // Placeholder response
    return {
      status: "BUILDING",
    };
  } catch (error) {
    return {
      status: "FAILED",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Cancel a running build
 */
export async function cancelBuild(buildId: string): Promise<boolean> {
  try {
    // In production, call EAS API to cancel
    console.log(`Cancelling build: ${buildId}`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get download URL for build artifact
 */
export async function getBuildArtifact(
  buildId: string
): Promise<{ url: string; expiresAt: Date } | null> {
  try {
    const status = await getBuildStatus(buildId);

    if (status.status === "SUCCESS" && status.artifactUrl) {
      return {
        url: status.artifactUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Validate credentials for building
 */
export function validateBuildCredentials(
  platform: BuildPlatform,
  credentials: BuildSubmission["credentials"]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!credentials?.expo?.accessToken) {
    errors.push("Expo access token is required");
  }

  if (platform === "IOS") {
    if (!credentials?.apple) {
      errors.push("Apple Developer credentials are required for iOS builds");
    } else {
      if (!credentials.apple.keyId) errors.push("Apple Key ID is required");
      if (!credentials.apple.issuerId) errors.push("Apple Issuer ID is required");
      if (!credentials.apple.p8Key) errors.push("Apple P8 key is required");
      if (!credentials.apple.teamId) errors.push("Apple Team ID is required");
    }
  }

  if (platform === "ANDROID") {
    // Android builds can work without credentials for debug builds
    // Production builds need Google Play credentials for signing
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
  profile: string
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
