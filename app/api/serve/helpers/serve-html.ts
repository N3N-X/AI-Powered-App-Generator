/**
 * Generates flat HTML for serving deployed web apps.
 * No iframe — React CDN + esbuild-bundled JS rendered directly.
 */

import { escapeHtml } from "./error-html";

interface ServeMetadata {
  description?: string;
}

interface RuntimeConfig {
  apiKey?: string;
  apiBase?: string;
}

function escapeScript(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

/**
 * Generate the complete HTML page for a served web app.
 * The bundled JS is an IIFE with globalName __App containing the app module.
 */
export function generateServeHtml(
  bundledJs: string,
  appName: string,
  metadata?: ServeMetadata,
  runtimeConfig?: RuntimeConfig,
): string {
  const escapedName = escapeHtml(appName);
  const description = metadata?.description || "";
  const escapedDescription = escapeHtml(description);

  const apiKeyScript = runtimeConfig?.apiKey
    ? `window.__RUX_API_KEY__='${escapeScript(runtimeConfig.apiKey)}';`
    : "";
  const apiBaseScript = runtimeConfig?.apiBase
    ? `window.__RUX_API_BASE__='${escapeScript(runtimeConfig.apiBase)}';`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedName}</title>
  ${description ? `<meta name="description" content="${escapedDescription}">` : ""}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapedName}">
  ${description ? `<meta property="og:description" content="${escapedDescription}">` : ""}
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapedName}">
  ${description ? `<meta name="twitter:description" content="${escapedDescription}">` : ""}
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>">
  ${analyticsGuardScript()}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { height: 100%; width: 100%; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .rux-loading {
      display: flex; align-items: center; justify-content: center;
      height: 100vh; background: #f5f5f5; flex-direction: column; gap: 16px;
    }
    .rux-spinner {
      width: 40px; height: 40px; border: 3px solid #e0e0e0;
      border-top-color: #8b5cf6; border-radius: 50%;
      animation: rux-spin 1s linear infinite;
    }
    @keyframes rux-spin { to { transform: rotate(360deg); } }
    .rux-error {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100vh; background: #fef2f2; color: #991b1b; padding: 20px; text-align: center;
    }
    .rux-error pre {
      margin-top: 10px; padding: 10px; background: #fee2e2; border-radius: 4px;
      font-size: 12px; max-width: 90%; overflow: auto; text-align: left;
      white-space: pre-wrap; word-break: break-word;
    }
    .rux-badge {
      position: fixed; bottom: 10px; right: 10px;
      background: rgba(0,0,0,0.7); color: white;
      padding: 4px 8px; border-radius: 4px; font-size: 11px; z-index: 9999;
    }
    .rux-badge a { color: white; text-decoration: none; }
  </style>
</head>
<body>
  <div id="root">
    <div class="rux-loading">
      <div class="rux-spinner"></div>
      <span style="color: #666; font-size: 14px;">Loading app...</span>
    </div>
  </div>

  <div class="rux-badge">
    <a href="https://rulxy.com" target="_blank" rel="noopener noreferrer">Powered by Rulxy</a>
  </div>

  <script crossorigin src="https://unpkg.com/react@18.2.0/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>

  <script>
    ${apiKeyScript}
    ${apiBaseScript}
  </script>

  <script>${bundledJs}</script>

  <script>
    (function() {
      try {
        var appModule = typeof __App !== 'undefined' ? __App : {};
        var App = appModule.default || appModule.App || appModule;
        if (!App || typeof App !== 'function') {
          throw new Error('No valid React component exported from App');
        }
        var root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
      } catch (err) {
        console.error('[Rulxy] App Error:', err);
        document.getElementById('root').innerHTML =
          '<div class="rux-error">' +
          '<h2>Error</h2>' +
          '<p>' + (err.message || 'Failed to load app') + '</p>' +
          '</div>';
      }
    })();
  </script>
</body>
</html>`;
}

/** Script that strips injected Cloudflare analytics beacons. */
function analyticsGuardScript(): string {
  return `<script>
    (function() {
      function stripBeacon(el) {
        if (!el || !el.src) return;
        if (el.src.indexOf('cloudflareinsights.com') === -1) return;
        try { el.removeAttribute('integrity'); } catch {}
        try { el.removeAttribute('crossorigin'); } catch {}
        try { el.parentNode && el.parentNode.removeChild(el); } catch {}
      }
      try {
        document.querySelectorAll('script[src*="cloudflareinsights.com"]').forEach(stripBeacon);
        var observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            mutation.addedNodes && mutation.addedNodes.forEach(function(node) {
              if (node && node.tagName === 'SCRIPT') stripBeacon(node);
            });
          });
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
      } catch {}
    })();
  </script>`;
}
