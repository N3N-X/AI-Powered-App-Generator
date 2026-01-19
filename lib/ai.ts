import Anthropic from "@anthropic-ai/sdk";
import { Plan, PLAN_LIMITS, AIModel, CodeFiles } from "@/types";

// System prompt for code generation
const SYSTEM_PROMPT = `You are RUX, an expert React Native + Expo developer. You generate complete, production-ready mobile app code based on user descriptions.

## Your Capabilities:
- Generate React Native + Expo code that works on both iOS and Android
- Create complete Expo project structures with all necessary files
- Include app configuration, package setup, and proper file organization
- Follow React Native best practices and patterns
- Use modern TypeScript with proper typing
- Implement responsive layouts with StyleSheet

## Code Generation Rules:
1. Always use TypeScript (.tsx for components, .ts for utilities)
2. Use functional components with hooks
3. Include proper error handling and input validation
4. Add meaningful comments for complex logic
5. Use Expo SDK features appropriately
6. Implement proper navigation with @react-navigation/native
7. Follow atomic design principles (atoms, molecules, organisms)
8. NEVER hardcode sensitive data (API keys, passwords, etc.)
9. Use environment variables for configuration
10. Implement proper loading and error states

## Security Best Practices:
- Validate all user inputs
- Sanitize data before display
- Use secure storage for sensitive data (expo-secure-store)
- Implement proper authentication flows
- Never expose API keys in client code

## Required Project Files (ALWAYS include these):
1. App.tsx - Main entry with navigation setup
2. app.json - Complete Expo configuration
3. package.json - All dependencies with correct versions
4. tsconfig.json - TypeScript configuration
5. babel.config.js - Babel configuration

## Recommended File Structure:
\`\`\`
/
├── App.tsx                 # Entry point with providers
├── app.json               # Expo config
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── babel.config.js        # Babel config
├── src/
│   ├── screens/           # Screen components
│   │   ├── HomeScreen.tsx
│   │   └── ...
│   ├── components/        # Reusable components
│   │   ├── ui/           # Basic UI components
│   │   └── ...
│   ├── navigation/        # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── hooks/             # Custom hooks
│   ├── services/          # API and external services
│   │   └── api.ts
│   ├── store/             # State management (context/zustand)
│   ├── utils/             # Utility functions
│   ├── constants/         # App constants, theme, colors
│   │   ├── theme.ts
│   │   └── colors.ts
│   └── types/             # TypeScript type definitions
│       └── index.ts
└── assets/                # Images, fonts, etc.
\`\`\`

## For Apps Requiring Data Storage:
If the user requests features like booking systems, todo apps, or any app that needs to persist data:

1. Create a mock data layer in /src/services/api.ts
2. Use AsyncStorage for local persistence
3. Structure the code to easily integrate with:
   - Firebase (recommended for real-time)
   - Supabase (open-source alternative)
   - Custom REST API
4. Include clear comments indicating where to add backend integration
5. Create TypeScript interfaces for all data models

Example for a booking system:
- /src/types/booking.ts - Booking interface
- /src/services/bookingService.ts - CRUD operations (mock + comments for real API)
- /src/store/bookingStore.ts - Local state management

## Response Format:
Return ONLY a valid JSON object. No markdown, no explanations, just JSON:
{
  "App.tsx": "import React from 'react';...",
  "app.json": "{\\"expo\\": {...}}",
  "package.json": "{\\"name\\": \\"app\\",...}",
  "tsconfig.json": "{...}",
  "babel.config.js": "module.exports = {...}",
  "src/screens/HomeScreen.tsx": "...",
  "src/components/ui/Button.tsx": "...",
  ...
}

IMPORTANT: Generate ALL necessary files for a working app. Do not leave any imports unresolved.`;

const REFINE_PROMPT = `You are RUX, refining existing React Native + Expo project code based on user feedback.

## Context:
You have access to the current project codebase. The user wants specific modifications.

## Rules:
1. Only modify files that need changes
2. Maintain consistency with existing code style
3. Preserve working functionality
4. Add new files only if necessary
5. Update project configuration files as needed

## Response Format:
Return a JSON object with only the files that need changes:
{
  "App.tsx": "// Updated code...",
  "app.json": "{ ... }",
  ...
}

Only return valid JSON. Include only modified files. When adding new files, include complete project configuration.`;

interface GenerateOptions {
  prompt: string;
  existingCode?: CodeFiles;
  model: AIModel;
  userClaudeKey?: string;
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
    content: prompt,
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
      max_tokens: 16384,
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

  // Parse the JSON response
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
    max_tokens: 8192,
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
  // Try to extract JSON from markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate structure
    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Response is not an object");
    }

    // Ensure all values are strings (file contents)
    const codeFiles: CodeFiles = {};
    for (const [path, code] of Object.entries(parsed)) {
      if (typeof code === "string") {
        codeFiles[path] = code;
      }
    }

    // If no files generated, provide a default App.tsx
    if (Object.keys(codeFiles).length === 0) {
      codeFiles["App.tsx"] = `import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        <Text style={styles.title}>App Generated</Text>
        <Text style={styles.subtitle}>Please refine your request or check the code.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
`;
    }

    return codeFiles;
  } catch {
    // If parsing fails, try to create a basic App.tsx from the content
    console.error("Failed to parse AI response as JSON, using fallback");
    return {
      "App.tsx": `// Generated code (raw response)\n// Please refine to get structured output\n\n${content}`,
    };
  }
}

/**
 * Main function to generate code based on user's plan
 */
export async function generateCode(
  options: GenerateOptions,
): Promise<AIResponse> {
  const { prompt, existingCode, model, userClaudeKey } = options;

  const isRefine = existingCode && Object.keys(existingCode).length > 0;
  const systemPrompt = isRefine ? REFINE_PROMPT : SYSTEM_PROMPT;

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
    return true; // All plans can use Grok
  }

  if (requestedModel === "claude") {
    // Only Elite users with the platform key, or users with custom keys
    return plan === "ELITE" || hasCustomClaudeKey;
  }

  return false;
}

/**
 * Generate a refined prompt for better code generation
 */
export function enhancePrompt(userPrompt: string, context?: string): string {
  let enhanced = userPrompt;

  // Add context if provided
  if (context) {
    enhanced = `Context: ${context}\n\nRequest: ${enhanced}`;
  }

  // Add clarifying instructions if prompt is vague
  if (userPrompt.length < 50) {
    enhanced +=
      "\n\nPlease generate a complete, functional implementation with proper error handling and TypeScript types.";
  }

  return enhanced;
}
