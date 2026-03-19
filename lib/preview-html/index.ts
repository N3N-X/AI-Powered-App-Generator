/**
 * Generate HTML for live web preview.
 * This runs on the client side to enable instant preview updates.
 *
 * Supports multi-file projects via a CommonJS-style virtual module system.
 * External packages (React, etc.) are loaded via UMD script tags that set
 * window globals, which the require() registry maps to package names.
 *
 * SECURITY: User code is sandboxed with restricted API access.
 */

import { getPreviewStyles, getSizeLimitStyles } from "./styles";
import { getLucideIconScript } from "./lucide-icons";
import { getSandboxScript, getConsoleCaptureScript } from "./sandbox-script";
import {
  getModuleSystemScript,
  getAppLoaderScript,
} from "./module-system-script";

export function generatePreviewHtml(
  codeFiles: Record<string, string>,
  appName: string,
  runtimeApiBase?: string,
): string {
  // Guard against excessively large projects that could crash the browser
  const MAX_CODE_SIZE = 5 * 1024 * 1024; // 5MB
  const totalSize = Object.values(codeFiles).reduce(
    (sum, c) => sum + (c?.length || 0),
    0,
  );
  if (totalSize > MAX_CODE_SIZE) {
    return generateSizeLimitHtml();
  }

  const filesJson = JSON.stringify(codeFiles);
  const encodedFiles = btoa(unescape(encodeURIComponent(filesJson)));
  const apiBaseScript = runtimeApiBase
    ? `window.__RUX_API_BASE__='${escapeScript(runtimeApiBase)}';`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(appName)}</title>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'unsafe-inline' 'unsafe-eval' https://unpkg.com; style-src 'unsafe-inline'; img-src * data: blob:; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; connect-src 'self' https://esm.sh https://unpkg.com https://*.rulxy.com https://*.rulxy.space https://*.nonxy.com http://localhost:*; frame-src 'none'">
  <style>${getPreviewStyles()}
  </style>
</head>
<body>
  <div id="root">
    <div class="rux-loading">
      <div class="rux-spinner"></div>
      <span style="color: #666; font-size: 14px;">Loading...</span>
    </div>
  </div>

  <!-- Load external dependencies as UMD globals -->
  <script crossorigin src="https://unpkg.com/react@18.2.0/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>

  <script>${getSandboxScript()}
${apiBaseScript}
${getConsoleCaptureScript()}
${getLucideIconScript()}
${getModuleSystemScript(encodedFiles)}
${getAppLoaderScript()}
  </script>
</body>
</html>`;
}

function generateSizeLimitHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Too Large</title>
  <style>${getSizeLimitStyles()}
  </style>
</head>
<body>
  <div>
    <h2>Project Too Large</h2>
    <p>Code exceeds the 5MB preview limit. Try reducing the number of files.</p>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeScript(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
