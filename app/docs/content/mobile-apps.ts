import type { ArticleContent } from "../types";
import { iosSection } from "./mobile-apps/ios";
import { androidSection } from "./mobile-apps/android";
import { reactNativeSection } from "./mobile-apps/react-native";
import { expoPreviewSection } from "./mobile-apps/expo-preview";
import { nativeFeaturesSection } from "./mobile-apps/native-features";

export const mobileAppsContent: ArticleContent = {
  ios: iosSection,
  android: androidSection,
  "react-native": reactNativeSection,
  "expo-preview": expoPreviewSection,
  "native-features": nativeFeaturesSection,
};
