import { createHash, randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { redis } from "@/lib/rate-limit";
import { Ratelimit } from "@upstash/ratelimit";
import {
  ProxyService,
  PLAN_CREDITS,
  PLAN_CREDITS_REFRESH,
  SERVICE_CREDIT_COSTS,
} from "@/types/proxy";
import { Plan, PLAN_LIMITS } from "@/types";
import { ProxyService as PrismaProxyService } from "@prisma/client";

// ============================================
// API Key Management
// ============================================

/**
 * Generate a new API key for a project
 * Returns the raw key (only shown once) and the key info
 * Also stores encrypted version for injection into generated code
 */
export async function generateApiKey(
  projectId: string,
  name: string = "Default",
  services: PrismaProxyService[] = Object.values(PrismaProxyService),
): Promise<{ rawKey: string; keyId: string; keyPrefix: string }> {
  // Generate a secure random key
  const rawKey = `rux_${randomBytes(32).toString("hex")}`;
  const keyPrefix = rawKey.substring(0, 12); // "rux_xxxxxxxx"
  const keyHash = hashApiKey(rawKey);

  // Encrypt the raw key for later retrieval (for code injection)
  const { encrypt } = await import("@/lib/encrypt");
  const keyEncrypted = await encrypt(rawKey);

  const apiKey = await prisma.projectApiKey.create({
    data: {
      name,
      keyHash,
      keyPrefix,
      keyEncrypted,
      services,
      projectId,
    },
  });

  return {
    rawKey, // Only returned once!
    keyId: apiKey.id,
    keyPrefix,
  };
}

/**
 * Hash an API key for secure storage
 */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Validate an API key and return project/user info
 */
export async function validateApiKey(rawKey: string): Promise<{
  valid: boolean;
  apiKey?: Awaited<ReturnType<typeof prisma.projectApiKey.findUnique>> & {
    project: { id: string; userId: string; user: { plan: Plan } };
  };
  error?: string;
}> {
  if (!rawKey || !rawKey.startsWith("rux_")) {
    return { valid: false, error: "Invalid API key format" };
  }

  const keyHash = hashApiKey(rawKey);

  const apiKey = await prisma.projectApiKey.findUnique({
    where: { keyHash },
    include: {
      project: {
        select: {
          id: true,
          userId: true,
          user: {
            select: { plan: true },
          },
        },
      },
    },
  });

  if (!apiKey) {
    return { valid: false, error: "API key not found" };
  }

  if (!apiKey.active) {
    return { valid: false, error: "API key is disabled" };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: "API key has expired" };
  }

  // Update last used timestamp (non-blocking)
  prisma.projectApiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {}); // Ignore errors

  return {
    valid: true,
    apiKey: apiKey as typeof apiKey & {
      project: { id: string; userId: string; user: { plan: Plan } };
    },
  };
}

/**
 * Check if an API key has access to a specific service
 */
export function hasServiceAccess(
  apiKeyServices: PrismaProxyService[],
  service: PrismaProxyService,
): boolean {
  return apiKeyServices.includes(service);
}

// ============================================
// Credits Management
// ============================================

/**
 * Get or create credits for a user
 */
export async function getOrCreateCredits(userId: string, plan: Plan) {
  let credits = await prisma.proxyCredits.findUnique({
    where: { userId },
  });

  if (!credits) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    credits = await prisma.proxyCredits.create({
      data: {
        userId,
        balance: PLAN_CREDITS[plan],
        monthlyAllotment: PLAN_CREDITS[plan],
        periodStart: now,
        periodEnd,
      },
    });
  }

  // Check if we need to reset for new billing period
  if (credits.periodEnd < new Date()) {
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    credits = await prisma.proxyCredits.update({
      where: { userId },
      data: {
        balance: PLAN_CREDITS[plan],
        monthlyAllotment: PLAN_CREDITS[plan],
        periodStart: now,
        periodEnd,
        overageCredits: 0,
      },
    });
  }

  return credits;
}

/**
 * Check if user has enough credits for an operation
 */
