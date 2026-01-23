/**
 * Multi-Agent Orchestrator with Intelligent Model Routing
 *
 * Flow:
 * 1. Analyze task complexity
 * 2. Route to appropriate models based on complexity
 * 3. Orchestrator - Plans the app (Grok Fast or Sonnet)
 * 4. Workers - Generate code (Grok Code Fast or Sonnet)
 * 5. Critic - Validates code (Grok Fast, Haiku, or Sonnet)
 * 6. Fixer - Auto-fixes errors (Grok Code Fast)
 */

import {
  Platform,
  AppSpec,
  StreamUpdate,
  CriticResult,
  GenerationContext,
  TaskComplexity,
} from "./types";
import {
  buildOrchestratorPrompt,
  getWorkerPrompt,
  buildCriticPrompt,
  buildFixerPrompt,
  buildApiServiceCode,
  buildApiServiceCodeForSpec,
} from "./prompts";
import {
  analyzeTaskComplexity,
  getModelsForComplexity,
  getComplexityDescription,
} from "./model-router";
import Anthropic from "@anthropic-ai/sdk";

// Default model configurations (can be overridden by complexity analysis)
const DEFAULT_MODELS = {
  orchestrator: "grok-4-1-fast-reasoning",
  worker: "grok-code-fast-1",
  critic: "claude-haiku-4-5-20251001",
  fixer: "grok-code-fast-1",
};

const XAI_API_URL = "https://api.x.ai/v1/chat/completions";

type StreamCallback = (update: StreamUpdate) => void;

/**
 * Call xAI API
 */
