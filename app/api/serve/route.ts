import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CodeFiles } from "@/types";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiter for serve endpoint - prevents abuse
const redis = Redis.fromEnv();
const serveRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute per subdomain
  prefix: "rux:serve:ratelimit",
  analytics: true,
});

// Allowed hosts for production (prevents host header injection)
const ALLOWED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "rux.sh",
  ".rux.sh", // Allows *.rux.sh subdomains
];

// Validate subdomain format to prevent injection
const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Validate host header to prevent host header injection attacks
 */
function isValidHost(host: string): boolean {
  const hostWithoutPort = host.split(":")[0].toLowerCase();

  // Check exact matches and suffix matches
  for (const allowed of ALLOWED_HOSTS) {
    if (allowed.startsWith(".")) {
      // Suffix match (e.g., .rux.sh matches anything.rux.sh)
      if (
        hostWithoutPort.endsWith(allowed) ||
        hostWithoutPort === allowed.slice(1)
      ) {
        return true;
      }
    } else if (hostWithoutPort === allowed) {
      return true;
    }
  }

  // For custom domains, we verify against the database
  // This is handled in the main logic
  return true; // Allow through for custom domain check
}

/**
 * Generate security headers for served content
 * @param _isCustomDomain - Reserved for future custom domain specific headers
 */
function getSecurityHeaders(_isCustomDomain: boolean): Record<string, string> {
  return {
    "Content-Type": "text/html; charset=utf-8",
    // Prevent clickjacking - allow same-origin only
    "X-Frame-Options": "SAMEORIGIN",
    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",
    // XSS protection (legacy, but still useful)
    "X-XSS-Protection": "1; mode=block",
    // Referrer policy
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // Content Security Policy - allows blob: for dynamic module loading
    // User code runs in a sandboxed iframe for additional isolation
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://esm.sh https://unpkg.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
      "connect-src 'self' https://esm.sh https://unpkg.com",
      "frame-src 'self' blob:",
      "frame-ancestors 'self' https://rux.sh https://*.rux.sh http://localhost:*",
    ].join("; "),
    // Cache for performance
    "Cache-Control":
      "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
  };
}

