import { redis } from "@/lib/rate-limit";
import { Ratelimit } from "@upstash/ratelimit";
import { ProxyService } from "@/types/proxy";

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
  auth: createRateLimiter("auth", 60),
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
