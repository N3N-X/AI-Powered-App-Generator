import Anthropic from "@anthropic-ai/sdk";
import { Plan, PLAN_LIMITS, AIModel, CodeFiles } from "@/types";

/**
 * Build system prompt with dynamic API base URL
 */
function buildSystemPrompt(apiBaseUrl: string): string {
  return `You are a React Native code generator. Generate beautiful, functional Expo apps.

MANDATORY REQUIREMENTS - VIOLATIONS WILL CAUSE APP TO CRASH:
1. API_BASE must be "${apiBaseUrl}" - NOT relative URLs, NOT localhost
2. Use fetch() - NOT axios
3. Use @react-navigation/native-stack - NOT @react-navigation/stack
4. NO LOGIN SCREENS unless user says "login" or "authentication"

src/services/api.ts (COPY EXACTLY):
\`\`\`typescript
const API_BASE = '${apiBaseUrl}';
const API_KEY = 'USER_API_KEY';

export const db = {
  create: async (collection: string, data: any) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-RUX-API-Key': API_KEY },
      body: JSON.stringify({ collection, operation: 'create', data })
    });
    return res.json();
  },
  getAll: async (collection: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-RUX-API-Key': API_KEY },
      body: JSON.stringify({ collection, operation: 'findMany' })
    });
    const result = await res.json();
    return result.data || [];
  },
  update: async (collection: string, id: string, data: any) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-RUX-API-Key': API_KEY },
      body: JSON.stringify({ collection, operation: 'update', filter: { id }, data })
    });
    return res.json();
  },
  delete: async (collection: string, id: string) => {
    const res = await fetch(\`\${API_BASE}/api/proxy/db\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-RUX-API-Key': API_KEY },
      body: JSON.stringify({ collection, operation: 'delete', filter: { id } })
    });
    return res.json();
  }
};
\`\`\`

DESIGN: Modern, clean UI with shadows, rounded corners. Use vibrant colors.
For gradients use: <View style={{backgroundColor: '#6366f1'}}> or multiple layered views - NOT LinearGradient.

ALLOWED PACKAGES (DO NOT import anything else - app will crash):
- react, react-native (View, Text, TouchableOpacity, ScrollView, FlatList, TextInput, StyleSheet, etc.)
- @react-navigation/native, @react-navigation/native-stack
- react-native-screens, react-native-safe-area-context
- expo-status-bar

DO NOT USE: expo-linear-gradient, axios, or any package not listed above.

OUTPUT: Valid JSON only. No markdown. No explanation.
{"App.tsx": "code", "src/services/api.ts": "code", "src/screens/HomeScreen.tsx": "code"}`;
}

const REFINE_PROMPT = `You are RUX, refining existing React Native + Expo project code based on user feedback.

## Context:
You have access to the current project codebase. The user wants specific modifications.

## Platform Design Guidelines:
- iOS: Apple Liquid Glass design with glassmorphism, blur effects, subtle shadows
- Android: Material Design 3 with elevation, ripple effects, dynamic colors

## Rules:
1. Only modify files that need changes
2. Maintain consistency with existing code style
3. Preserve working functionality
4. Add new files only if necessary
5. Update imports when adding new dependencies
6. Keep platform-specific styling intact
7. All API calls must use /api/proxy endpoint

## Error Fixing:
If the user mentions an error:
1. Analyze the error message carefully
2. Identify the root cause
3. Fix the specific issue
4. Ensure fix doesn't break other parts
5. Add error handling if missing

## Response Format:
Return a JSON object with only the files that need changes:
{
  "App.tsx": "// Updated code...",
  "src/screens/HomeScreen.tsx": "// Fixed code...",
  ...
}

Only return valid JSON. Include only modified files.`;

// Error detection and fix prompt
const ERROR_FIX_PROMPT = `You are RUX, fixing errors in React Native + Expo code.

## Error Context:
The following error occurred in the preview:
{ERROR_MESSAGE}

## Current Code:
{CURRENT_CODE}

## Instructions:
1. Analyze the error message
2. Identify the exact cause
3. Provide a minimal fix
4. Ensure the fix follows best practices
5. Don't change unrelated code

Return ONLY the fixed files as a JSON object.`;

type Platform = "WEB" | "IOS" | "ANDROID";

interface GenerateOptions {
  prompt: string;
  existingCode?: CodeFiles;
  model: AIModel;
  userClaudeKey?: string;
  platform?: Platform;
  apiBaseUrl?: string;
}

interface AIResponse {
  codeFiles: CodeFiles;
  tokensUsed: number;
  model: AIModel;
}

/**
 * Generate code using xAI Grok
 */