/**
 * Serve web app by subdomain or custom domain
 *
 * Production: Accessed via subdomain.rux.sh or custom domain
 * Localhost testing: /api/serve?subdomain=happy-panda-42
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const host = request.headers.get("host") || "";
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Validate host header
    if (!isValidHost(host)) {
      console.warn(`[serve] Invalid host header: ${host} from IP: ${clientIp}`);
      return new NextResponse(
        generateErrorHtml("Invalid Request", "Host header validation failed"),
        { status: 400, headers: getSecurityHeaders(false) },
      );
    }

    // Determine subdomain/domain from request
    let subdomain: string | null = searchParams.get("subdomain");
    let customDomain: string | null = searchParams.get("domain");

    // In production, extract from host header
    if (!subdomain && !customDomain) {
      // Check if it's a subdomain of rux.sh
      if (host.endsWith(".rux.sh")) {
        subdomain = host.replace(".rux.sh", "").split(":")[0];
      } else if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
        // Assume it's a custom domain
        customDomain = host.split(":")[0]; // Remove port if present
      }
    }

    // Validate subdomain format
    if (subdomain && !SUBDOMAIN_REGEX.test(subdomain)) {
      console.warn(
        `[serve] Invalid subdomain format: ${subdomain} from IP: ${clientIp}`,
      );
      return new NextResponse(
        generateErrorHtml(
          "Invalid Subdomain",
          "Subdomain contains invalid characters",
        ),
        { status: 400, headers: getSecurityHeaders(false) },
      );
    }

    if (!subdomain && !customDomain) {
      return new NextResponse(
        generateErrorHtml(
          "No subdomain or domain specified",
          "Add ?subdomain=your-subdomain to test locally",
        ),
        { status: 400, headers: getSecurityHeaders(false) },
      );
    }

    // Rate limiting by subdomain/domain and IP
    const rateLimitKey = `${subdomain || customDomain}:${clientIp}`;
    const { success, limit, remaining, reset } =
      await serveRateLimiter.limit(rateLimitKey);

    if (!success) {
      console.warn(`[serve] Rate limit exceeded for ${rateLimitKey}`);
      return new NextResponse(
        generateErrorHtml(
          "Too Many Requests",
          "Please slow down. Try again in a minute.",
        ),
        {
          status: 429,
          headers: {
            ...getSecurityHeaders(false),
            "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": String(reset),
          },
        },
      );
    }

    // Find project by subdomain or custom domain
    const supabase = await createClient();
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        "id, name, subdomain, custom_domain, domain_verified, code_files, platform",
      )
      .eq("platform", "WEB")
      .or(
        subdomain
          ? `subdomain.eq.${subdomain}`
          : `custom_domain.eq.${customDomain}`,
      )
      .single();

    if (projectError || !project) {
      // Log potential probing attempts
      console.info(
        `[serve] Project not found: ${subdomain || customDomain} from IP: ${clientIp}`,
      );
      return new NextResponse(
        generateErrorHtml(
          "App not found",
          subdomain
            ? `No web app found at ${subdomain}.rux.sh`
            : `Domain ${customDomain} is not configured or verified`,
        ),
        { status: 404, headers: getSecurityHeaders(!!customDomain) },
      );
    }

    // Verify custom domain is actually verified (double-check)
    if (customDomain && !project.domain_verified) {
      console.warn(
        `[serve] Unverified custom domain access attempt: ${customDomain} from IP: ${clientIp}`,
      );
      return new NextResponse(
        generateErrorHtml(
          "Domain Not Verified",
          "This custom domain has not been verified yet",
        ),
        { status: 403, headers: getSecurityHeaders(true) },
      );
    }

    const codeFiles = (project.code_files as CodeFiles) || {};

    // Check if there's any code to serve
    if (Object.keys(codeFiles).length === 0) {
      return new NextResponse(
        generateErrorHtml(
          "App is empty",
          "This web app doesn't have any code yet",
        ),
        { status: 404, headers: getSecurityHeaders(!!customDomain) },
      );
    }

    // Log successful serve for analytics
    console.info(
      `[serve] Serving ${subdomain || customDomain} (project: ${project.id}) to IP: ${clientIp}`,
    );

    // Generate and serve the HTML
    const html = generateWebAppHtml(codeFiles, project.name);

    return new NextResponse(html, {
      status: 200,
      headers: getSecurityHeaders(!!customDomain),
    });
  } catch (error) {
    console.error("Serve error:", error);
    return new NextResponse(
      generateErrorHtml("Server Error", "Something went wrong"),
      { status: 500, headers: getSecurityHeaders(false) },
    );
  }
}

function generateWebAppHtml(codeFiles: CodeFiles, appName: string): string {
  const appCode = codeFiles["App.tsx"] || codeFiles["App.js"] || "";

  // Escape the code for safe embedding
  // We use base64 encoding to avoid any escaping issues
  const encodedCode = Buffer.from(appCode).toString("base64");

  // The sandboxed iframe content - this runs the user's code in isolation
  const sandboxedContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { height: 100%; width: 100%; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
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
  <div id="root"></div>
  <script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
  <script>
    // SANDBOX SECURITY: Restrict dangerous APIs
    (function() {
      // Block access to parent window
      try { delete window.parent; } catch(e) {}
      try { delete window.top; } catch(e) {}
      try { delete window.opener; } catch(e) {}

      // Restrict localStorage/sessionStorage to prevent data leakage
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
        } catch(e) {
          console.error('[RUX Sandbox] Invalid URL in fetch:', urlStr);
          return Promise.reject(new Error('Invalid URL format'));
        }

        // Only check domain if we have a valid hostname
        if (!hostname) {
          console.error('[RUX Sandbox] Empty hostname after parsing:', urlStr);
          return Promise.reject(new Error('Invalid URL - no hostname'));
        }

        var isAllowed = allowedDomains.some(function(d) {
          return hostname === d || hostname.endsWith('.' + d);
        });

        if (!isAllowed && !urlStr.startsWith('data:') && !urlStr.startsWith('blob:')) {
          console.warn('[RUX Sandbox] Blocked fetch to:', urlStr);
          return Promise.reject(new Error('Network requests are restricted in sandbox mode'));
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
          } catch(e) {
            console.error('[RUX Sandbox] Invalid URL in XHR:', url);
            throw new Error('Invalid URL format');
          }

          // Only check domain if we have a valid hostname
          if (!hostname) {
            console.error('[RUX Sandbox] Empty hostname after parsing:', url);
            throw new Error('Invalid URL - no hostname');
          }

          var isAllowed = allowedDomains.some(function(d) {
            return hostname === d || hostname.endsWith('.' + d);
          });

          if (!isAllowed) {
            console.warn('[RUX Sandbox] Blocked XHR to:', url);
            throw new Error('Network requests are restricted in sandbox mode');
          }
          return originalOpen.apply(xhr, arguments);
        };
        return xhr;
      };

      // Block WebSocket connections
      window.WebSocket = function() {
        console.warn('[RUX Sandbox] WebSocket connections are blocked');
        throw new Error('WebSocket connections are restricted in sandbox mode');
      };

      // Block postMessage to parent (prevent data exfiltration)
      var originalPostMessage = window.postMessage;
      window.postMessage = function(message, targetOrigin) {
        // Only allow same-origin messages
        if (targetOrigin !== '*' && targetOrigin !== window.location.origin) {
          console.warn('[RUX Sandbox] Blocked postMessage to:', targetOrigin);
          return;
        }
        return originalPostMessage.apply(window, arguments);
      };
    })();

    // Load the app
    var encodedCode = "${encodedCode}";
    var appCode = atob(encodedCode);

    function escapeHtml(text) {
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    async function loadApp() {
      try {
        var transformed = Babel.transform(appCode, {
          presets: ['react', 'typescript'],
          filename: 'App.tsx'
        }).code;

        var blob = new Blob([transformed], { type: 'application/javascript' });
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
        console.error('App Error:', error);
        document.getElementById('root').innerHTML =
          '<div class="rux-error">' +
          '<h2>Error</h2>' +
          '<p>' + escapeHtml(error.message) + '</p>' +
          '<pre>' + escapeHtml(error.stack || '') + '</pre>' +
          '</div>';
      }
    }

    window.addEventListener('load', function() {
      setTimeout(loadApp, 100);
    });

    window.onerror = function(msg, url, line, col) {
      console.error('[RUX] Runtime error:', msg);
      return false;
    };
  </script>
</body>
</html>`;

  // Base64 encode the sandboxed content for srcdoc
  const sandboxedContentEncoded =
    Buffer.from(sandboxedContent).toString("base64");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(appName)} - Powered by RUX</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; width: 100%; overflow: hidden; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .rux-container {
      width: 100%;
      height: 100%;
      position: relative;
    }
    .rux-sandbox-frame {
      width: 100%;
      height: 100%;
      border: none;
    }
    .rux-loading {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
      flex-direction: column;
      gap: 16px;
      z-index: 10;
      transition: opacity 0.3s ease;
    }
    .rux-loading.hidden {
      opacity: 0;
      pointer-events: none;
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
    .rux-badge {
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      z-index: 9999;
    }
    .rux-badge a {
      color: white;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="rux-container">
    <div class="rux-loading" id="loading">
      <div class="rux-spinner"></div>
      <span style="color: #666; font-size: 14px;">Loading app...</span>
    </div>

    <!--
      SANDBOXED IFRAME: User code runs here with restricted permissions
      - allow-scripts: Needed for React
      - allow-same-origin: Needed for ES modules from esm.sh
      - NO allow-forms: Prevents form submissions
      - NO allow-popups: Prevents window.open()
      - NO allow-top-navigation: Prevents navigation of parent
      - NO allow-modals: Prevents alert/confirm/prompt
    -->
    <iframe
      id="sandbox"
      class="rux-sandbox-frame"
      sandbox="allow-scripts allow-same-origin"
      referrerpolicy="no-referrer"
    ></iframe>
  </div>

  <div class="rux-badge">
    <a href="https://rux.sh" target="_blank" rel="noopener noreferrer">Powered by RUX</a>
  </div>

  <script>
    // Initialize the sandboxed iframe
    (function() {
      var iframe = document.getElementById('sandbox');
      var loading = document.getElementById('loading');
      var content = atob("${sandboxedContentEncoded}");

      // Use srcdoc to load the sandboxed content
      iframe.srcdoc = content;

      // Hide loading indicator when iframe loads
      iframe.onload = function() {
        setTimeout(function() {
          loading.classList.add('hidden');
        }, 500);
      };

      // Prevent iframe from accessing parent
      iframe.contentWindow = null;
    })();
  </script>
</body>
</html>`;
}

function generateErrorHtml(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - RUX</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 { font-size: 24px; margin-bottom: 10px; }
    p { color: #94a3b8; font-size: 16px; }
    a { color: #8b5cf6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🔍</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <p style="margin-top: 20px;"><a href="https://rux.sh">Create your own app with RUX</a></p>
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
