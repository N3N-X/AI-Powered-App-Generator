/**
 * Dev/local hosts that should be treated as localhost
 * (not production rulxy.com). Add ngrok tunnels, etc. here.
 */
const DEV_HOSTS = ["localhost", "127.0.0.1", "dev.rulxy.com", "dev.nonxy.com"];

// Also treat the NEXT_PUBLIC_APP_URL hostname as dev if it's not a production domain
const appUrlHost = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_APP_URL;
    if (!url) return null;
    const hostname = new URL(url).hostname;
    if (hostname === "rulxy.com" || hostname === "www.rulxy.com") return null;
    return hostname;
  } catch {
    return null;
  }
})();

/**
 * Check if a hostname (or host:port) is a dev/local environment
 * Works with both server-side host headers and client-side window.location.hostname
 */
export function isDevHost(host: string): boolean {
  const hostname = host.split(":")[0].toLowerCase();
  if (
    appUrlHost &&
    (hostname === appUrlHost || hostname.endsWith(`.${appUrlHost}`))
  ) {
    return true;
  }
  return DEV_HOSTS.some(
    (dev) => hostname === dev || hostname.endsWith(`.${dev}`),
  );
}

/**
 * Generate a URL-safe slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a random ID
 */
export function generateId(length: number = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if code contains potentially dangerous patterns
 */
export function sanitizeGeneratedCode(code: string): string {
  // Remove any potentially dangerous patterns
  const dangerous = [
    /eval\s*\(/g,
    /Function\s*\(/g,
    /document\.write/g,
    /innerHTML\s*=/g,
    /__dirname/g,
    /__filename/g,
    /require\s*\(\s*['"`]child_process/g,
    /require\s*\(\s*['"`]fs/g,
    /process\.env/g,
  ];

  let sanitized = code;
  for (const pattern of dangerous) {
    sanitized = sanitized.replace(pattern, "/* [REMOVED FOR SAFETY] */");
  }

  return sanitized;
}

/**
 * Validate that a string is valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}
