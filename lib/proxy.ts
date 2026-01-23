import { createHash, randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { redis } from "@/lib/rate-limit";
import { Ratelimit } from "@upstash/ratelimit";
import {
  type ProxyService,
  ProxyServiceEnum,
  PLAN_CREDITS,
  PLAN_CREDITS_REFRESH,
  SERVICE_CREDIT_COSTS,
} from "@/types/proxy";
import { Plan, PLAN_LIMITS } from "@/types";

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
  services: ProxyService[] = ProxyServiceEnum.options,
): Promise<{ rawKey: string; keyId: string; keyPrefix: string }> {
  // Generate a secure random key
  const rawKey = `rux_${randomBytes(32).toString("hex")}`;
  const keyPrefix = rawKey.substring(0, 12); // "rux_xxxxxxxx"
  const keyHash = hashApiKey(rawKey);

  // Encrypt the raw key for later retrieval (for code injection)
  const { encrypt } = await import("@/lib/encrypt");
  const keyEncrypted = await encrypt(rawKey);

  const supabase = await createClient();
  const { data: apiKey, error } = await supabase
    .from("project_api_keys")
    .insert({
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      key_encrypted: keyEncrypted,
      services,
      project_id: projectId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create API key: ${error.message}`);
  }

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
  apiKey?: any & {
    project: { id: string; userId: string; user: { plan: Plan } };
  };
  error?: string;
}> {
  if (!rawKey || !rawKey.startsWith("rux_")) {
    return { valid: false, error: "Invalid API key format" };
  }

  const keyHash = hashApiKey(rawKey);
  const supabase = await createClient();

  const { data: apiKey, error: fetchError } = await supabase
    .from("project_api_keys")
    .select(
      `
      *,
      project:projects(id, user_id, user:users(plan))
    `,
    )
    .eq("key_hash", keyHash)
    .single();

  if (fetchError || !apiKey) {
    return { valid: false, error: "API key not found" };
  }

  if (!apiKey.active) {
    return { valid: false, error: "API key is disabled" };
  }

  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return { valid: false, error: "API key has expired" };
  }

  // Update last used timestamp (non-blocking - fire and forget)
  void (async () => {
    try {
      await supabase
        .from("project_api_keys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", apiKey.id);
    } catch {} // Ignore errors
  })();

  return {
    valid: true,
    apiKey: {
      ...apiKey,
      project: {
        id: apiKey.project.id,
        userId: apiKey.project.user_id,
        user: { plan: apiKey.project.user.plan },
      },
    },
  };
}

/**
 * Check if an API key has access to a specific service
 */
export function hasServiceAccess(
  apiKeyServices: ProxyService[],
  service: ProxyService,
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
  const supabase = await createClient();

  let { data: credits, error: fetchError } = await supabase
    .from("proxy_credits")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    throw new Error(`Failed to fetch credits: ${fetchError.message}`);
  }

  if (!credits) {
    const now = new Date().toISOString();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { data: newCredits, error: createError } = await supabase
      .from("proxy_credits")
      .insert({
        user_id: userId,
        balance: PLAN_CREDITS[plan],
        monthly_allotment: PLAN_CREDITS[plan],
        period_start: now,
        period_end: periodEnd.toISOString(),
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create credits: ${createError.message}`);
    }

    credits = newCredits;
  }

  // Check if we need to reset for new billing period
  if (new Date(credits.period_end) < new Date()) {
    const now = new Date().toISOString();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { data: updatedCredits, error: updateError } = await supabase
      .from("proxy_credits")
      .update({
        balance: PLAN_CREDITS[plan],
        monthly_allotment: PLAN_CREDITS[plan],
        period_start: now,
        period_end: periodEnd.toISOString(),
        overage_credits: 0,
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update credits: ${updateError.message}`);
    }

    credits = updatedCredits;
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
  const supabase = await createClient();

  const { data: credits, error: fetchError } = await supabase
    .from("proxy_credits")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError || !credits) {
    return { success: false, newBalance: 0, overageUsed: false };
  }

  let overageUsed = false;

  if (credits.balance >= cost) {
    // Deduct from balance
    await supabase
      .from("proxy_credits")
      .update({ balance: credits.balance - cost })
      .eq("user_id", userId);
  } else {
    // Use remaining balance + overage
    const remaining = credits.balance;
    const overage = cost - remaining;

    await supabase
      .from("proxy_credits")
      .update({
        balance: 0,
        overage_credits: credits.overage_credits + overage,
      })
      .eq("user_id", userId);
    overageUsed = true;
  }

  const { data: updated } = await supabase
    .from("proxy_credits")
    .select("*")
    .eq("user_id", userId)
    .single();

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
const proxyRateLimiters: Record<string, Ratelimit> = {
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
  service: ProxyService;
  operation: string;
  creditsUsed: number;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, string | number | boolean | null>;
  requestSize?: number;
  responseSize?: number;
  latencyMs?: number;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("proxy_usage").insert({
    api_key_id: params.apiKeyId,
    project_id: params.projectId,
    user_id: params.userId,
    service: params.service,
    operation: params.operation,
    credits_used: params.creditsUsed,
    success: params.success,
    error_code: params.errorCode,
    metadata: params.metadata,
    request_size: params.requestSize,
    response_size: params.responseSize,
    latency_ms: params.latencyMs,
  });

  if (error) {
    console.error("Failed to log proxy usage:", error);
  }
}

// ============================================
// Proxy Request Handler Utilities
// ============================================

export interface ProxyContext {
  apiKeyId: string;
  projectId: string;
  userId: string;
  plan: Plan;
  services: ProxyService[];
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
