import type { ArticleContent } from "../types";
import { easBuildsSection } from "./builds-deployment/eas-builds";
import { androidApkSection } from "./builds-deployment/android-apk";
import { iosIpaSection } from "./builds-deployment/ios-ipa";
import { devCredentialsSection } from "./builds-deployment/dev-credentials";
import { appStoreSection } from "./builds-deployment/app-store";

export const buildsDeploymentContent: ArticleContent = {
  "eas-builds": easBuildsSection,
  "android-apk": androidApkSection,
  "ios-ipa": iosIpaSection,
  "dev-credentials": devCredentialsSection,
  "app-store": appStoreSection,
};
