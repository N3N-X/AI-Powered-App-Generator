/**
 * Random subdomain generator
 * Generates memorable, URL-friendly subdomains like: happy-panda-42
 */

import { adjectives, nouns } from "./subdomain-words";

/**
 * Generate a random subdomain like "happy-panda-42"
 */
export function generateRandomSubdomain(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 100);

  return `${adjective}-${noun}-${number}`;
}

/**
 * Generate a subdomain from project name, fallback to random if taken
 */
export function generateSubdomainFromName(name: string): string {
  // Clean the name: lowercase, replace spaces/special chars with hyphens
  const subdomain = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  // If name is too short or empty, use random
  if (subdomain.length < 3) {
    return generateRandomSubdomain();
  }

  // Add random suffix to ensure uniqueness
  const suffix = Math.floor(Math.random() * 1000);
  return `${subdomain}-${suffix}`;
}

/**
 * Check if subdomain format is valid
 */
export function isValidSubdomain(subdomain: string): boolean {
  // 3-63 chars, lowercase alphanumeric and hyphens, can't start/end with hyphen
  const regex = /^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/;
  return (
    regex.test(subdomain) && subdomain.length >= 3 && subdomain.length <= 63
  );
}

/**
 * Reserved subdomains that cannot be used
 */
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "app",
  "admin",
  "dashboard",
  "mail",
  "email",
  "smtp",
  "pop",
  "imap",
  "ftp",
  "ssh",
  "help",
  "support",
  "docs",
  "doc",
  "blog",
  "status",
  "cdn",
  "static",
  "assets",
  "media",
  "images",
  "img",
  "dev",
  "staging",
  "prod",
  "production",
  "test",
  "testing",
  "demo",
  "beta",
  "alpha",
  "preview",
  "sandbox",
  "ns1",
  "ns2",
  "ns3",
  "ns4",
  "dns",
  "mx",
  "webmail",
  "cpanel",
  "whm",
  "plesk",
  "root",
  "admin",
  "administrator",
  "hostmaster",
  "postmaster",
  "webmaster",
  "info",
  "contact",
  "about",
  "news",
  "shop",
  "store",
  "account",
  "accounts",
  "billing",
  "payment",
  "payments",
  "checkout",
  "cart",
  "order",
  "orders",
  "auth",
  "login",
  "logout",
  "signin",
  "signout",
  "signup",
  "register",
  "password",
  "reset",
  "verify",
  "confirm",
  "oauth",
  "sso",
  "saml",
  "webhook",
  "webhooks",
  "callback",
  "graphql",
  "rest",
  "v1",
  "v2",
  "v3",
  "internal",
]);
