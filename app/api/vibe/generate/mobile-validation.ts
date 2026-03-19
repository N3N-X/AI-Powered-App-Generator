import * as path from "path";
import * as ts from "typescript";
import type { Platform } from "@/lib/codex/client";
import type { CodeFiles } from "@/types";
import { normalizeReactImports } from "./react-imports";
import { normalizeMobileJsxFileExtensions } from "./mobile-jsx-files";
import { validateMobileSyntax } from "./mobile-syntax";

const REQUIRED_MOBILE_FILES = ["package.json", "app.json", "App.tsx"];
const REQUIRED_APP_TOKENS = [
  "SafeAreaProvider",
  "NavigationContainer",
  "StatusBar",
  "ThemeProvider",
];
const BANNED_MOBILE_IMPORTS = [
  "react-dom",
  "next",
  "next/",
  "vite",
  "@vitejs/plugin-react",
  "react-router-dom",
];
const IMPORT_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".json"];
const KNOWN_MOBILE_DEP_VERSIONS: Record<string, string> = {
  react: "19.1.0",
  "react-native": "0.81.5",
  "expo-status-bar": "~3.0.9",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0",
  "@react-navigation/native": "^7.0.0",
  "@react-navigation/native-stack": "^7.0.0",
  "@react-navigation/bottom-tabs": "^7.0.0",
  "@expo/vector-icons": "^15.0.3",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-reanimated": "~4.1.1",
  "react-native-svg": "15.12.1",
  expo: "~54.0.0",
};

interface ValidationResult {
  files: CodeFiles;
  warnings: string[];
}

interface ParsedImports {
  external: Set<string>;
  local: string[];
}

export function runMobileValidationAndFixes(
  files: CodeFiles,
  platform: Platform,
): ValidationResult {
  if (platform === "WEB") {
    return { files, warnings: [] };
  }

  const nextFiles = applyDeterministicFixes(files);
  const warnings = [
    ...normalizeMobileJsxFileExtensions(nextFiles),
    ...collectStructuralWarnings(nextFiles),
    ...syncPackageDependencies(nextFiles),
  ];
  const errors = validateMobileOutput(nextFiles);
  if (errors.length > 0) {
    throw new Error(buildValidationError(errors));
  }
  return { files: nextFiles, warnings };
}

function applyDeterministicFixes(files: CodeFiles): CodeFiles {
  const next: CodeFiles = { ...files };
  for (const [fileName, content] of Object.entries(next)) {
    if (!isScriptFile(fileName)) continue;
    if (!/['"]react['"]/.test(content)) continue;
    const normalized = normalizeReactImports(content, fileName);
    if (normalized !== content) {
      next[fileName] = normalized;
    }
  }
  return next;
}

function syncPackageDependencies(files: CodeFiles): string[] {
  const warnings: string[] = [];
  const rawPackageJson = files["package.json"];
  if (!rawPackageJson) return warnings;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawPackageJson) as Record<string, unknown>;
  } catch {
    warnings.push("package.json is invalid JSON; dependency sync skipped.");
    return warnings;
  }

  const deps = (parsed.dependencies || {}) as Record<string, string>;
  const devDeps = (parsed.devDependencies || {}) as Record<string, string>;
  const imports = collectExternalImports(files);
  let changed = false;

  for (const pkg of imports) {
    if (deps[pkg] || devDeps[pkg]) continue;
    const version = KNOWN_MOBILE_DEP_VERSIONS[pkg];
    if (!version) continue;
    deps[pkg] = version;
    changed = true;
    warnings.push(`Added missing dependency "${pkg}" to package.json.`);
  }

  if (changed) {
    parsed.dependencies = deps;
    files["package.json"] = JSON.stringify(parsed, null, 2);
  }

  return warnings;
}

function validateMobileOutput(files: CodeFiles): string[] {
  const errors: string[] = [];
  for (const required of REQUIRED_MOBILE_FILES) {
    if (!files[required]) {
      errors.push(`Missing required mobile file: ${required}`);
    }
  }

  const externalImports = collectExternalImports(files);
  for (const pkg of externalImports) {
    const banned = BANNED_MOBILE_IMPORTS.find(
      (entry) => pkg === entry || pkg.startsWith(entry),
    );
    if (banned) {
      errors.push(`Unsupported mobile import detected: ${pkg}`);
    }
  }

  errors.push(...validatePackageDependencies(files, externalImports));
  errors.push(...validateLocalImports(files));
  errors.push(...validateMobileSyntax(files));
  return unique(errors);
}