export async function checkCredits(
  userId: string,
  plan: Plan,
  service: ProxyService,
  units: number = 1,
): Promise<{ hasCredits: boolean; required: number; available: number }> {
  const credits = await getOrCreateCredits(userId, plan);
  const cost = SERVICE_CREDIT_COSTS[service] * units;

  return {
    hasCredits: credits.balance >= cost,
    required: cost,
    available: credits.balance,
  };
}

/**
 * Deduct credits for a service operation
 */
export async function deductCredits(
  userId: string,
  service: ProxyService,
  units: number = 1,
): Promise<{ success: boolean; newBalance: number; overageUsed: boolean }> {
  const cost = SERVICE_CREDIT_COSTS[service] * units;

  const credits = await prisma.proxyCredits.findUnique({
    where: { userId },
  });

  if (!credits) {
    return { success: false, newBalance: 0, overageUsed: false };
  }

  let overageUsed = false;

  if (credits.balance >= cost) {
    // Deduct from balance
    await prisma.proxyCredits.update({
      where: { userId },
      data: { balance: { decrement: cost } },
    });
  } else {
    // Use remaining balance + overage
    const remaining = credits.balance;
    const overage = cost - remaining;

    await prisma.proxyCredits.update({
      where: { userId },
      data: {
        balance: 0,
        overageCredits: { increment: overage },
      },
    });
    overageUsed = true;
  }

  const updated = await prisma.proxyCredits.findUnique({
    where: { userId },
  });

  return {
    success: true,
    newBalance: updated?.balance ?? 0,
    overageUsed,
  };
}

// ============================================
// Rate Limiting for Proxy Services
// ============================================

// Default rate limits by service category
const RATE_LIMITS = {
  ai: 60, // AI models: 60 req/min
  image_gen: 20, // Image generation: 20 req/min
  search: 100, // Search APIs: 100 req/min
  media: 30, // Media processing: 30 req/min
  communication: 30, // Email/SMS: 30 req/min
  utility: 100, // Utilities: 100 req/min
  content: 100, // Content APIs: 100 req/min
} as const;

// Create rate limiter for a service
function createRateLimiter(service: string, limit: number): Ratelimit {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, "1 m"),
    prefix: `rux:proxy:${service}`,
  });
}

// Per-service rate limiters
const proxyRateLimiters: Record<ProxyService, Ratelimit> = {
  // AI Models
  xai: createRateLimiter("xai", RATE_LIMITS.ai),
  openai: createRateLimiter("openai", RATE_LIMITS.ai),
  anthropic: createRateLimiter("anthropic", RATE_LIMITS.ai),
  google_ai: createRateLimiter("google_ai", RATE_LIMITS.ai),
  groq: createRateLimiter("groq", RATE_LIMITS.ai),
  cohere: createRateLimiter("cohere", RATE_LIMITS.ai),
  mistral: createRateLimiter("mistral", RATE_LIMITS.ai),
  perplexity: createRateLimiter("perplexity", RATE_LIMITS.ai),

  // Image Generation
  dall_e: createRateLimiter("dall_e", RATE_LIMITS.image_gen),
  stable_diffusion: createRateLimiter(
    "stable_diffusion",
    RATE_LIMITS.image_gen,
  ),
  midjourney: createRateLimiter("midjourney", RATE_LIMITS.image_gen),
  flux: createRateLimiter("flux", RATE_LIMITS.image_gen),

  // Search & Data
  google_search: createRateLimiter("google_search", RATE_LIMITS.search),
  image_search: createRateLimiter("image_search", RATE_LIMITS.search),
  places: createRateLimiter("places", RATE_LIMITS.search),
  maps: createRateLimiter("maps", RATE_LIMITS.search),
  serp: createRateLimiter("serp", RATE_LIMITS.search),

  // Media Processing
  transcribe: createRateLimiter("transcribe", RATE_LIMITS.media),
  tts: createRateLimiter("tts", RATE_LIMITS.media),
  video: createRateLimiter("video", RATE_LIMITS.media),
  pdf: createRateLimiter("pdf", RATE_LIMITS.media),
  ocr: createRateLimiter("ocr", RATE_LIMITS.media),

  // Communication
  email: createRateLimiter("email", RATE_LIMITS.communication),
  sms: createRateLimiter("sms", 20), // Lower limit for SMS
  push: createRateLimiter("push", 50),
  whatsapp: createRateLimiter("whatsapp", RATE_LIMITS.communication),

  // Data & Utilities
  storage: createRateLimiter("storage", RATE_LIMITS.utility),
  database: createRateLimiter("database", RATE_LIMITS.utility),
  app_auth: createRateLimiter("app_auth", 60), // 60 auth requests/min
  analytics: createRateLimiter("analytics", RATE_LIMITS.utility),
  qr_code: createRateLimiter("qr_code", RATE_LIMITS.utility),
  weather: createRateLimiter("weather", RATE_LIMITS.utility),
  translate: createRateLimiter("translate", RATE_LIMITS.utility),
  currency: createRateLimiter("currency", RATE_LIMITS.utility),

  // Validation
  email_validate: createRateLimiter("email_validate", RATE_LIMITS.utility),
  phone_validate: createRateLimiter("phone_validate", RATE_LIMITS.utility),
  domain_whois: createRateLimiter("domain_whois", RATE_LIMITS.utility),

  // Content APIs
  news: createRateLimiter("news", RATE_LIMITS.content),
  stocks: createRateLimiter("stocks", RATE_LIMITS.content),
  crypto: createRateLimiter("crypto", RATE_LIMITS.content),
  movies: createRateLimiter("movies", RATE_LIMITS.content),
  books: createRateLimiter("books", RATE_LIMITS.content),
  sports: createRateLimiter("sports", RATE_LIMITS.content),
};

