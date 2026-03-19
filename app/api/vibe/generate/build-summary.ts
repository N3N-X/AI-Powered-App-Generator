/**
 * Dynamic summary builder for code generation completion.
 * Analyzes generated code to produce meaningful, context-aware summaries.
 */

import type { CodeFiles } from "@/types";

interface AnalysisResult {
  screens: string[];
  components: string[];
  features: Set<string>;
  services: Set<string>;
  collections: Set<string>;
}

/**
 * Build a conversational, detailed summary of what was generated/modified.
 * Dynamically analyzes code to detect features, services, and patterns.
 */
export function buildCompletionSummary(
  files: CodeFiles,
  createdFileCount: number,
  changedFileCount: number,
  _projectName: string,
): string {
  const analysis = analyzeGeneratedCode(files);
  return formatSummary(analysis, createdFileCount, changedFileCount);
}

/**
 * Analyze generated code to extract screens, components, features, services.
 */
function analyzeGeneratedCode(files: CodeFiles): AnalysisResult {
  const screens: string[] = [];
  const components: string[] = [];
  const features: Set<string> = new Set();
  const services: Set<string> = new Set();
  const collections: Set<string> = new Set();

  const fileList = Object.keys(files).filter(
    (f) => !f.endsWith(".json") && f !== "AGENTS.md",
  );

  for (const file of fileList) {
    const name = file.split("/").pop() || file;
    const cleanName = name.replace(/\.(tsx?|jsx?)$/, "");
    const lower = file.toLowerCase();
    const content = files[file] || "";

    // Identify screens/pages
    if (lower.includes("screen") || lower.includes("page")) {
      screens.push(formatComponentName(cleanName));
    } else if (lower.includes("/components/")) {
      components.push(formatComponentName(cleanName));
    }

    // Detect features from code patterns
    detectFeatures(content, features);

    // Detect services used
    detectServices(content, services);

    // Detect database collections
    detectCollections(content, collections);
  }

  return { screens, components, features, services, collections };
}

/**
 * Detect features from code patterns.
 */
function detectFeatures(content: string, features: Set<string>): void {
  // State management
  if (content.includes("useState") || content.includes("useReducer")) {
    features.add("Interactive state management");
  }

  // Navigation
  if (
    content.includes("navigation") ||
    content.includes("useRouter") ||
    content.includes("navigate(")
  ) {
    features.add("Screen navigation");
  }

  // Forms and validation
  if (
    content.includes("TextInput") ||
    content.includes("<input") ||
    content.includes("<form")
  ) {
    features.add("User input forms");
  }
  if (
    content.includes("setErrors") ||
    content.includes("validation") ||
    content.includes("isValid")
  ) {
    features.add("Form validation");
  }

  // Lists and data display
  if (
    content.includes("FlatList") ||
    content.includes("ScrollView") ||
    content.includes(".map(")
  ) {
    features.add("Dynamic content lists");
  }

  // Modals and dialogs
  if (content.includes("Modal") || content.includes("Alert.alert")) {
    features.add("Modals and dialogs");
  }

  // Loading states
  if (content.includes("isLoading") || content.includes("loading")) {
    features.add("Loading states");
  }

  // Search/filter
  if (
    content.includes("search") ||
    content.includes("filter") ||
    content.includes("Search")
  ) {
    features.add("Search and filtering");
  }

  // Image handling
  if (
    content.includes("ai.generateImage") ||
    content.includes("storage.getUploadUrl")
  ) {
    features.add("Image management");
  }

  // Booking/scheduling
  if (
    content.includes("booking") ||
    content.includes("appointment") ||
    content.includes("schedule")
  ) {
    features.add("Booking system");
  }

  // Cart/checkout
  if (
    content.includes("cart") ||
    content.includes("checkout") ||
    content.includes("addToCart")
  ) {
    features.add("Shopping cart");
  }

  // Authentication
  if (
    content.includes("auth.login") ||
    content.includes("auth.signup") ||
    content.includes("isAuthenticated")
  ) {
    features.add("User authentication");
  }
}

