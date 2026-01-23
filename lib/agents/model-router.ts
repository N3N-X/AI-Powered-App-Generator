/**
 * Intelligent Model Router
 *
 * Routes tasks to appropriate AI models based on complexity analysis.
 * Uses fast models (Grok) for simple tasks, powerful models (Sonnet) for complex ones.
 */

import { TaskComplexity } from "./types";

// Model configuration for each complexity level
export const MODEL_ROUTING = {
  orchestrator: {
    [TaskComplexity.SIMPLE]: "grok-4-1-fast-reasoning",
    [TaskComplexity.MODERATE]: "grok-4-1-fast-reasoning",
    [TaskComplexity.COMPLEX]: "grok-4-1-fast-reasoning",
    [TaskComplexity.ADVANCED]: "claude-sonnet-4-5-20250514",
  },
  worker: {
    [TaskComplexity.SIMPLE]: "grok-code-fast-1",
    [TaskComplexity.MODERATE]: "grok-code-fast-1",
    [TaskComplexity.COMPLEX]: "claude-sonnet-4-5-20250514",
    [TaskComplexity.ADVANCED]: "claude-sonnet-4-5-20250514",
  },
  critic: {
    [TaskComplexity.SIMPLE]: "grok-4-1-fast-reasoning",
    [TaskComplexity.MODERATE]: "claude-haiku-4-5-20251001",
    [TaskComplexity.COMPLEX]: "claude-sonnet-4-5-20250514",
    [TaskComplexity.ADVANCED]: "claude-sonnet-4-5-20250514",
  },
  fixer: {
    [TaskComplexity.SIMPLE]: "grok-code-fast-1",
    [TaskComplexity.MODERATE]: "grok-code-fast-1",
    [TaskComplexity.COMPLEX]: "grok-code-fast-1",
    [TaskComplexity.ADVANCED]: "grok-code-fast-1",
  },
} as const;

// Keywords indicating different complexity levels
const COMPLEXITY_KEYWORDS = {
  complex: [
    "authentication",
    "auth",
    "login",
    "signup",
    "payment",
    "stripe",
    "real-time",
    "websocket",
    "database schema",
    "api integration",
    "complex state",
    "redux",
    "zustand",
  ],
  moderate: [
    "screen",
    "navigation",
    "form",
    "list",
    "card",
    "modal",
    "drawer",
    "tabs",
    "animation",
    "chart",
    "graph",
  ],
  simple: [
    "button",
    "color",
    "text",
    "style",
    "fix",
    "change",
    "update",
    "rename",
    "remove",
    "add icon",
    "add image",
  ],
};

/**
 * Analyze task complexity based on user prompt and existing codebase
 */
export function analyzeTaskComplexity(
  userPrompt: string,
  existingFiles?: Record<string, string>,
): TaskComplexity {
  const prompt = userPrompt.toLowerCase();
  let score = 0;

  // Keyword analysis (weighted scoring)
  const hasComplexKeywords = COMPLEXITY_KEYWORDS.complex.some((kw) =>
    prompt.includes(kw),
  );
  const hasModerateKeywords = COMPLEXITY_KEYWORDS.moderate.some((kw) =>
    prompt.includes(kw),
  );
  const hasSimpleKeywords = COMPLEXITY_KEYWORDS.simple.some((kw) =>
    prompt.includes(kw),
  );

  if (hasComplexKeywords) score += 3;
  if (hasModerateKeywords) score += 2;
  if (hasSimpleKeywords) score += 1;

  // Existing codebase analysis
  const fileCount = existingFiles ? Object.keys(existingFiles).length : 0;

  if (fileCount === 0) {
    // New app = complex by default
    score += 3;
  } else if (fileCount < 5) {
    // Small refinement
    score += 1;
  } else if (fileCount >= 10) {
    // Large codebase modification = more complex
    score += 2;
  }

  // Check for multiple features in prompt (indicates complexity)
  const featureIndicators = [" and ", ",", "also", "plus", "with"];
  const multiFeature = featureIndicators.some((indicator) =>
    prompt.includes(indicator),
  );
  if (multiFeature) score += 1;

  // Check prompt length (very short = simple, very long = complex)
  const wordCount = prompt.split(/\s+/).length;
  if (wordCount < 10) {
    score += 0; // Short prompt likely simple
  } else if (wordCount > 30) {
    score += 2; // Long detailed prompt = complex
  }

  // Determine final complexity
  if (score <= 3) return TaskComplexity.SIMPLE;
  if (score <= 6) return TaskComplexity.MODERATE;
  if (score <= 9) return TaskComplexity.COMPLEX;
  return TaskComplexity.ADVANCED;
}

/**
 * Get the appropriate model for a given role and complexity
 */
export function getModelForTask(
  role: keyof typeof MODEL_ROUTING,
  complexity: TaskComplexity,
): string {
  return MODEL_ROUTING[role][complexity];
}

/**
 * Get all models needed for a task (orchestrator, worker, critic, fixer)
 */
export function getModelsForComplexity(complexity: TaskComplexity): {
  orchestrator: string;
  worker: string;
  critic: string;
  fixer: string;
} {
  return {
    orchestrator: MODEL_ROUTING.orchestrator[complexity],
    worker: MODEL_ROUTING.worker[complexity],
    critic: MODEL_ROUTING.critic[complexity],
    fixer: MODEL_ROUTING.fixer[complexity],
  };
}

/**
 * Estimate cost reduction percentage by using intelligent routing
 * (compared to always using Sonnet 4.5)
 */
export function estimateCostSavings(complexity: TaskComplexity): number {
  // Approximate cost reduction compared to always using Sonnet
  const savings = {
    [TaskComplexity.SIMPLE]: 70, // Grok is much cheaper
    [TaskComplexity.MODERATE]: 50, // Mix of Grok and Haiku
    [TaskComplexity.COMPLEX]: 20, // Mostly Sonnet but with Grok fixer
    [TaskComplexity.ADVANCED]: 0, // Full Sonnet pipeline
  };

  return savings[complexity];
}

/**
 * Get human-readable complexity description
 */
export function getComplexityDescription(complexity: TaskComplexity): string {
  const descriptions = {
    [TaskComplexity.SIMPLE]:
      "Simple refinement (fast models for quick iteration)",
    [TaskComplexity.MODERATE]: "Moderate task (balanced speed and quality)",
    [TaskComplexity.COMPLEX]: "Complex implementation (high-quality models)",
    [TaskComplexity.ADVANCED]:
      "Advanced architecture (premium models for best results)",
  };

  return descriptions[complexity];
}
