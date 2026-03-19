import * as path from "path";
import * as ts from "typescript";
import type { CodeFiles } from "@/types";

export function normalizeMobileJsxFileExtensions(files: CodeFiles): string[] {
  const warnings: string[] = [];
  const entries = Object.entries(files);

  for (const [fileName, content] of entries) {
    if (!isConvertibleFile(fileName)) continue;
    const targetFile = toJsxExtension(fileName);
    if (files[targetFile] !== undefined) continue;
    if (!shouldConvert(fileName, content, targetFile)) continue;

    files[targetFile] = content;
    files[fileName] = buildCompatShim(fileName, targetFile);
    warnings.push(`Converted JSX file ${fileName} -> ${targetFile}.`);
  }

  return warnings;
}

function shouldConvert(
  fileName: string,
  content: string,
  targetFile: string,
): boolean {
  if (!looksLikeJsx(content)) return false;
  const primaryErrors = transpileErrorCount(fileName, content);
  if (primaryErrors === 0) return false;
  const fallbackErrors = transpileErrorCount(targetFile, content);
  return fallbackErrors < primaryErrors;
}

function transpileErrorCount(fileName: string, content: string): number {
  const result = ts.transpileModule(content, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  return (result.diagnostics || []).filter(
    (diag) => diag.category === ts.DiagnosticCategory.Error,
  ).length;
}

function looksLikeJsx(content: string): boolean {
  return /return\s*\(\s*</.test(content) || /<\s*[A-Z][A-Za-z0-9]*/.test(content);
}

function buildCompatShim(fromFile: string, toFile: string): string {
  const base = path.posix.basename(toFile);
  if (fromFile.endsWith(".ts")) {
    return [
      `export * from './${base}';`,
      `import * as __rux from './${base}';`,
      "const __defaultExport = (__rux as { default?: unknown }).default;",
      "export default __defaultExport;",
    ].join("\n");
  }
  return [
    `export * from './${base}';`,
    `import * as __rux from './${base}';`,
    "export default __rux.default;",
  ].join("\n");
}

function isConvertibleFile(fileName: string): boolean {
  return fileName.endsWith(".ts") || fileName.endsWith(".js");
}

function toJsxExtension(fileName: string): string {
  if (fileName.endsWith(".ts")) return fileName.replace(/\.ts$/, ".tsx");
  return fileName.replace(/\.js$/, ".jsx");
}
