import type { ArticleContent } from "../types";
import { authSection } from "./api-reference/authentication";
import { projectsSection } from "./api-reference/projects";
import { generationSection } from "./api-reference/generation";
import { proxySection } from "./api-reference/proxy";
import { webhooksSection } from "./api-reference/webhooks";

export const apiReferenceContent: ArticleContent = {
  authentication: authSection,
  "projects-api": projectsSection,
  generation: generationSection,
  "proxy-apis": proxySection,
  webhooks: webhooksSection,
};
