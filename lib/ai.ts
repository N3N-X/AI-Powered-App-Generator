import Anthropic from "@anthropic-ai/sdk";
import { Plan, PLAN_LIMITS, AIModel, CodeFiles } from "@/types";

// System prompt for code generation with platform-specific design guidelines
const SYSTEM_PROMPT = `You are RUX, an expert React Native + Expo developer. You generate complete, production-ready mobile app code based on user descriptions.

## Platform-Specific Design Guidelines:

### iOS - Apple Liquid Glass Design (iOS 18+):
- Use SF Pro font family (system default)
- Implement glassmorphism effects with blur and transparency
- Use subtle shadows and depth
- Follow Apple's Human Interface Guidelines
- Use iOS-specific components where appropriate
- Implement haptic feedback for interactions
- Use system colors that adapt to light/dark mode
- Rounded corners with large radius (12-20px)
- Subtle gradients and glass-like surfaces
- Respect safe areas and notch

### Android - Material Design 3 / Material You:
- Use Roboto font family (system default)
- Implement Material You dynamic color theming
- Use elevation and shadows for depth
- Follow Material Design guidelines
- Use Android-specific patterns (FAB, Bottom sheets, etc.)
- Implement ripple effects for touch feedback
- Use Material color schemes
- Rounded corners (12-16px)
- Support edge-to-edge display

## Your Capabilities:
- Generate React Native + Expo code that works on both iOS and Android
- Create complete Expo project structures with all necessary files
- Include app configuration, package setup, and proper file organization
- Follow React Native best practices and patterns
- Use modern TypeScript with proper typing
- Implement responsive layouts with StyleSheet
- Use Platform.OS to apply platform-specific styles

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
11. Use Platform.select() for platform-specific code
12. Implement proper keyboard handling

## API and Data Handling - CRITICAL:
⚠️ NEVER use external APIs directly! Always use RUX proxy endpoints.

### Available RUX Proxy Services:
RUX provides managed API access through proxy endpoints. Users don't need their own API keys.

**AI & Chat:**
- \`/api/proxy/xai\` - xAI Grok (PRIMARY/DEFAULT AI - 8 credits per 1K tokens)
- \`/api/proxy/openai\` - OpenAI GPT-4, GPT-4o (10 credits per 1K tokens)

**Image Generation:**
- \`/api/proxy/images/generate\` - DALL-E 3 / Stable Diffusion (50 credits per image)

**Search & Maps:**
- \`/api/proxy/search\` - Google Search (5 credits per search)
- \`/api/proxy/maps\` - Geocoding, Places, Directions (3 credits per request)

**Communication:**
- \`/api/proxy/email\` - Send emails (2 credits per email)
- \`/api/proxy/sms\` - Send SMS (5 credits per SMS)

**Data & Utilities:**
- \`/api/proxy/weather\` - Weather data (2 credits per request)
- \`/api/proxy/qr\` - Generate QR codes (1 credit)
- \`/api/proxy/translate\` - Translation (3 credits)
- \`/api/proxy/currency\` - Exchange rates (1 credit)
- \`/api/proxy/storage\` - File storage (5 credits per MB)

**Content:**
- \`/api/proxy/news\` - News articles (3 credits)
- \`/api/proxy/stocks\` - Stock data (2 credits)
- \`/api/proxy/crypto\` - Crypto prices (2 credits)
- \`/api/proxy/movies\` - Movie/TV data (2 credits)

**Media Processing:**
- \`/api/proxy/audio/transcribe\` - Audio transcription (15 credits per minute)
- \`/api/proxy/audio/tts\` - Text-to-speech (10 credits)

### Proxy Usage Pattern (MANDATORY):
\`\`\`typescript
// CORRECT - Using xAI (default AI)
const response = await fetch('/api/proxy/xai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-RUX-API-Key': apiKey  // Required authentication
  },
  body: JSON.stringify({
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: userInput }
    ],
    model: 'grok-3-fast-beta',
    temperature: 0.7
  })
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error || 'API request failed');
}

const data = await response.json();
console.log('Credits used:', data.creditsUsed);
console.log('Credits remaining:', data.creditsRemaining);

// WRONG - NEVER do this:
// fetch('https://api.openai.com/v1/...') ❌
// fetch('https://api.x.ai/v1/...') ❌
\`\`\`

### Example: Weather App
\`\`\`typescript
async function getWeather(city: string, apiKey: string) {
  try {
    const response = await fetch('/api/proxy/weather', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RUX-API-Key': apiKey
      },
      body: JSON.stringify({
        city,
        units: 'metric'
      })
    });

    if (!response.ok) {
      throw new Error('Weather fetch failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
\`\`\`

### Error Handling:
- Always wrap proxy calls in try-catch
- Check response.ok before parsing JSON
- Display user-friendly error messages
- Show credit costs to users
- Handle 402 (insufficient credits) gracefully
- Handle 429 (rate limited) with retry logic
- Implement loading states during API calls

## Security Best Practices:
- Validate all user inputs
- Sanitize data before display
- Use secure storage for sensitive data (expo-secure-store)
- Implement proper authentication flows
- Never expose API keys in client code
- Use HTTPS for all network requests

## Required Project Files (ALWAYS include these):
1. App.tsx - Main entry with navigation setup and providers
2. app.json - Complete Expo configuration with iOS/Android specific settings
3. package.json - All dependencies with correct versions
4. tsconfig.json - TypeScript configuration
5. babel.config.js - Babel configuration
6. src/constants/theme.ts - Theme configuration with platform-specific styles
7. src/constants/colors.ts - Color palette for both platforms

## Mandatory File Structure:
\`\`\`
/
├── App.tsx                    # Entry point with providers
├── app.json                   # Expo config
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config
├── babel.config.js            # Babel config
├── src/
│   ├── screens/               # Screen components
│   │   ├── HomeScreen.tsx
│   │   └── ...
│   ├── components/            # Reusable components
│   │   ├── ui/               # Basic UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── GlassView.tsx  # Glassmorphism component
│   │   └── ...
│   ├── navigation/            # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── hooks/                 # Custom hooks
│   │   └── useTheme.ts
│   ├── services/              # API and external services
│   │   └── api.ts            # API service using proxy
│   ├── store/                 # State management
│   ├── utils/                 # Utility functions
│   │   └── platform.ts       # Platform-specific utilities
│   ├── constants/             # App constants
│   │   ├── theme.ts          # Theme with platform styles
│   │   └── colors.ts         # Color palette
│   └── types/                 # TypeScript definitions
│       └── index.ts
└── assets/                    # Images, fonts, etc.
\`\`\`

## UI Component Examples:

### Glass Card Component (iOS Liquid Glass):
\`\`\`typescript
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

export function GlassCard({ children }) {
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={80} tint="light" style={styles.glass}>
        {children}
      </BlurView>
    );
  }
  // Android fallback with semi-transparent background
  return (
    <View style={[styles.glass, styles.androidGlass]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  androidGlass: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    elevation: 4,
  },
});
\`\`\`

### Material Button (Android):
\`\`\`typescript
import { Pressable, Text, StyleSheet, Platform } from 'react-native';

export function MaterialButton({ title, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}
\`\`\`

## Response Format - MANDATORY:
You MUST return a valid JSON object with MULTIPLE files. Minimum 10 files required.

MANDATORY FILES (must include ALL of these):
1. "App.tsx" - Main app entry point with providers
2. "package.json" - All dependencies
3. "app.json" - Expo configuration
4. "tsconfig.json" - TypeScript config
5. "babel.config.js" - Babel configuration
6. "src/constants/theme.ts" - Theme configuration
7. "src/constants/colors.ts" - Color palette
8. "src/components/ui/GlassView.tsx" - Glassmorphism component
9. At least 2 screen components
10. Navigation setup

## CRITICAL REQUIREMENTS:
⚠️ MINIMUM 10 FILES REQUIRED - Responses with less than 10 files will be REJECTED
⚠️ NEVER return just "App.tsx" alone
⚠️ Create a PROPER file structure with src/ directory
⚠️ Split code into logical, reusable components
⚠️ All imports MUST have corresponding files
⚠️ Include platform-specific styling
⚠️ Return ONLY valid JSON - no markdown, no explanations

Return ONLY the JSON object with file paths as keys and file contents as values.`;

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
      model: "grok-3-fast-beta",
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

    // Ensure minimum file structure
    if (fileCount < 5) {
      console.warn(
        `AI only generated ${fileCount} file(s). Adding required structure.`,
      );
      return ensureMinimumStructure(codeFiles);
    }

    return codeFiles;
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
        return ensureMinimumStructure({
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
 * Ensure minimum file structure is present
 */
function ensureMinimumStructure(codeFiles: CodeFiles): CodeFiles {
  const result = { ...codeFiles };

  // Add package.json if missing
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

  // Add app.json if missing
  if (!result["app.json"]) {
    result["app.json"] = JSON.stringify(
      {
        expo: {
          name: "RUX App",
          slug: "rux-app",
          version: "1.0.0",
          orientation: "portrait",
          icon: "./assets/icon.png",
          userInterfaceStyle: "automatic",
          splash: {
            image: "./assets/splash.png",
            resizeMode: "contain",
            backgroundColor: "#1a1a2e",
          },
          assetBundlePatterns: ["**/*"],
          ios: {
            supportsTablet: true,
            bundleIdentifier: "com.rux.app",
          },
          android: {
            adaptiveIcon: {
              foregroundImage: "./assets/adaptive-icon.png",
              backgroundColor: "#1a1a2e",
            },
            package: "com.rux.app",
          },
          web: {
            favicon: "./assets/favicon.png",
          },
        },
      },
      null,
      2,
    );
  }

  // Add tsconfig.json if missing
  if (!result["tsconfig.json"]) {
    result["tsconfig.json"] = JSON.stringify(
      {
        extends: "expo/tsconfig.base",
        compilerOptions: {
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          baseUrl: ".",
          paths: {
            "@/*": ["src/*"],
          },
        },
      },
      null,
      2,
    );
  }

  // Add babel.config.js if missing
  if (!result["babel.config.js"]) {
    result["babel.config.js"] = `module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};`;
  }

  // Add theme.ts if missing
  if (!result["src/constants/theme.ts"]) {
    result["src/constants/theme.ts"] =
      `import { Platform, StyleSheet } from 'react-native';

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const SHADOWS = Platform.select({
  ios: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
  },
  android: {
    small: { elevation: 2 },
    medium: { elevation: 4 },
  },
});

export const FONTS = Platform.select({
  ios: {
    regular: { fontFamily: 'System', fontWeight: '400' as const },
    medium: { fontFamily: 'System', fontWeight: '500' as const },
    semibold: { fontFamily: 'System', fontWeight: '600' as const },
    bold: { fontFamily: 'System', fontWeight: '700' as const },
  },
  android: {
    regular: { fontFamily: 'Roboto', fontWeight: '400' as const },
    medium: { fontFamily: 'Roboto', fontWeight: '500' as const },
    semibold: { fontFamily: 'Roboto', fontWeight: '600' as const },
    bold: { fontFamily: 'Roboto', fontWeight: '700' as const },
  },
});
`;
  }

  // Add colors.ts if missing
  if (!result["src/constants/colors.ts"]) {
    result["src/constants/colors.ts"] = `export const COLORS = {
  // Primary
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',

  // Secondary
  secondary: '#6366F1',
  secondaryLight: '#818CF8',
  secondaryDark: '#4F46E5',

  // Neutral
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Background
  background: {
    light: '#FFFFFF',
    dark: '#0A0A0F',
  },

  // Glass effect colors
  glass: {
    light: 'rgba(255, 255, 255, 0.8)',
    dark: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.2)',
  },
};

export const DARK_COLORS = {
  ...COLORS,
  background: COLORS.background.dark,
  text: COLORS.white,
  textSecondary: COLORS.gray[400],
};

export const LIGHT_COLORS = {
  ...COLORS,
  background: COLORS.background.light,
  text: COLORS.gray[900],
  textSecondary: COLORS.gray[600],
};
`;
  }

  // Add GlassView component if missing
  if (!result["src/components/ui/GlassView.tsx"]) {
    result["src/components/ui/GlassView.tsx"] = `import React from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../../constants/colors';
import { BORDER_RADIUS, SHADOWS } from '../../constants/theme';

interface GlassViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export function GlassView({
  children,
  style,
  intensity = 80,
  tint = 'light'
}: GlassViewProps) {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[styles.glass, style]}
      >
        {children}
      </BlurView>
    );
  }

  // Android fallback
  return (
    <View style={[styles.glass, styles.androidGlass, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glass.border,
  },
  androidGlass: {
    backgroundColor: COLORS.glass.light,
    ...SHADOWS.medium,
  },
});
`;
  }

  return result;
}

/**
 * Get default code files with an error/empty state message
 */
function getDefaultCodeFiles(message: string): CodeFiles {
  return ensureMinimumStructure({
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
function getPlatformPrompt(platform?: Platform): string {
  switch (platform) {
    case "IOS":
      return `

## TARGET PLATFORM: iOS
You are generating code specifically for iOS. Focus on:
- Apple Liquid Glass design (iOS 18+) with glassmorphism, blur effects, subtle shadows
- SF Pro font family (system default)
- iOS-specific components and patterns
- Haptic feedback for interactions
- System colors that adapt to light/dark mode
- Respect safe areas and notch
- Use BlurView from expo-blur for glass effects
- Large rounded corners (16-20px)
- The app will primarily run on iPhone/iPad via Expo Go`;

    case "ANDROID":
      return `

## TARGET PLATFORM: Android
You are generating code specifically for Android. Focus on:
- Material Design 3 / Material You guidelines
- Roboto font family (system default)
- Android-specific patterns (FAB, Bottom sheets, etc.)
- Ripple effects for touch feedback using android_ripple
- Elevation and shadows for depth
- Material color schemes
- Support edge-to-edge display
- Rounded corners (12-16px)
- The app will primarily run on Android devices via Expo Go`;

    case "WEB":
      return `

## TARGET PLATFORM: Web Browser
⚠️ CRITICAL: You are generating a WEB application, NOT a mobile app!

IGNORE ALL React Native instructions above. Generate PURE REACT code for web browsers.

## MANDATORY WEB-ONLY RULES:
1. DO NOT use @react-navigation/native - it's for mobile only!
2. DO NOT use react-native imports - they won't work on web!
3. DO NOT use expo-blur, expo-haptics, or other Expo packages!
4. DO NOT use StyleSheet.create() - use CSS or inline styles!
5. DO NOT use SafeAreaView, View, Text from react-native!

## USE THESE WEB TECHNOLOGIES INSTEAD:
- Standard React with hooks (useState, useEffect, etc.)
- HTML elements: <div>, <span>, <button>, <input>, <form>, <h1>-<h6>, <p>, <a>, <img>, <nav>, <header>, <footer>, <section>, <main>
- CSS for styling (inline styles with style={{}} or CSS-in-JS)
- react-router-dom for navigation (if needed, but prefer single-page for simplicity)

## WEB CODE STRUCTURE:
Return ONLY an "App.tsx" file with a complete React web component.

## EXAMPLE WEB CODE PATTERN:
\`\`\`tsx
import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <header style={{ padding: '20px', color: 'white' }}>
        <h1>My Web App</h1>
      </header>
      <main style={{ padding: '20px' }}>
        <button onClick={() => setCount(c => c + 1)}>
          Count: {count}
        </button>
      </main>
    </div>
  );
}
\`\`\`

## WEB STYLING BEST PRACTICES:
- Use CSS Flexbox and Grid for layouts
- Use CSS transitions and animations for interactivity
- Use media queries for responsive design (or use viewport units like vh, vw)
- Use modern CSS features: backdrop-filter for glass effects, box-shadow for depth
- Use CSS variables for theming
- Use gradients, shadows, and border-radius for modern look

## GLASSMORPHISM FOR WEB:
\`\`\`css
{
  background: rgba(255, 255, 255, 0.1),
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '16px',
}
\`\`\`

## RESPONSE FORMAT FOR WEB:
Return a JSON object with "App.tsx" containing complete web React code:
{
  "App.tsx": "import React from 'react';\\n\\nexport default function App() {\\n  return (\\n    <div>...</div>\\n  );\\n}"
}

DO NOT include package.json, app.json, or any React Native files.
Return ONLY valid JSON with web-compatible React code.`;

    default:
      return `

## TARGET PLATFORM: Web
You are generating code for web deployment. Focus on:
- Responsive design that works on desktop and mobile browsers
- Use standard React with HTML elements (div, span, button, etc.)
- Web-friendly navigation patterns
- Mouse and keyboard interactions
- Hover states for interactive elements
- CSS for styling (inline styles or CSS-in-JS)
- The app will run in web browsers`;
  }
}

/**
 * Main function to generate code based on user's plan
 */
export async function generateCode(
  options: GenerateOptions,
): Promise<AIResponse> {
  const { prompt, existingCode, model, userClaudeKey, platform } = options;

  const isRefine = existingCode && Object.keys(existingCode).length > 0;
  const basePrompt = isRefine ? REFINE_PROMPT : SYSTEM_PROMPT;
  const platformPrompt = getPlatformPrompt(platform);
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
