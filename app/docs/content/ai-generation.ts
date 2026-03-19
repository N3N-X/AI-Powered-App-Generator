import type { ArticleContent } from "../types";
import { howItWorksSection } from "./ai-generation/how-it-works";
import { promptsSection } from "./ai-generation/prompts";
import { iterativeSection } from "./ai-generation/iterative";
import { creditsSection } from "./ai-generation/credits";

export const aiGenerationContent: ArticleContent = {
  "how-it-works": howItWorksSection,
  prompts: promptsSection,
  iterative: iterativeSection,
  credits: creditsSection,
};
