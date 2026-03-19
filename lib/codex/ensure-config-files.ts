/**
 * Ensures required config files (package.json, app.json, tsconfig.json, etc.)
 * exist in the generated code with correct dependencies for the target platform.
 *
 * Scans all generated code for imports and auto-adds matching Expo SDK 54
 * compatible packages to package.json dependencies.
 */

import type { Platform } from "./prompts/types";

/**
 * Ensure required config files exist for the given platform.
 * Mutates nothing — returns a new files record.
 */
export function ensureConfigFiles(
  files: Record<string, string>,
  appName?: string,
  appSlug?: string,
  platform?: Platform,
): Record<string, string> {
  const result = { ...files };
  const name = appName || "My App";
  const slug =
    appSlug ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  if (platform === "WEB") {
    return ensureWebConfigFiles(result, name, slug);
  }

  const REQUIRED_DEPENDENCIES: Record<string, string> = {
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
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
  };

  // Expo SDK 54 compatible optional packages — auto-added if imported
  const OPTIONAL_DEPS: Record<string, string> = {
    "react-native-purchases": "^8.0.0",
    "@expo/ui": "~0.2.0-beta.9",
    "@react-native-community/datetimepicker": "8.4.4",
    "@react-native-masked-view/masked-view": "0.3.2",
    "@react-native-community/netinfo": "11.4.1",
    "@react-native-community/slider": "5.0.1",
    "@react-native-picker/picker": "2.11.1",
    "@react-native-segmented-control/segmented-control": "2.5.7",
    "@shopify/flash-list": "2.0.2",
    "@shopify/react-native-skia": "2.2.12",
    "expo-apple-authentication": "~8.0.8",
    "expo-application": "~7.0.8",
    "expo-audio": "~1.1.1",
    "expo-auth-session": "~7.0.10",
    "expo-av": "~16.0.8",
    "expo-background-fetch": "~14.0.9",
    "expo-battery": "~10.0.8",
    "expo-brightness": "~14.0.8",
    "expo-calendar": "~15.0.8",
    "expo-camera": "~17.0.10",
    "expo-cellular": "~8.0.8",
    "expo-checkbox": "~5.0.8",
    "expo-clipboard": "~8.0.8",
    "expo-contacts": "~15.0.11",
    "expo-crypto": "~15.0.8",
    "expo-device": "~8.0.10",
    "expo-document-picker": "~14.0.8",
    "expo-file-system": "~19.0.21",
    "expo-gl": "~16.0.9",
    "expo-glass-effect": "~0.1.8",
    "expo-image": "~3.0.11",
    "expo-image-manipulator": "~14.0.8",
    "expo-image-picker": "~17.0.10",
    "expo-intent-launcher": "~13.0.8",
    "expo-keep-awake": "~15.0.8",
    "expo-local-authentication": "~17.0.8",
    "expo-localization": "~17.0.8",
    "expo-location": "~19.0.8",
    "expo-mail-composer": "~15.0.8",
    "expo-maps": "~0.12.10",
    "expo-media-library": "~18.2.1",
    "expo-mesh-gradient": "~0.4.8",
    "expo-navigation-bar": "~5.0.10",
    "expo-network": "~8.0.8",
    "expo-notifications": "~0.32.16",
    "expo-print": "~15.0.8",
    "expo-live-photo": "~1.0.8",
    "expo-router": "~6.0.22",
    "expo-screen-capture": "~8.0.9",
    "expo-screen-orientation": "~9.0.8",
    "expo-secure-store": "~15.0.8",
    "expo-sensors": "~15.0.8",
    "expo-sharing": "~14.0.8",
    "expo-sms": "~14.0.8",
    "expo-speech": "~14.0.8",
    "expo-sqlite": "~16.0.10",
    "expo-store-review": "~9.0.9",
    "expo-symbols": "~1.0.8",
    "expo-system-ui": "~6.0.9",
    "expo-task-manager": "~14.0.9",
    "expo-tracking-transparency": "~6.0.8",
    "expo-video": "~3.0.15",
    "expo-video-thumbnails": "~10.0.8",
    "expo-web-browser": "~15.0.10",
    "lottie-react-native": "~7.3.1",
    "react-native-gesture-handler": "~2.28.0",
    "react-native-get-random-values": "~1.11.0",
    "react-native-maps": "1.20.1",
    "react-native-pager-view": "6.9.1",
    "react-native-reanimated": "~4.1.1",
    "react-native-svg": "15.12.1",
    "react-native-view-shot": "4.0.3",
    "react-native-webview": "13.15.0",
    "react-native-keyboard-controller": "1.18.5",
  };

  // Detect imports across all generated source files
  const allCode = Object.values(files).join("\n");
  for (const [pkg, version] of Object.entries(OPTIONAL_DEPS)) {
    if (
      allCode.includes(`from "${pkg}"`) ||
      allCode.includes(`from '${pkg}'`)
    ) {
      REQUIRED_DEPENDENCIES[pkg] = version;
    }
  }

  // Create or merge package.json
  if (result["package.json"]) {
    try {
      const existing = JSON.parse(result["package.json"]);
      existing.dependencies = {
        ...REQUIRED_DEPENDENCIES,
        ...(existing.dependencies || {}),
      };
      if (!existing.name || existing.name === "rux-app") {
        existing.name = slug;
      }
      result["package.json"] = JSON.stringify(existing, null, 2);
    } catch {
      // If parsing fails, create new below
    }
  }

  if (!result["package.json"]) {
    result["package.json"] = JSON.stringify(
      {
        name: slug,
        version: "1.0.0",
        main: "node_modules/expo/AppEntry.js",
        scripts: {
          start: "expo start",
          android: "expo start --android",
          ios: "expo start --ios",
          web: "expo start --web",
        },
        dependencies: REQUIRED_DEPENDENCIES,
        devDependencies: {
          "@babel/core": "^7.25.2",
          "@types/react": "~19.1.0",
          typescript: "^5.7.2",
        },
      },
      null,
      2,
    );
  }

  // Build platform-specific app.json
  if (!result["app.json"]) {
    const expoConfig: Record<string, unknown> = {
      name,
      slug,
      version: "1.0.0",
      orientation: "portrait",
      userInterfaceStyle: "automatic",
    };
    if (platform !== "ANDROID") {
      expoConfig.ios = { supportsTablet: true };
    }
    if (platform !== "IOS") {
      expoConfig.android = {
        adaptiveIcon: { backgroundColor: "#1a1a2e" },
      };
    }
    result["app.json"] = JSON.stringify({ expo: expoConfig }, null, 2);
  } else {
    try {
      const existing = JSON.parse(result["app.json"]);
      if (
        existing.expo?.name === "Rulxy App" ||
        existing.expo?.slug === "rux-app"
      ) {
        existing.expo.name = name;
        existing.expo.slug = slug;
        result["app.json"] = JSON.stringify(existing, null, 2);
      }
    } catch {
      // Ignore parse errors
    }
  }

  if (!result["tsconfig.json"]) {
    result["tsconfig.json"] = JSON.stringify(
      { extends: "expo/tsconfig.base", compilerOptions: { strict: true } },
      null,
      2,
    );
  }

  if (!result["babel.config.js"]) {
    result["babel.config.js"] = `module.exports = function(api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};`;
  }

  return result;
}

function ensureWebConfigFiles(
  files: Record<string, string>,
  appName: string,
  appSlug: string,
): Record<string, string> {
  const result = { ...files };

  if (!result["package.json"]) {
    result["package.json"] = JSON.stringify(
      {
        name: appSlug,
        version: "1.0.0",
        private: true,
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
        },
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          "lucide-react": "^0.400.0",
        },
        devDependencies: {
          "@types/react": "^18.2.0",
          "@types/react-dom": "^18.2.0",
          "@vitejs/plugin-react": "^4.0.0",
          typescript: "^5.2.0",
          vite: "^5.0.0",
        },
      },
      null,
      2,
    );
  }

  if (!result["tsconfig.json"]) {
    result["tsconfig.json"] = JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          skipLibCheck: true,
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx",
          strict: true,
        },
        include: ["src", "App.tsx"],
      },
      null,
      2,
    );
  }

  return result;
}
