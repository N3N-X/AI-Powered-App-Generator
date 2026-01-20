/**
 * Generate HTML for live web preview
 * This runs on the client side to enable instant preview updates
 *
 * SECURITY: User code is sandboxed with restricted API access:
 * - Network requests limited to allowed domains (esm.sh, unpkg.com, fonts)
 * - localStorage/sessionStorage are isolated per-preview
 * - Cookies are blocked
 * - WebSocket connections are blocked
 * - Parent window access is restricted
 */

export function generatePreviewHtml(
  codeFiles: Record<string, string>,
  appName: string,
): string {
  const appCode = codeFiles["App.tsx"] || codeFiles["App.js"] || "";

  // Base64 encode to avoid escaping issues
  const encodedCode = btoa(unescape(encodeURIComponent(appCode)));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(appName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { height: 100%; width: 100%; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .rux-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #f5f5f5;
      flex-direction: column;
      gap: 16px;
    }
    .rux-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e0e0e0;
      border-top-color: #8b5cf6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .rux-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #fef2f2;
      color: #991b1b;
      padding: 20px;
      text-align: center;
    }
    .rux-error pre {
      margin-top: 10px;
      padding: 10px;
      background: #fee2e2;
      border-radius: 4px;
      font-size: 12px;
      max-width: 90%;
      overflow: auto;
      text-align: left;
      white-space: pre-wrap;
      word-break: break-word;
    }
  </style>
  <script type="importmap">
  {
    "imports": {
      "react": "https://esm.sh/react@18.2.0",
      "react-dom": "https://esm.sh/react-dom@18.2.0",
      "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
      "react-native": "https://esm.sh/react-native-web@0.19.12?external=react,react-dom",
      "react-native-web": "https://esm.sh/react-native-web@0.19.12?external=react,react-dom",
      "expo-status-bar": "https://esm.sh/react-native-web@0.19.12?external=react,react-dom",
      "lucide-react": "https://esm.sh/lucide-react@0.400.0?external=react",
      "framer-motion": "https://esm.sh/framer-motion@11.0.0?external=react,react-dom",
      "clsx": "https://esm.sh/clsx@2.1.0"
    }
  }
  </script>
</head>
<body>
  <div id="root">
    <div class="rux-loading">
      <div class="rux-spinner"></div>
      <span style="color: #666; font-size: 14px;">Loading...</span>
    </div>
  </div>

  <script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>

  <script>
    // SANDBOX SECURITY: Restrict dangerous APIs for user code isolation
    (function() {
      // Block access to parent window (preview runs in iframe)
      try { delete window.parent; } catch(e) {}
      try { delete window.top; } catch(e) {}
      try { delete window.opener; } catch(e) {}

      // Isolated localStorage/sessionStorage (prevents cross-project data leakage)
      var sandboxStorage = {};
      Object.defineProperty(window, 'localStorage', {
        get: function() {
          return {
            getItem: function(k) { return sandboxStorage[k] || null; },
            setItem: function(k, v) { sandboxStorage[k] = String(v); },
            removeItem: function(k) { delete sandboxStorage[k]; },
            clear: function() { sandboxStorage = {}; },
            get length() { return Object.keys(sandboxStorage).length; },
            key: function(i) { return Object.keys(sandboxStorage)[i] || null; }
          };
        }
      });
      Object.defineProperty(window, 'sessionStorage', {
        get: function() { return window.localStorage; }
      });

      // Block document.cookie access
      Object.defineProperty(document, 'cookie', {
        get: function() { return ''; },
        set: function() { return ''; }
      });

      // Restrict fetch to allowed domains only
      var allowedDomains = ['esm.sh', 'unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
      var originalFetch = window.fetch;
      window.fetch = function(url, options) {
        var urlStr = typeof url === 'string' ? url : (url.url || '');
        var hostname = '';
        try {
          hostname = new URL(urlStr, window.location.origin).hostname;
        } catch(e) {}

        var isAllowed = allowedDomains.some(function(d) {
          return hostname === d || hostname.endsWith('.' + d);
        });

        if (!isAllowed && !urlStr.startsWith('data:') && !urlStr.startsWith('blob:')) {
          console.warn('[RUX Sandbox] Blocked fetch to:', urlStr);
          return Promise.reject(new Error('Network requests are restricted in preview mode'));
        }
        return originalFetch.call(window, url, options);
      };

      // Restrict XMLHttpRequest
      var OriginalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function() {
        var xhr = new OriginalXHR();
        var originalOpen = xhr.open;
        xhr.open = function(method, url) {
          var hostname = '';
          try {
            hostname = new URL(url, window.location.origin).hostname;
          } catch(e) {}

          var isAllowed = allowedDomains.some(function(d) {
            return hostname === d || hostname.endsWith('.' + d);
          });

          if (!isAllowed) {
            console.warn('[RUX Sandbox] Blocked XHR to:', url);
            throw new Error('Network requests are restricted in preview mode');
          }
          return originalOpen.apply(xhr, arguments);
        };
        return xhr;
      };

      // Block WebSocket connections
      window.WebSocket = function() {
        console.warn('[RUX Sandbox] WebSocket connections are blocked');
        throw new Error('WebSocket connections are restricted in preview mode');
      };

      // Block EventSource (SSE)
      window.EventSource = function() {
        console.warn('[RUX Sandbox] EventSource connections are blocked');
        throw new Error('EventSource connections are restricted in preview mode');
      };
    })();

    var encodedCode = "${encodedCode}";
    var appCode = decodeURIComponent(escape(atob(encodedCode)));

    async function loadApp() {
      try {
        var transformed = Babel.transform(appCode, {
          presets: ['react', 'typescript'],
          filename: 'App.tsx'
        }).code;

        var moduleCode = transformed;
        var blob = new Blob([moduleCode], { type: 'application/javascript' });
        var blobUrl = URL.createObjectURL(blob);

        var AppModule = await import(blobUrl);
        var App = AppModule.default || AppModule.App;

        var React = await import('react');
        var ReactDOM = await import('react-dom/client');

        var rootElement = document.getElementById('root');
        var root = ReactDOM.createRoot(rootElement);
        root.render(React.createElement(App));

        URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Preview Error:', error);
        document.getElementById('root').innerHTML =
          '<div class="rux-error">' +
          '<h2>Preview Error</h2>' +
          '<p>' + escapeHtml(error.message) + '</p>' +
          '<pre>' + escapeHtml(error.stack || '') + '</pre>' +
          '</div>';
      }
    }

    function escapeHtml(text) {
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    window.addEventListener('load', function() {
      setTimeout(loadApp, 100);
    });

    // Global error handler
    window.onerror = function(msg, url, line, col) {
      console.error('[RUX Preview] Runtime error:', msg);
      return false;
    };
  </script>
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