async function callXAI(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 16384,
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY not configured");

  const response = await fetch(XAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    let errorMessage = `xAI API error (${response.status}): ${response.statusText}`;

    try {
      const errorData = await response.json();
      errorMessage =
        errorData?.error?.message ||
        errorData?.message ||
        JSON.stringify(errorData);
    } catch {
      const errorText = await response.text().catch(() => "");
      if (errorText) {
        errorMessage = errorText;
      }
    }

    console.error("[xAI] API error:", errorMessage);
    throw new Error(`xAI API error: ${errorMessage}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.error("[xAI] Empty response:", data);
    throw new Error("xAI returned empty response");
  }

  return content;
}

/**
 * Call Claude Haiku for validation
 */
async function callHaiku(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) throw new Error("CLAUDE_API_KEY not configured");

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: MODELS.critic,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return content.text;
}

/**
 * Parse JSON from AI response (handles markdown wrapping)
 */
function parseJSON<T>(content: string): T {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  let jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();

  // Try to find JSON object directly
  if (!jsonMatch) {
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonStr = objectMatch[0];
    }
  }

  return JSON.parse(jsonStr);
}

/**
 * Step 1: Orchestrator - Plan the app
 */
async function planApp(
  context: GenerationContext,
  onStream: StreamCallback,
  complexity: TaskComplexity,
): Promise<AppSpec> {
  // Get appropriate models for this complexity level
  const models = getModelsForComplexity(complexity);

  onStream({
    phase: "planning",
    message: "Planning your app",
    icon: "🎯",
    progress: 5,
    detail: `Using ${models.orchestrator} for planning...`,
  });

  const systemPrompt = buildOrchestratorPrompt(context.apiBaseUrl);
  const userPrompt = `Create an app: ${context.userPrompt}

Target platforms: ${context.platforms.join(", ")}

${context.existingCode ? `Existing code to refine:\n${JSON.stringify(context.existingCode, null, 2)}` : ""}`;

  onStream({
    phase: "planning",
    message: "Thinking about your app",
    icon: "🤔",
    progress: 10,
    detail: "Designing app structure and features...",
  });

  // Use complexity-appropriate model for orchestration
  const isClaudeModel = models.orchestrator.includes("claude");
  const response = isClaudeModel
    ? await callClaude(models.orchestrator, systemPrompt, userPrompt, 8192)
    : await callXAI(models.orchestrator, systemPrompt, userPrompt, 8192);

  onStream({
    phase: "planning",
    message: "Planning screens and navigation",
    icon: "🗺️",
    progress: 15,
    detail: "Organizing user flows...",
  });

  const spec = parseJSON<AppSpec>(response);

  onStream({
    phase: "planning",
    message: "App architecture ready",
    icon: "✅",
    progress: 20,
    detail: `Designed ${spec.screens.length} screens with ${spec.features.length} features`,
  });

  return spec;
}

/**
 * Step 2: Workers - Generate code for each platform
 */
async function generateCode(
  spec: AppSpec,
  context: GenerationContext,
  onStream: StreamCallback,
  complexity: TaskComplexity,
): Promise<Record<string, string>> {
  // Get appropriate models for this complexity level
  const models = getModelsForComplexity(complexity);

  onStream({
    phase: "building",
    message: "Starting code generation",
    icon: "🔨",
    progress: 25,
    detail: `Using ${models.worker} for code generation...`,
  });

  const allFiles: Record<string, string> = {};
  const platform = context.platforms[0] || "IOS"; // Primary platform

  // Build the worker prompt
  const workerPrompt = getWorkerPrompt(platform, context.apiBaseUrl);

  // Create detailed prompt for worker
  const isRefinement =
    context.existingCode && Object.keys(context.existingCode).length > 0;

  const userPrompt = isRefinement
    ? `REFINEMENT REQUEST - ADD TO EXISTING APP (DO NOT REPLACE!)

## EXISTING CODE (PRESERVE ALL OF THIS):
${JSON.stringify(context.existingCode, null, 2)}

## USER'S REQUEST:
"${context.userPrompt}"

## CRITICAL INSTRUCTIONS:
1. KEEP ALL EXISTING SCREENS AND FUNCTIONALITY - do not remove anything!
2. ADD the new feature/screen the user requested
3. UPDATE App.tsx to include any new screens in navigation
4. UPDATE any existing screens if needed to integrate with new features
5. Return ALL files - both existing (possibly modified) AND new files

You must return the COMPLETE app with all existing files + new additions.
Return as JSON with all file paths as keys.`
    : `Build this app based on the spec:

${JSON.stringify(spec, null, 2)}

User request: ${context.userPrompt}

Requirements:
1. Create all screens defined in the spec
2. Implement all features listed
3. Use the styling colors: ${spec.styling.primaryColor}, ${spec.styling.secondaryColor}
4. Style: ${spec.styling.style}
5. Start on the MAIN screen (first screen in list), NOT login
6. Create src/services/api.ts with full proxy support

Return complete, working code as JSON.`;

  onStream({
    phase: "building",
    message: "Building UI components",
    icon: "🎨",
    progress: 35,
    detail: `Creating ${spec.screens.length} screens...`,
  });

  onStream({
    phase: "building",
    message: "Writing code",
    icon: "💻",
    progress: 45,
    detail: "AI is generating React components...",
  });

  // Use complexity-appropriate model for code generation
  const isClaudeModel = models.worker.includes("claude");
  const response = isClaudeModel
    ? await callClaude(models.worker, workerPrompt, userPrompt, 32768)
    : await callXAI(models.worker, workerPrompt, userPrompt, 32768);

  onStream({
    phase: "building",
    message: "Processing generated code",
    icon: "⚙️",
    progress: 60,
    detail: "Organizing files...",
  });

  try {
    const files = parseJSON<Record<string, string>>(response);
    Object.assign(allFiles, files);
  } catch (e) {
    console.error("Failed to parse worker response:", e);
    throw new Error("Failed to generate code");
  }

  onStream({
    phase: "building",
    message: "Configuring API services",
    icon: "🔌",
    progress: 70,
    detail: "Setting up API integrations...",
  });

  // ALWAYS inject our api.ts - replace any AI-generated version
  // This ensures correct API_BASE URL, API key, and only needed services
  allFiles["src/services/api.ts"] = buildApiServiceCodeForSpec(
    context.apiBaseUrl,
    {
      authRequired: spec.api.authRequired,
      paymentsRequired: spec.api.paymentsRequired,
      externalApis: spec.api.externalApis,
    },
    context.apiKey, // Inject actual API key if provided
  );

  onStream({
    phase: "building",
    message: "Code generation complete",
    icon: "✅",
    progress: 80,
    detail: `Generated ${Object.keys(allFiles).length} files successfully`,
  });

  return allFiles;
}

/**
 * Step 3: Critic - Validate the code
 */
async function validateCode(
  files: Record<string, string>,
  context: GenerationContext,
  onStream: StreamCallback,
): Promise<CriticResult> {
  onStream({
    phase: "validating",
    message: "Polishing",
    icon: "✨",
    progress: 80,
    detail: "Checking for issues...",
  });

  const systemPrompt = buildCriticPrompt();
  const userPrompt = `Validate this code for a ${context.platforms[0]} app:

${JSON.stringify(files, null, 2)}

Check for:
1. Missing imports
2. Incorrect package usage (axios, wrong navigation)
3. Relative URLs (should use API_BASE)
4. Runtime errors
5. Missing dependencies
6. Platform incompatibilities`;

  const response = await callHaiku(systemPrompt, userPrompt);
  return parseJSON<CriticResult>(response);
}

/**
 * Step 4: Fixer - Auto-fix errors
 */
async function fixErrors(
  files: Record<string, string>,
  errors: CriticResult,
  onStream: StreamCallback,
): Promise<Record<string, string>> {
  onStream({
    phase: "fixing",
    message: "Optimizing",
    icon: "🔧",
    progress: 85,
    detail: "Fixing issues...",
  });

  const systemPrompt = buildFixerPrompt();
  const userPrompt = `Fix these errors in the code:

ERRORS:
${JSON.stringify(errors.errors, null, 2)}

CODE:
${JSON.stringify(files, null, 2)}

Return only the fixed files as JSON.`;

  const response = await callXAI(MODELS.fixer, systemPrompt, userPrompt, 32768);

  try {
    const fixedFiles = parseJSON<Record<string, string>>(response);
    // Merge fixes into original files
    return { ...files, ...fixedFiles };
  } catch (e) {
    console.error("Failed to parse fixer response:", e);
    return files; // Return original if fix fails
  }
}

/**
 * Ensure required config files exist
 */
function ensureConfigFiles(
  files: Record<string, string>,
): Record<string, string> {
  const result = { ...files };

  const REQUIRED_DEPENDENCIES = {
    expo: "~52.0.0",
    "expo-blur": "~14.0.1",
    "expo-haptics": "~14.0.0",
    "expo-linear-gradient": "~14.0.1",
    "expo-status-bar": "~2.0.0",
    react: "18.3.1",
    "react-native": "0.76.5",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    "@expo/vector-icons": "^14.0.0",
    "react-native-safe-area-context": "4.12.0",
    "react-native-screens": "~4.4.0",
  };

  // Create or merge package.json
  if (result["package.json"]) {
    try {
      const existing = JSON.parse(result["package.json"]);
      existing.dependencies = {
        ...REQUIRED_DEPENDENCIES,
        ...(existing.dependencies || {}),
      };
      result["package.json"] = JSON.stringify(existing, null, 2);
    } catch {
      // If parsing fails, create new
    }
  }

  if (!result["package.json"]) {
    result["package.json"] = JSON.stringify(
      {
        name: "rux-app",
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
          "@types/react": "~18.3.12",
          typescript: "^5.7.2",
        },
      },
      null,
      2,
    );
  }

  if (!result["app.json"]) {
    result["app.json"] = JSON.stringify(
      {
        expo: {
          name: "RUX App",
          slug: "rux-app",
          version: "1.0.0",
          orientation: "portrait",
          userInterfaceStyle: "automatic",
          ios: { supportsTablet: true },
          android: { adaptiveIcon: { backgroundColor: "#1a1a2e" } },
        },
      },
      null,
      2,
    );
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

/**
 * Step 1: Plan the app and return spec for user confirmation
 */
export async function orchestratePlan(
  context: GenerationContext,
  onStream: StreamCallback,
): Promise<{
  spec: AppSpec | null;
  success: boolean;
  complexity?: TaskComplexity;
}> {
  try {
    // Analyze task complexity
    const complexity = analyzeTaskComplexity(
      context.userPrompt,
      context.existingCode,
    );
    const complexityDesc = getComplexityDescription(complexity);

    console.log(
      `[Orchestrator] Task complexity: ${complexity} - ${complexityDesc}`,
    );

    // Inform user about complexity and model selection
    onStream({
      phase: "planning",
      message: "Analyzing task complexity",
      icon: "🔍",
      progress: 2,
      detail: complexityDesc,
    });

    const spec = await planApp(context, onStream, complexity);

    console.log("Planning complete, sending spec for confirmation:", spec.name);

    // Send spec to user for confirmation
    onStream({
      phase: "awaiting_confirmation",
      message: "Review your app",
      icon: "📋",
      progress: 20,
      detail: "Please review the planned structure",
      appSpec: spec,
    });

    return { spec, success: true, complexity };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Orchestrator] Planning error:", errorMessage, error);

    // Send detailed error to user
    onStream({
      phase: "error",
      message: "Planning failed",
      icon: "❌",
      progress: 0,
      detail: errorMessage,
    });

    return { spec: null, success: false };
  }
}

/**
 * Step 2: Build from confirmed spec
 */
export async function orchestrateBuild(
  spec: AppSpec,
  context: GenerationContext,
  onStream: StreamCallback,
  complexity?: TaskComplexity,
): Promise<{ files: Record<string, string>; success: boolean }> {
  try {
    // Use provided complexity or re-analyze
    const taskComplexity =
      complexity ??
      analyzeTaskComplexity(context.userPrompt, context.existingCode);

    // Generate code - AI should produce correct code from the start
    let files = await generateCode(spec, context, onStream, taskComplexity);

    onStream({
      phase: "building",
      message: "Adding configuration files",
      icon: "📦",
      progress: 85,
      detail: "Setting up package.json, tsconfig, etc...",
    });

    // Ensure required config files exist
    files = ensureConfigFiles(files);

    onStream({
      phase: "building",
      message: "Final touches",
      icon: "✨",
      progress: 95,
      detail: "Optimizing and organizing files...",
    });

    onStream({
      phase: "complete",
      message: "Your app is ready!",
      icon: "🎉",
      progress: 100,
      detail: `Successfully generated ${Object.keys(files).length} files`,
    });

    return { files, success: true };
  } catch (error) {
    console.error("Build error:", error);

    onStream({
      phase: "error",
      message: "Build failed",
      icon: "❌",
      progress: 0,
      detail: error instanceof Error ? error.message : "Unknown error",
    });

    return { files: {}, success: false };
  }
}

/**
 * Full orchestration (plan + build without confirmation)
 * Use this for quick mode or when user has auto-approve enabled
 */
export async function orchestrateGeneration(
  context: GenerationContext,
  onStream: StreamCallback,
): Promise<{ files: Record<string, string>; success: boolean }> {
  try {
    // Plan
    const { spec, success: planSuccess } = await orchestratePlan(
      context,
      onStream,
    );

    if (!planSuccess || !spec) {
      return { files: {}, success: false };
    }

    // Skip confirmation, go straight to build
    onStream({
      phase: "building",
      message: "Building your app",
      icon: "🔨",
      progress: 30,
      detail: "Starting code generation...",
    });

    // Build
    return await orchestrateBuild(spec, context, onStream);
  } catch (error) {
    console.error("Orchestration error:", error);

    onStream({
      phase: "error",
      message: "Generation failed",
      icon: "❌",
      progress: 0,
      detail: error instanceof Error ? error.message : "Unknown error",
    });

    return { files: {}, success: false };
  }
}

/**
 * Quick generation without full orchestration (for simple requests)
 */
export async function quickGenerate(
  prompt: string,
  apiBaseUrl: string,
  platform: Platform = "IOS",
): Promise<Record<string, string>> {
  const workerPrompt = getWorkerPrompt(platform, apiBaseUrl);

  const userPrompt = `Build this app: ${prompt}

Requirements:
1. Beautiful modern UI with gradients
2. Start on the MAIN screen, NOT login
3. Use the proxy services from api.ts
4. Return complete working code as JSON`;

  const response = await callXAI(
    MODELS.worker,
    workerPrompt,
    userPrompt,
    32768,
  );
  const files = parseJSON<Record<string, string>>(response);

  // Ensure api.ts exists
  if (!files["src/services/api.ts"]) {
    files["src/services/api.ts"] = buildApiServiceCode(apiBaseUrl);
  }

  return ensureConfigFiles(files);
}
