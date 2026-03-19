import type { ArticleContent } from "../types";
import { gettingStartedContent } from "./getting-started";
import { aiGenerationContent } from "./ai-generation";
import { webAppsContent } from "./web-apps";
import { mobileAppsContent } from "./mobile-apps";
import { codeFilesContent } from "./code-files";
import { githubIntegrationContent } from "./github-integration";
import { buildsDeploymentContent } from "./builds-deployment";
import { apiProxiesContent } from "./api-proxies";
import { apiReferenceContent } from "./api-reference";

export const articleContent: ArticleContent = {
  ...gettingStartedContent,
  ...aiGenerationContent,
  ...webAppsContent,
  ...mobileAppsContent,
  ...codeFilesContent,
  ...githubIntegrationContent,
  ...buildsDeploymentContent,
  ...apiProxiesContent,
  ...apiReferenceContent,
};
