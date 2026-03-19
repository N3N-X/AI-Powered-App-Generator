/**
 * Security utilities: host validation, security headers, rate limiting, constants.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiter for serve endpoint - prevents abuse
const redis = Redis.fromEnv();
export const serveRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute per subdomain
  prefix: "rux:serve:ratelimit",
  analytics: true,
});

// Allowed hosts for production (prevents host header injection)
const ALLOWED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "rulxy.com",
  ".rulxy.com", // Allows *.rulxy.com subdomains
];

// Validate subdomain format to prevent injection
export const SUBDOMAIN_REGEX = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

/**
 * Validate host header to prevent host header injection attacks
 */
export function isValidHost(host: string): boolean {
  const hostWithoutPort = host.split(":")[0].toLowerCase();

  // Check exact matches and suffix matches
  for (const allowed of ALLOWED_HOSTS) {
    if (allowed.startsWith(".")) {
      // Suffix match (e.g., .rulxy.com matches anything.rulxy.com)
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

  // For custom domains, allow through — verified against the database in main logic
  // Only allow if the host looks like a valid domain (not an IP or garbage)
  const domainRegex = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/;
  return domainRegex.test(hostWithoutPort);
}

/**
 * Generate security headers for served content
 * @param _isCustomDomain - Reserved for future custom domain specific headers
 */
export function getSecurityHeaders(
  _isCustomDomain: boolean,
): Record<string, string> {
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
    // Content Security Policy — esbuild-bundled output, no eval needed
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://unpkg.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
      "connect-src 'self' https://*.rulxy.space https://*.rulxy.com https://*.nonxy.com http://localhost:*",
      "frame-ancestors 'self' https://rulxy.com https://*.rulxy.com http://localhost:* https://*.nonxy.com",
    ].join("; "),
    // Cache for performance
    "Cache-Control":
      "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
  };
}
