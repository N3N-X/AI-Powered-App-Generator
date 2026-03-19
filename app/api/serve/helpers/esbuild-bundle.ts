/**
 * Orchestrates esbuild bundling for serve route.
 *
 * Takes in-memory code_files, runs esbuild with virtual filesystem plugin,
 * and returns a minified IIFE bundle ready for inline embedding.
 */

import * as esbuild from "esbuild";
import { createVirtualFsPlugin } from "./esbuild-plugin";
import { getCachedBundle, setCachedBundle } from "./bundle-cache";

/** Find the app entry point file name. */
function findEntryPoint(codeFiles: Record<string, string>): string | null {
  const candidates = ["App.tsx", "App.jsx", "App.js", "App.ts"];
  for (const name of candidates) {
    if (codeFiles[name] !== undefined) return name;
  }
  return null;
}

export interface BundleResult {
  js: string;
}

/**
 * Bundle code files into a single minified JS string.
 * Results are cached in memory and Redis.
 */
export async function bundleCodeFiles(
  codeFiles: Record<string, string>,
): Promise<BundleResult> {
  // Check cache first
  const cached = await getCachedBundle(codeFiles);
  if (cached) return { js: cached };

  const entryPoint = findEntryPoint(codeFiles);
  if (!entryPoint) {
    throw new Error("No App.tsx/App.jsx/App.js entry point found");
  }

  const result = await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    format: "iife",
    globalName: "__App",
    minify: true,
    target: "es2020",
    jsx: "automatic",
    write: false,
    metafile: false,
    logLevel: "silent",
    plugins: [createVirtualFsPlugin(codeFiles)],
  });

  const js = result.outputFiles?.[0]?.text || "";
  if (!js) {
    throw new Error("esbuild produced empty output");
  }

  // Cache the result (async, don't block response)
  setCachedBundle(codeFiles, js).catch((err) =>
    console.warn("[serve] Failed to cache bundle:", err),
  );

  return { js };
}
