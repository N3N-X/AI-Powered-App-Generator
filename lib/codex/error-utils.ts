export type RateLimitInfo = {
  isRateLimit: boolean;
  isQuota: boolean;
  retryAfterMs?: number;
  rawMessage: string;
};

const RATE_LIMIT_PATTERNS = [
  /rate limit/i,
  /too many requests/i,
  /tokens per min/i,
  /tpm/i,
  /429/i,
];

const RETRY_SECONDS_PATTERNS = [
  /try again in\s+([0-9.]+)\s*s/i,
  /retry in\s+([0-9.]+)\s*s/i,
  /in\s+([0-9.]+)\s*s/i,
];

const RETRY_MS_PATTERNS = [/in\s+([0-9.]+)\s*ms/i];
const QUOTA_PATTERNS = [
  /quota exceeded/i,
  /insufficient_quota/i,
  /billing/i,
  /plan and billing/i,
  /exceeded your current quota/i,
];
const TRANSIENT_PATTERNS = [/stream disconnected/i];

export class CodexRateLimitError extends Error {
  code = "rate_limit";
  retryAfterMs?: number;
  rawMessage?: string;

  constructor(message: string, retryAfterMs?: number, rawMessage?: string) {
    super(message);
    this.name = "CodexRateLimitError";
    this.retryAfterMs = retryAfterMs;
    this.rawMessage = rawMessage;
  }
}

export function parseRetryAfterMs(message: string): number | undefined {
  for (const pattern of RETRY_SECONDS_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const seconds = Number(match[1]);
      if (!Number.isNaN(seconds)) return Math.ceil(seconds * 1000);
    }
  }
  for (const pattern of RETRY_MS_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const ms = Number(match[1]);
      if (!Number.isNaN(ms)) return Math.ceil(ms);
    }
  }
  return undefined;
}

export function getRateLimitInfo(message: string): RateLimitInfo {
  const isRateLimit = RATE_LIMIT_PATTERNS.some((pattern) =>
    pattern.test(message),
  );
  return {
    isRateLimit,
    isQuota: isQuotaExceeded(message),
    retryAfterMs: isRateLimit ? parseRetryAfterMs(message) : undefined,
    rawMessage: message,
  };
}

export function isQuotaExceeded(message: string): boolean {
  return QUOTA_PATTERNS.some((pattern) => pattern.test(message));
}

export function isTransientProviderError(message: string): boolean {
  return TRANSIENT_PATTERNS.some((pattern) => pattern.test(message));
}

export function formatRateLimitMessage(retryAfterMs?: number): string {
  if (!retryAfterMs) {
    return "We’re at capacity. Retrying shortly…";
  }
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return `We’re at capacity. Retrying in ${seconds}s…`;
}

export function normalizeGenerationErrorMessage(message: string): string {
  if (!message) return "Generation failed. Please try again.";
  const info = getRateLimitInfo(message);
  if (info.isRateLimit || info.isQuota) {
    return formatRateLimitMessage(info.retryAfterMs);
  }
  if (isTransientProviderError(message)) {
    return "We’re at capacity. Retrying shortly…";
  }
  if (message.toLowerCase().includes("stream disconnected")) {
    return "Connection hiccup. Please try again.";
  }
  if (message.toLowerCase().includes("reconnecting")) {
    return "Temporary connection issue. Please try again.";
  }
  return message;
}