async function generateWithGrok(
  prompt: string,
  systemPrompt: string,
  existingCode?: CodeFiles,
): Promise<AIResponse> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error("XAI_API_KEY is not configured");
  }

  const messages: { role: "user" | "assistant"; content: string }[] = [];

  if (existingCode && Object.keys(existingCode).length > 0) {
    messages.push({
      role: "user",
      content: `Current codebase:\n${JSON.stringify(existingCode, null, 2)}`,
    });
  }

  messages.push({
    role: "user",
    content: `Build: ${prompt}

Remember:
- Start on the MAIN screen (not login)
- Use the db object from api.ts for data: db.create(), db.getAll(), db.update(), db.delete()
- Beautiful modern UI with gradients and shadows
- Return ONLY JSON, no markdown`,
  });

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-code-fast-1",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 32768,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`xAI API error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content in xAI response");
  }

  const codeFiles = parseCodeResponse(content);

  return {
    codeFiles,
    tokensUsed: data.usage?.total_tokens || 0,
    model: "grok",
  };
}

/**
 * Generate code using Anthropic Claude
 */
async function generateWithClaude(
  prompt: string,
  systemPrompt: string,
  existingCode?: CodeFiles,
  userApiKey?: string,
): Promise<AIResponse> {
  const apiKey = userApiKey || process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error("Claude API key is not configured");
  }

  const client = new Anthropic({ apiKey });

  const messages: Anthropic.MessageParam[] = [];

  if (existingCode && Object.keys(existingCode).length > 0) {
    messages.push({
      role: "user",
      content: `Current codebase:\n\`\`\`json\n${JSON.stringify(existingCode, null, 2)}\n\`\`\``,
    });
    messages.push({
      role: "assistant",
      content:
        "I understand the current codebase. What changes would you like me to make?",
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 16384,
    system: systemPrompt,
    messages,
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  const codeFiles = parseCodeResponse(content.text);

  return {
    codeFiles,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    model: "claude",
  };
}

/**
 * Parse code response from AI (handles both clean JSON and markdown-wrapped JSON)
 */
function parseCodeResponse(content: string): CodeFiles {
  // Try multiple strategies to extract JSON

  // Strategy 1: Try to extract JSON from markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  let jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();

  // Strategy 2: If no code block, try to find JSON object directly
  if (!jsonMatch) {
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonStr = objectMatch[0];
    }
  }

  try {
    const parsed = JSON.parse(jsonStr);

    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Response is not an object");
    }

    const codeFiles: CodeFiles = {};
    for (const [path, code] of Object.entries(parsed)) {
      if (typeof code === "string") {
        codeFiles[path] = code;
      }
    }

    const fileCount = Object.keys(codeFiles).length;

    if (fileCount === 0) {
      return getDefaultCodeFiles(
        "No code files were generated. Please try again with a more specific request.",
      );
    }

    // Only add config files if missing, never override AI-generated code
    return ensureConfigFiles(codeFiles);
  } catch (error) {
    // Strategy 3: Try to extract code if it looks like React Native code
    if (content.includes("import") && content.includes("from 'react")) {
      const cleanedCode = content
        .replace(/```(?:tsx?|jsx?|javascript|typescript)?\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      if (
        cleanedCode.includes("export default") ||
        cleanedCode.includes("export function App")
      ) {
        return ensureConfigFiles({
          "App.tsx": cleanedCode,
        });
      }
    }

    console.error("Failed to parse AI response as JSON:", error);
    return getDefaultCodeFiles(
      "Failed to parse AI response. Please try rephrasing your request.",
    );
  }
}

/**
 * Only add essential config files if missing - never override AI-generated code
 */
function ensureConfigFiles(codeFiles: CodeFiles): CodeFiles {
  const result = { ...codeFiles };

  // Only add package.json if missing
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
        dependencies: {
          expo: "~52.0.0",
          "expo-blur": "~14.0.1",
          "expo-haptics": "~14.0.0",
          "expo-status-bar": "~2.0.0",
          react: "18.3.1",
          "react-native": "0.76.5",
          "@react-navigation/native": "^7.0.0",
          "@react-navigation/native-stack": "^7.0.0",
          "react-native-safe-area-context": "4.12.0",
          "react-native-screens": "~4.4.0",
        },
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

  // Only add app.json if missing
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

  // Only add tsconfig.json if missing
  if (!result["tsconfig.json"]) {
    result["tsconfig.json"] = JSON.stringify(
      { extends: "expo/tsconfig.base", compilerOptions: { strict: true } },
      null,
      2,
    );
  }

  // Only add babel.config.js if missing
  if (!result["babel.config.js"]) {
    result["babel.config.js"] = `module.exports = function(api) {
  api.cache(true);
  return { presets: ['babel-preset-expo'] };
};`;
  }

  return result;
}

/**
 * Get default code files with an error/empty state message
 */
function getDefaultCodeFiles(message: string): CodeFiles {
  return ensureConfigFiles({
    "App.tsx": `import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⚠️</Text>
        </View>
        <Text style={styles.title}>Generation Issue</Text>
        <Text style={styles.subtitle}>${message.replace(/'/g, "\\'")}</Text>
        <Text style={styles.hint}>Try describing your app idea more clearly.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: Platform.select({ ios: '700', android: 'bold' }),
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  hint: {
    fontSize: 14,
    color: '#8B5CF6',
    textAlign: 'center',
  },
});
`,
  });
}

/**
 * Get platform-specific prompt additions
 */
function getPlatformPrompt(platform?: Platform, apiBaseUrl?: string): string {
  const baseUrl = apiBaseUrl || "https://rux.sh";

  switch (platform) {
    case "IOS":
      return `

## TARGET PLATFORM: iOS (React Native + Expo)
- Use @react-navigation/native-stack for navigation
- Apple Liquid Glass design with expo-blur for glassmorphism
- Haptic feedback with expo-haptics
- SF Pro font (system default)
- Safe areas and notch support
- Large rounded corners (16-20px)`;

    case "ANDROID":
      return `

## TARGET PLATFORM: Android (React Native + Expo)
- Use @react-navigation/native-stack for navigation
- Material Design 3 / Material You
- Ripple effects with android_ripple prop
- Roboto font (system default)
- Elevation shadows
- Rounded corners (12-16px)`;

    case "WEB":
      return `

## TARGET PLATFORM: Web Browser (Pure React - NOT React Native!)

⚠️ CRITICAL WEB RULES:
- DO NOT import from 'react-native' - use HTML elements instead
- DO NOT use @react-navigation - use react-router-dom or simple state for navigation
- DO NOT use StyleSheet.create - use inline styles or CSS
- Use: <div>, <button>, <input>, <form>, <h1>, <p>, <span>, etc.

## WEB API - Use absolute URL: ${baseUrl}
\`\`\`typescript
const API_BASE = '${baseUrl}';
const API_KEY = 'USER_API_KEY';
// All proxy endpoints same as mobile - see main system prompt
\`\`\`

## WEB STYLING:
\`\`\`typescript
// Use inline styles
<div style={{
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  fontFamily: 'system-ui, sans-serif',
  padding: '20px'
}}>
\`\`\`

## WEB OUTPUT FORMAT:
Return JSON with these files:
{
  "App.tsx": "// Pure React code with HTML elements",
  "src/services/api.ts": "// API calls using API_BASE"
}`;

    default:
      return `

## TARGET PLATFORM: Web Browser
Use pure React with HTML elements. No React Native imports.
CSS inline styles. API_BASE = '${baseUrl}' for all proxy calls.`;
  }
}

/**
 * Main function to generate code based on user's plan
 */
export async function generateCode(
  options: GenerateOptions,
): Promise<AIResponse> {
  const { prompt, existingCode, model, userClaudeKey, platform, apiBaseUrl } =
    options;

  // Default to production URL if not provided
  const baseUrl = apiBaseUrl || "https://rux.sh";

  const isRefine = existingCode && Object.keys(existingCode).length > 0;
  const basePrompt = isRefine ? REFINE_PROMPT : buildSystemPrompt(baseUrl);
  const platformPrompt = getPlatformPrompt(platform, baseUrl);
  const systemPrompt = basePrompt + platformPrompt;

  if (model === "claude") {
    return generateWithClaude(
      prompt,
      systemPrompt,
      existingCode,
      userClaudeKey,
    );
  }

  return generateWithGrok(prompt, systemPrompt, existingCode);
}

/**
 * Fix errors in code
 */
export async function fixCodeError(
  errorMessage: string,
  codeFiles: CodeFiles,
  model: AIModel = "grok",
  userClaudeKey?: string,
): Promise<AIResponse> {
  const fixPrompt = ERROR_FIX_PROMPT.replace(
    "{ERROR_MESSAGE}",
    errorMessage,
  ).replace("{CURRENT_CODE}", JSON.stringify(codeFiles, null, 2));

  if (model === "claude") {
    return generateWithClaude(
      fixPrompt,
      REFINE_PROMPT,
      codeFiles,
      userClaudeKey,
    );
  }

  return generateWithGrok(fixPrompt, REFINE_PROMPT, codeFiles);
}

/**
 * Get the appropriate AI model for a user's plan
 */
export function getModelForPlan(
  plan: Plan,
  hasCustomClaudeKey: boolean,
): AIModel {
  if (plan === "ELITE") {
    return hasCustomClaudeKey ? "claude" : PLAN_LIMITS.ELITE.defaultModel;
  }
  return PLAN_LIMITS[plan].defaultModel;
}

/**
 * Validate that user can use the requested model
 */
export function canUseModel(
  plan: Plan,
  requestedModel: AIModel,
  hasCustomClaudeKey: boolean,
): boolean {
  if (requestedModel === "grok") {
    return true;
  }

  if (requestedModel === "claude") {
    return plan === "ELITE" || hasCustomClaudeKey;
  }

  return false;
}

/**
 * Generate a refined prompt for better code generation
 */
export function enhancePrompt(userPrompt: string, context?: string): string {
  let enhanced = userPrompt;

  if (context) {
    enhanced = `Context: ${context}\n\nRequest: ${enhanced}`;
  }

  if (userPrompt.length < 50) {
    enhanced +=
      "\n\nPlease generate a complete, functional implementation with proper error handling, TypeScript types, and platform-specific styling for iOS (Liquid Glass) and Android (Material Design).";
  }

  return enhanced;
}
