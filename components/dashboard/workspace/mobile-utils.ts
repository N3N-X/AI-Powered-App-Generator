import { Snack, SnackFiles } from "snack-sdk";

export const SNACK_SDK_VERSION = "54.0.0";
export type PreviewMode = "web" | "device";
export type PreviewPhase = "idle" | "generating" | "verifying" | "ready";
export type MobileSimpleTab = "chat" | "preview" | "code";

// Built-in modules that don't need to be added as Snack dependencies
const BUILTIN_MODULES = new Set([
  "react",
  "react-native",
  "react-native-web",
  "expo",
]);

// Extract third-party package names from import/require statements in code files
export function extractDependencies(
  codeFiles: Record<string, string>,
): Record<string, { version: string }> {
  const deps: Record<string, { version: string }> = {};
  const importRegex =
    /(?:import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"./][^'"]*?)['"]|require\s*\(\s*['"]([^'"./][^'"]*?)['"]\s*\))/g;

  for (const content of Object.values(codeFiles)) {
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const raw = match[1] || match[2];
      const pkg = raw.startsWith("@")
        ? raw.split("/").slice(0, 2).join("/")
        : raw.split("/")[0];
      if (!BUILTIN_MODULES.has(pkg)) {
        deps[pkg] = { version: "*" };
      }
    }
  }
  return deps;
}

// Convert project code files to Snack files format
export function convertToSnackFiles(
  codeFiles: Record<string, string>,
): SnackFiles {
  const snackFiles: SnackFiles = {};
  Object.entries(codeFiles).forEach(([path, content]) => {
    snackFiles[path] = {
      type: "CODE",
      contents: content,
    };
  });
  return snackFiles;
}

// Get prompts based on state
export function getPrompts(
  hasGeneratedCode: boolean,
  platform?: string,
): string[] {
  if (hasGeneratedCode) {
    if (platform === "IOS") {
      return [
        "Add a settings screen with toggles",
        "Add pull-to-refresh to the list",
        "Add haptic feedback on buttons",
        "Create a profile screen with avatar",
      ];
    } else {
      return [
        "Add a floating action button",
        "Create a drawer navigation menu",
        "Add swipe-to-delete on list items",
        "Add Material Design animations",
      ];
    }
  } else {
    if (platform === "IOS") {
      return [
        "A workout tracker that logs exercises, sets, and reps with progress charts",
        "A recipe app where I can save favorites and create shopping lists",
        "A habit tracker with daily streaks and reminder notifications",
        "A notes app with folders, tags, and search functionality",
      ];
    } else {
      return [
        "A budget tracker that categorizes expenses and shows monthly spending",
        "A todo app with projects, due dates, and priority levels",
        "A weather app showing forecasts with location-based alerts",
        "A meditation app with guided sessions and progress tracking",
      ];
    }
  }
}