/**
 * Check rate limit for a proxy service
 */
export async function checkProxyRateLimit(
  projectId: string,
  service: ProxyService,
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const limiter = proxyRateLimiters[service];
  const result = await limiter.limit(projectId);

  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  };
}

// ============================================
// Usage Logging
// ============================================

/**
 * Log a proxy usage event
 */
export async function logProxyUsage(params: {
  apiKeyId: string;
  projectId: string;
  userId: string;
  service: PrismaProxyService;
  operation: string;
  creditsUsed: number;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, string | number | boolean | null>;
  requestSize?: number;
  responseSize?: number;
  latencyMs?: number;
}): Promise<void> {
  await prisma.proxyUsage.create({
    data: {
      apiKeyId: params.apiKeyId,
      projectId: params.projectId,
      userId: params.userId,
      service: params.service,
      operation: params.operation,
      creditsUsed: params.creditsUsed,
      success: params.success,
      errorCode: params.errorCode,
      metadata: params.metadata,
      requestSize: params.requestSize,
      responseSize: params.responseSize,
      latencyMs: params.latencyMs,
    },
  });
}

// ============================================
// Proxy Request Handler Utilities
// ============================================

export interface ProxyContext {
  apiKeyId: string;
  projectId: string;
  userId: string;
  plan: Plan;
  services: PrismaProxyService[];
}

/**
 * Extract and validate proxy authentication from request headers
 */
export async function extractProxyAuth(
  headers: Headers,
): Promise<{ valid: boolean; context?: ProxyContext; error?: string }> {
  const apiKey =
    headers.get("x-rux-api-key") ||
    headers.get("authorization")?.replace("Bearer ", "");

  if (!apiKey) {
    return { valid: false, error: "Missing API key" };
  }

  const validation = await validateApiKey(apiKey);

  if (!validation.valid || !validation.apiKey) {
    return { valid: false, error: validation.error };
  }

  return {
    valid: true,
    context: {
      apiKeyId: validation.apiKey.id,
      projectId: validation.apiKey.project.id,
      userId: validation.apiKey.project.userId,
      plan: validation.apiKey.project.user.plan as Plan,
      services: validation.apiKey.services,
    },
  };
}

// CORS headers for proxy endpoints (needed for Expo Snack web player)
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-RUX-API-Key, Authorization",
};

/**
 * Create a standardized error response for proxy endpoints
 */
export function proxyError(
  message: string,
  code: string,
  status: number = 400,
): Response {
  return new Response(
    JSON.stringify({
      error: { message, code },
    }),
    {
      status,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    },
  );
}

/**
 * Create a standardized success response for proxy endpoints
 */
export function proxySuccess<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

/**
 * Handle CORS preflight OPTIONS request
 */
export function proxyCorsOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
