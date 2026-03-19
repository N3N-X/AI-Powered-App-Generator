import type { AppConfigForm } from "./native-settings-sections";

export function buildAppConfigPayload(
  form: AppConfigForm,
  platform: string,
): {
  appConfig: Record<string, unknown>;
  appJsonContent: Record<string, unknown>;
} {
  const {
    name,
    slug,
    version,
    orientation,
    icon,
    splashImage,
    splashBackgroundColor,
    iosBundleIdentifier,
    iosSupportsTablet,
    androidPackage,
    androidAdaptiveIconBg,
  } = form;

  const splash = {
    image: splashImage,
    backgroundColor: splashBackgroundColor,
  };

  const appConfig: Record<string, unknown> = {
    name,
    slug,
    version,
    orientation,
    icon,
    splash,
  };

  if (platform === "IOS" || platform === "WEB") {
    appConfig.ios = {
      bundleIdentifier: iosBundleIdentifier || `com.rux.${slug}`,
      supportsTablet: iosSupportsTablet,
    };
  }

  if (platform === "ANDROID" || platform === "WEB") {
    appConfig.android = {
      package: androidPackage || `com.rux.${slug}`,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: androidAdaptiveIconBg,
      },
    };
  }

  const appJsonContent = {
    expo: {
      name,
      slug,
      version,
      orientation,
      icon,
      userInterfaceStyle: "automatic",
      splash,
      ...(appConfig.ios ? { ios: appConfig.ios } : {}),
      ...(appConfig.android ? { android: appConfig.android } : {}),
      web: { favicon: "./assets/favicon.png" },
    },
  };

  return { appConfig, appJsonContent };
}
