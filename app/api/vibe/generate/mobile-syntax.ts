import * as ts from "typescript";
import type { CodeFiles } from "@/types";

export function validateMobileSyntax(files: CodeFiles): string[] {
  const errors: string[] = [];
  for (const [fileName, content] of Object.entries(files)) {
    if (!isScriptFile(fileName)) continue;
    for (const diagnostic of getSyntaxDiagnostics(fileName, content)) {
      if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
      errors.push(formatDiagnostic(fileName, content, diagnostic));
    }
  }
  return errors;
}

function getSyntaxDiagnostics(fileName: string, content: string): ts.Diagnostic[] {
  const primary = transpileDiagnostics(fileName, content);
  if (primary.length === 0) return primary;
  if (!shouldRetryAsTsx(fileName, content)) return primary;

  const fallbackFileName = fileName.replace(/\.ts$/, ".tsx").replace(/\.js$/, ".jsx");
  const fallback = transpileDiagnostics(fallbackFileName, content);
  return fallback.length <= primary.length ? fallback : primary;
}

function transpileDiagnostics(fileName: string, content: string): ts.Diagnostic[] {
  const result = ts.transpileModule(content, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  return result.diagnostics || [];
}

function shouldRetryAsTsx(fileName: string, content: string): boolean {
  if (!fileName.endsWith(".ts") && !fileName.endsWith(".js")) return false;
  if (!/from\s+['"]react['"]/.test(content) && !/tsx?/i.test(fileName)) return false;
  return /return\s*\(\s*</.test(content) || /<\s*[A-Z][A-Za-z0-9]*/.test(content);
}

function formatDiagnostic(
  fileName: string,
  content: string,
  diagnostic: ts.Diagnostic,
): string {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
  if (diagnostic.start === undefined) {
    return `${fileName}: ${message}`;
  }
  const source = ts.createSourceFile(
    fileName,
    content,
    ts.ScriptTarget.Latest,
    true,
    toScriptKind(fileName),
  );
  const pos = source.getLineAndCharacterOfPosition(diagnostic.start);
  return `${fileName}:${pos.line + 1}:${pos.character + 1}: ${message}`;
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
