import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Plan } from "@/types";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Lazy-initialized rate limiters per plan (created on first use)
const rateLimiterCache = new Map<Plan, Ratelimit>();

function getRateLimiter(plan: Plan): Ratelimit {
  let limiter = rateLimiterCache.get(plan);
  if (!limiter) {
    const limits: Record<Plan, number> = { FREE: 10, PRO: 30, ELITE: 60 };
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limits[plan], "1 m"),
      prefix: `rux:ratelimit:${plan.toLowerCase()}`,
      analytics: true,
    });
    rateLimiterCache.set(plan, limiter);
  }
  return limiter;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

// Rate limits per plan (requests per minute)
const planRateLimits: Record<Plan, number> = {
  FREE: 10,
  PRO: 30,
  ELITE: 60,
};

/**
 * Check rate limit for a user based on their plan
 * This is for request throttling, not credit management
 */
export async function checkPlanRateLimit(
  userId: string,
  plan: Plan,
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(plan);
  const result = await limiter.limit(userId);

  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
    limit: planRateLimits[plan],
  };
}

/**
 * Increment usage counter for a user
 */
export async function incrementUsage(userId: string): Promise<number> {
  const key = `rux:usage:${userId}`;
  const ttl = 24 * 60 * 60; // 24 hours

  const current = await redis.get<number>(key);

  if (current === null) {
    await redis.setex(key, ttl, 1);
    return 1;
  }

  const newCount = await redis.incr(key);
  return newCount;
}

/**
 * Store temporary data in Redis (for preview sessions, etc.)
 */
export async function setTemporaryData(
  key: string,
  data: unknown,
  ttlSeconds: number = 300,
): Promise<void> {
  await redis.setex(`rux:temp:${key}`, ttlSeconds, JSON.stringify(data));
}

/**
 * Get temporary data from Redis
 */
export async function getTemporaryData<T>(key: string): Promise<T | null> {
  const data = await redis.get<string>(`rux:temp:${key}`);
  if (!data) return null;
  return JSON.parse(data) as T;
}

/**
 * Simple IP-based rate limiting for public endpoints (auth, etc.)
 */
export async function checkRateLimit(
  request: Request,
  options: { limit: number; window: number }, // window in milliseconds
): Promise<RateLimitResult> {
  // Get IP address from request
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Namespace by endpoint path so different routes have independent limits
  const url = new URL(request.url);
  const key = `rux:ratelimit:ip:${ip}:${url.pathname}`;
  const windowSeconds = Math.floor(options.window / 1000);

  // Get current count
  const current = (await redis.get<number>(key)) || 0;

  if (current >= options.limit) {
    const ttl = await redis.ttl(key);
    return {
      success: false,
      remaining: 0,
      reset: ttl > 0 ? ttl : windowSeconds,
      limit: options.limit,
    };
  }

  // Increment counter
  if (current === 0) {
    // First request in window
    await redis.setex(key, windowSeconds, 1);
  } else {
    await redis.incr(key);
  }

  return {
    success: true,
    remaining: options.limit - current - 1,
    reset: await redis.ttl(key),
    limit: options.limit,
  };
}

/**
 * Reusable rate limit check for API route handlers.
 * Returns a 429 Response if rate limited, or null if allowed.
 *
 * Usage in a route handler:
 *   const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
 *   if (limited) return limited;
 */
export async function withRateLimit(
  request: Request,
  options: { limit: number; window: number },
): Promise<Response | null> {
  const result = await checkRateLimit(request, options);
  if (!result.success) {
    return new Response(
      JSON.stringify({
        error: "Too many requests",
        retryAfter: result.reset,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(result.reset),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.reset),
        },
      },
    );
  }
  return null;
}

export { redis };
