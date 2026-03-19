/**
 * RUX Prompts — Proxy documentation and API service code builders
 */

import { buildDbServiceCode } from "./proxy-docs-services-db";
import { buildAuthServiceCode } from "./proxy-docs-services-auth";
import {
  buildPaymentsServiceCode,
  buildEmailServiceCode,
  buildSmsServiceCode,
  buildMapsServiceCode,
  buildXaiServiceCode,
} from "./proxy-docs-services-extras";
import {
  buildStorageServiceCode,
  buildRevenueCatServiceCode,
} from "./proxy-docs-services-storage";

// Re-export for convenience
export { buildRevenueCatServiceCode } from "./proxy-docs-services-storage";

export function buildProxyDocs(apiBaseUrl: string): string {
  return `
## Rulxy PROXY SERVICES (use these for all backend operations)
API_BASE: "${apiBaseUrl}"
API_KEY: "USER_API_KEY" (injected at runtime)

### Database (CRUD operations)
POST ${apiBaseUrl}/api/proxy/db
Headers: { "Content-Type": "application/json", "X-RUX-API-Key": API_KEY }
Body: { collection, operation, data?, filter? }
Operations: create, findMany, findOne, update, delete
NOTE: Use scope "global" for public forms (newsletter, contact, waitlists) to avoid auth/session calls.

### Authentication
POST ${apiBaseUrl}/api/proxy/auth
Operations: signup, login, logout, getSession, resetPassword
Body: { operation, email?, password?, token? }

### Email (SendGrid)
POST ${apiBaseUrl}/api/proxy/email
Body: { to, subject, html?, text?, from?, replyTo?, cc?, bcc? }

### SMS (Twilio)
POST ${apiBaseUrl}/api/proxy/sms
Body: { to, message }

### Maps (Google Maps)
POST ${apiBaseUrl}/api/proxy/maps
Body: { operation: "geocode" | "directions" | "places", address?, origin?, destination?, mode?, query?, location?, radius? }

### Storage (File uploads)
POST ${apiBaseUrl}/api/proxy/storage — get presigned upload URL: { filename, contentType, size, isPublic? }
GET  ${apiBaseUrl}/api/proxy/storage — list files: ?prefix=&limit=
DELETE ${apiBaseUrl}/api/proxy/storage — delete file: { fileId }

### AI (xAI Grok)
POST ${apiBaseUrl}/api/proxy/xai
Chat: { messages: [{role, content}], model?, temperature?, max_tokens? }
Image Generation: { operation: "image", prompt: "description of image" }
  - Returns { url, prompt, creditsUsed }
  - Images are automatically saved to project storage

### Mobile Payments (RevenueCat — iOS/Android)
Use the local RevenueCat service (NOT the proxy):
Import from \`../services/payments\`
Required calls:
- \`await initPayments()\` on app startup
- \`await payments.getOfferings()\` to fetch products
- \`await payments.purchase(pkg)\` to purchase
`;
}

// Build API code with all common services available
// We include all services so Codex can use them without runtime errors
export function buildApiServiceCodeForSpec(
  apiBaseUrl: string,
  spec: {
    authRequired?: boolean;
    paymentsRequired?: boolean;
    externalApis?: string[];
    platform?: string;
    apiKey?: string;
  },
): string {
  const services: string[] = [];

  // Always include database with scope support
  services.push(buildDbServiceCode());

  // Always include auth service (proxied through Rulxy backend)
  services.push(buildAuthServiceCode());

  // Always include email - commonly needed for notifications, contact forms, etc.
  services.push(buildEmailServiceCode());

  // Always include storage - commonly needed for file uploads, images, etc.
  services.push(buildStorageServiceCode());

  // Always include maps - commonly needed for location features
  services.push(buildMapsServiceCode());

  // Always include AI - commonly needed for smart features
  services.push(buildXaiServiceCode());

  // Always include SMS - commonly needed for notifications
  services.push(buildSmsServiceCode());

  // Payments if needed — Stripe proxy for WEB only
  if (spec.paymentsRequired && spec.platform === "WEB") {
    services.push(buildPaymentsServiceCode());
  }

  const apiKeyValue = spec.apiKey ? `'${spec.apiKey}'` : `'YOUR_API_KEY_HERE'`;

  return `// RUX API Configuration
const API_BASE = '${apiBaseUrl}';
const API_KEY = ${apiKeyValue};

const headers = {
  'Content-Type': 'application/json',
  'X-RUX-API-Key': API_KEY,
};

// Platform-aware token storage (localStorage for web, AsyncStorage for mobile)
const _storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {${
      spec.platform === "WEB"
        ? `
      return localStorage.getItem(key);`
        : `
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      return await AsyncStorage.getItem(key);`
    }
    } catch { return null; }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {${
      spec.platform === "WEB"
        ? `
      localStorage.setItem(key, value);`
        : `
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.setItem(key, value);`
    }
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    try {${
      spec.platform === "WEB"
        ? `
      localStorage.removeItem(key);`
        : `
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.removeItem(key);`
    }
    } catch {}
  },
};

// Session management — auto-creates anonymous session for user-scoped data
let _sessionToken: string | null = null;
let _initPromise: Promise<void> | null = null;
export const setSessionToken = (token: string | null) => { _sessionToken = token; };
export const getSessionToken = (): string | null => _sessionToken;

// Initialize session — restores from storage or creates anonymous on demand
export const initSession = async (): Promise<string | null> => {
  if (_sessionToken) return _sessionToken;
  if (_initPromise) return _initPromise.then(() => _sessionToken);
  _initPromise = (async () => {
    // Check storage for existing token
    const stored = await _storage.getItem('rux_session_token');
    if (stored) {
      // Validate stored token is still alive
      try {
        const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
          method: 'POST', headers,
          body: JSON.stringify({ operation: 'getSession', sessionToken: stored })
        });
        const result = await res.json();
        if (result.success && result.user) {
          _sessionToken = stored;
          return;
        }
      } catch {}
      // Token invalid — clear it
      await _storage.removeItem('rux_session_token');
    }
    // Create anonymous session only if no valid token
    try {
      const res = await fetch(\`\${API_BASE}/api/proxy/auth\`, {
        method: 'POST', headers,
        body: JSON.stringify({ operation: 'anonymousSession' })
      });
      const result = await res.json();
      if (result.success && result.sessionToken) {
        _sessionToken = result.sessionToken;
        await _storage.setItem('rux_session_token', result.sessionToken);
      }
    } catch (e) {
      console.warn('Failed to init session:', e);
    }
  })();
  await _initPromise;
  _initPromise = null;
  return _sessionToken;
};
// Restore session on module load (does NOT create anon until validated)
initSession();

${services.join("\n")}
`;
}
