/**
 * esbuild virtual filesystem plugin for bundling in-memory code files.
 *
 * Resolves imports from the code_files Record<string, string> and provides
 * shim modules for external dependencies (React, ReactDOM, lucide-react).
 */

import type { Plugin } from "esbuild";
import { LUCIDE_ICON_MAP } from "./lucide-icons";

const EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];
const INDEX_EXTENSIONS = EXTENSIONS.map((e) => `/index${e}`);

/** Resolve a file path against the in-memory code files map. */
function resolveFile(
  path: string,
  codeFiles: Record<string, string>,
): string | null {
  // Try exact match first
  if (codeFiles[path] !== undefined) return path;
  // Try adding extensions
  for (const ext of EXTENSIONS) {
    if (codeFiles[path + ext] !== undefined) return path + ext;
  }
  // Try index files
  for (const ext of INDEX_EXTENSIONS) {
    if (codeFiles[path + ext] !== undefined) return path + ext;
  }
  return null;
}

/** Resolve a relative import path from a given source file. */
function resolveRelative(
  importPath: string,
  fromFile: string,
  codeFiles: Record<string, string>,
): string | null {
  const dir =
    fromFile.indexOf("/") !== -1 ? fromFile.replace(/\/[^/]*$/, "") : "";

  const raw = dir ? `${dir}/${importPath}` : importPath;
  const parts = raw.split("/");
  const resolved: string[] = [];

  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") {
      resolved.pop();
      continue;
    }
    resolved.push(part);
  }

  const normalized = resolved.join("/");
  const result = resolveFile(normalized, codeFiles);
  if (result) return result;

  // Fallback: try basename at root (e.g. ../App from src/pages/ → App.tsx)
  if (importPath.startsWith("../") || importPath.startsWith("./")) {
    const basename = importPath.split("/").pop();
    if (basename) {
      const rootMatch = resolveFile(basename, codeFiles);
      if (rootMatch) return rootMatch;
    }
  }

  // Fallback: try suffix match against all files (handles wrong depth, e.g.
  // ../../services/api from src/pages/ should find src/services/api.ts)
  const suffix = normalized.replace(/^\/+/, "");
  if (suffix) {
    for (const key of Object.keys(codeFiles)) {
      const keyWithout = key.replace(/\.(tsx|ts|jsx|js)$/, "");
      if (keyWithout.endsWith(suffix) || key.endsWith(suffix)) {
        return key;
      }
    }
  }

  return null;
}

/** Build a shim that re-exports React from the window global. */
function buildReactShim(): string {
  return `var R = window.React;
module.exports = R;
module.exports.default = R;
module.exports.__esModule = true;`;
}

function buildReactDomShim(): string {
  return `var RD = window.ReactDOM;
module.exports = RD;
module.exports.default = RD;
module.exports.__esModule = true;`;
}

function buildReactDomClientShim(): string {
  return `var RD = window.ReactDOM;
module.exports = { default: RD, createRoot: RD.createRoot, hydrateRoot: RD.hydrateRoot, __esModule: true };`;
}

function buildJsxRuntimeShim(): string {
  return `var R = window.React;
module.exports = { default: R, jsx: R.createElement, jsxs: R.createElement, jsxDEV: R.createElement, Fragment: R.Fragment, __esModule: true };`;
}

/** Build a shim module for lucide-react with all icon exports. */
function buildLucideShim(): string {
  const lines = [
    `var React = window.React;`,
    `function createIcon(name, pathD) {`,
    `  return function LucideIcon(props) {`,
    `    var s = (props && props.size) || 24;`,
    `    var c = (props && props.color) || (props && props.stroke) || 'currentColor';`,
    `    var w = (props && props.strokeWidth) || 2;`,
    `    var paths = pathD ? pathD.split(' M').map(function(d, i) {`,
    `      return React.createElement('path', { key: i, d: i === 0 ? d : 'M' + d });`,
    `    }) : React.createElement('circle', { cx: 12, cy: 12, r: 10 });`,
    `    return React.createElement('svg', {`,
    `      xmlns: 'http://www.w3.org/2000/svg', width: s, height: s,`,
    `      viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: w,`,
    `      strokeLinecap: 'round', strokeLinejoin: 'round',`,
    `      className: (props && props.className) || '',`,
    `      style: props && props.style`,
    `    }, paths);`,
    `  };`,
    `}`,
  ];

  // Export each icon as a named export
  for (const [name, path] of Object.entries(LUCIDE_ICON_MAP)) {
    lines.push(
      `exports.${name} = createIcon(${JSON.stringify(name)}, ${JSON.stringify(path)});`,
    );
  }

  lines.push(`exports.__esModule = true;`);
  lines.push(`exports.default = {};`);
  return lines.join("\n");
}

const SHIM_MODULES: Record<string, () => string> = {
  react: buildReactShim,
  "react-dom": buildReactDomShim,
  "react-dom/client": buildReactDomClientShim,
  "react/jsx-runtime": buildJsxRuntimeShim,
  "react/jsx-dev-runtime": buildJsxRuntimeShim,
  "lucide-react": buildLucideShim,
};

/** Create the esbuild plugin that serves files from memory. */
export function createVirtualFsPlugin(
  codeFiles: Record<string, string>,
): Plugin {
  return {
    name: "virtual-fs",
    setup(build) {
      // Resolve shim modules (react, react-dom, lucide-react)
      build.onResolve({ filter: /.*/ }, (args) => {
        if (SHIM_MODULES[args.path]) {
          return { path: args.path, namespace: "shim" };
        }

        // Resolve relative/absolute imports against code files
        if (args.path.startsWith(".") || args.path.startsWith("/")) {
          const from = args.importer ? args.importer.replace(/^\//, "") : "";
          const resolved = resolveRelative(args.path, from, codeFiles);
          if (resolved) {
            return { path: `/${resolved}`, namespace: "virtual" };
          }
        }

        // Try as a bare path (e.g. entry point "App.tsx")
        const resolved = resolveFile(args.path, codeFiles);
        if (resolved) {
          return { path: `/${resolved}`, namespace: "virtual" };
        }

        return undefined;
      });

      // Load shim modules
      build.onLoad({ filter: /.*/, namespace: "shim" }, (args) => {
        const builder = SHIM_MODULES[args.path];
        if (!builder) return undefined;
        return { contents: builder(), loader: "js" };
      });

      // Load virtual files from code_files
      build.onLoad({ filter: /.*/, namespace: "virtual" }, (args) => {
        const filePath = args.path.replace(/^\//, "");
        const contents = codeFiles[filePath];
        if (contents === undefined) return undefined;

        const ext = filePath.split(".").pop() || "";
        const loaderMap: Record<string, "tsx" | "ts" | "jsx" | "js"> = {
          tsx: "tsx",
          ts: "ts",
          jsx: "jsx",
          js: "js",
        };
        return { contents, loader: loaderMap[ext] || "tsx" };
      });
    },
  };
}