function collectStructuralWarnings(files: CodeFiles): string[] {
  const warnings: string[] = [];
  const appTsx = files["App.tsx"] || "";
  if (!appTsx.includes("createBottomTabNavigator")) {
    warnings.push(
      "App.tsx is missing createBottomTabNavigator; iOS Liquid Glass tab bar will not apply.",
    );
  }
  for (const token of REQUIRED_APP_TOKENS) {
    if (!appTsx.includes(token)) {
      warnings.push(
        `App.tsx is missing recommended mobile structure token: ${token}`,
      );
    }
  }
  if (!files["src/theme.ts"] && !files["src/theme.tsx"]) {
    warnings.push("Missing recommended theme provider file: src/theme.ts");
  }
  return warnings;
}

function collectExternalImports(files: CodeFiles): Set<string> {
  const external = new Set<string>();
  for (const [fileName, content] of Object.entries(files)) {
    if (!isScriptFile(fileName)) continue;
    const parsed = collectImports(fileName, content);
    parsed.external.forEach((pkg) => external.add(pkg));
  }
  return external;
}

function validatePackageDependencies(
  files: CodeFiles,
  imports: Set<string>,
): string[] {
  const errors: string[] = [];
  const rawPackageJson = files["package.json"];
  if (!rawPackageJson) return errors;

  try {
    const parsed = JSON.parse(rawPackageJson) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = parsed.dependencies || {};
    const devDeps = parsed.devDependencies || {};
    for (const pkg of imports) {
      if (deps[pkg] || devDeps[pkg]) continue;
      errors.push(`Missing dependency for imported package: ${pkg}`);
    }
  } catch {
    errors.push("package.json is invalid JSON.");
  }
  return errors;
}

function validateLocalImports(files: CodeFiles): string[] {
  const errors: string[] = [];
  for (const [fileName, content] of Object.entries(files)) {
    if (!isScriptFile(fileName)) continue;
    const imports = collectImports(fileName, content);
    for (const specifier of imports.local) {
      if (!resolveLocalImport(files, fileName, specifier)) {
        errors.push(`Unresolved local import in ${fileName}: ${specifier}`);
      }
    }
  }
  return errors;
}

function collectImports(fileName: string, content: string): ParsedImports {
  const sourceFile = ts.createSourceFile(
    fileName,
    content,
    ts.ScriptTarget.Latest,
    true,
    toScriptKind(fileName),
  );
  const external = new Set<string>();
  const local: string[] = [];

  sourceFile.forEachChild((node) => {
    if (!ts.isImportDeclaration(node)) return;
    if (!ts.isStringLiteral(node.moduleSpecifier)) return;
    const moduleName = node.moduleSpecifier.text.trim();
    if (!moduleName) return;
    if (moduleName.startsWith("./") || moduleName.startsWith("../")) {
      local.push(moduleName);
      return;
    }
    external.add(moduleName);
  });

  return { external, local };
}

function resolveLocalImport(
  files: CodeFiles,
  fromFile: string,
  specifier: string,
): string | null {
  const fromDir = path.posix.dirname(fromFile.replace(/\\/g, "/"));
  const base = path.posix.join(fromDir, specifier).replace(/\\/g, "/");
  const ext = path.posix.extname(base);

  if (ext) {
    return files[base] ? base : null;
  }

  for (const candidateExt of IMPORT_EXTENSIONS) {
    const candidate = `${base}${candidateExt}`;
    if (files[candidate]) return candidate;
  }
  for (const candidateExt of IMPORT_EXTENSIONS) {
    const candidate = path.posix.join(base, `index${candidateExt}`);
    if (files[candidate]) return candidate;
  }
  return null;
}

function buildValidationError(errors: string[]): string {
  const capped = errors.slice(0, 8);
  return `Mobile validation failed:\n- ${capped.join("\n- ")}`;
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

function isScriptFile(fileName: string): boolean {
  return /\.(ts|tsx|js|jsx)$/.test(fileName);
}

function toScriptKind(fileName: string): ts.ScriptKind {
  if (fileName.endsWith(".tsx")) return ts.ScriptKind.TSX;
  if (fileName.endsWith(".jsx")) return ts.ScriptKind.JSX;
  if (fileName.endsWith(".ts")) return ts.ScriptKind.TS;
  if (fileName.endsWith(".js")) return ts.ScriptKind.JS;
  return ts.ScriptKind.Unknown;
}