/**
 * Detect which proxy services are used.
 */
function detectServices(content: string, services: Set<string>): void {
  if (content.includes("db.getAll") || content.includes("db.create")) {
    services.add("Database");
  }
  if (content.includes("email.send") || content.includes("email.notify")) {
    services.add("Email notifications");
  }
  if (content.includes("sms.send")) {
    services.add("SMS messaging");
  }
  if (content.includes("maps.geocode") || content.includes("maps.directions")) {
    services.add("Maps & location");
  }
  if (
    content.includes("storage.getUploadUrl") ||
    content.includes("storage.list")
  ) {
    services.add("File storage");
  }
  if (content.includes("ai.chat") || content.includes("ai.generateImage")) {
    services.add("AI integration");
  }
  if (content.includes("auth.login") || content.includes("auth.signup")) {
    services.add("Authentication");
  }
}

/**
 * Detect database collections from db calls.
 */
function detectCollections(content: string, collections: Set<string>): void {
  const dbCallPattern =
    /db\.(getAll|getOne|create|update|delete)\(\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = dbCallPattern.exec(content)) !== null) {
    collections.add(match[2]);
  }
}

/**
 * Format the analysis into a user-friendly summary.
 */
function formatSummary(
  analysis: AnalysisResult,
  createdFileCount: number,
  changedFileCount: number,
): string {
  const { screens, components, features, services, collections } = analysis;
  const parts: string[] = [];
  const modifiedCount = Math.max(changedFileCount - createdFileCount, 0);

  // Opening line based on scope
  if (createdFileCount > 0 && modifiedCount > 0) {
    parts.push(
      `Done! Updated ${modifiedCount} file${modifiedCount !== 1 ? "s" : ""} and created ${createdFileCount} new file${createdFileCount !== 1 ? "s" : ""}.`,
    );
  } else if (createdFileCount > 0) {
    parts.push(
      `All set! Created ${createdFileCount} new file${createdFileCount !== 1 ? "s" : ""}.`,
    );
  } else if (modifiedCount > 0) {
    parts.push(
      `Done! Updated ${modifiedCount} file${modifiedCount !== 1 ? "s" : ""}.`,
    );
  } else {
    parts.push(
      "No code changes were applied. If you want updates, please clarify what to change.",
    );
  }

  // Screens
  if (screens.length > 0) {
    const unique = [...new Set(screens)];
    const screenList = unique.slice(0, 5);
    parts.push(`\n\n**Screens:** ${screenList.join(" • ")}`);
    if (unique.length > 5) {
      parts.push(` (+${unique.length - 5} more)`);
    }
  }

  // Components
  if (components.length > 0) {
    const unique = [...new Set(components)];
    const compList = unique.slice(0, 5);
    parts.push(`\n**Components:** ${compList.join(" • ")}`);
    if (unique.length > 5) {
      parts.push(` (+${unique.length - 5} more)`);
    }
  }

  // Features - most interesting part
  const featureList = Array.from(features).slice(0, 6);
  if (featureList.length > 0) {
    parts.push(
      `\n\n**Features:**\n${featureList.map((f) => `• ${f}`).join("\n")}`,
    );
  }

  // Services used
  const serviceList = Array.from(services);
  if (serviceList.length > 0) {
    parts.push(`\n\n**Integrations:** ${serviceList.join(", ")}`);
  }

  // Data collections
  const collectionList = Array.from(collections);
  if (collectionList.length > 0) {
    parts.push(`\n**Data:** ${collectionList.join(", ")}`);
  }

  // Call to action
  parts.push(
    `\n\nPreview is refreshing — try it out and let me know what to tweak!`,
  );

  return parts.join("");
}

/**
 * Convert PascalCase/camelCase to readable format.
 */
function formatComponentName(name: string): string {
  return name
    .replace(/Screen$|Page$|Component$|View$/i, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();
}
