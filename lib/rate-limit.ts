import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { Plan, PLAN_LIMITS } from "@/types";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiters for different plans (requests per minute to prevent abuse)
// Credits are handled separately in the database
const rateLimiters: Record<Plan, Ratelimit> = {
  FREE: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
    prefix: "rux:ratelimit:free",
    analytics: true,
  }),
  PRO: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 requests per minute
    prefix: "rux:ratelimit:pro",
    analytics: true,
  }),
  ELITE: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute
    prefix: "rux:ratelimit:elite",
    analytics: true,
  }),
};

// API endpoint rate limiters (per minute)
const apiRateLimiters = {
  generate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "rux:api:generate",
  }),
  build: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "rux:api:build",
  }),
  github: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    prefix: "rux:api:github",
  }),
};

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
  const limiter = rateLimiters[plan];
  const result = await limiter.limit(userId);

  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
    limit: planRateLimits[plan],
  };
}

/**
 * Check rate limit for specific API endpoints
 */
export async function checkApiRateLimit(
  identifier: string,
  endpoint: keyof typeof apiRateLimiters,
): Promise<RateLimitResult> {
  const limiter = apiRateLimiters[endpoint];
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
    limit: result.limit,
  };
}

/**
 * Get current rate limit usage for a user (requests per minute)
 * For credits usage, check the database directly
 */
export async function getCurrentUsage(
  userId: string,
  plan: Plan,
): Promise<{ used: number; limit: number; resetAt: Date }> {
  const key = `rux:usage:${userId}`;

  const [used, resetTime] = await Promise.all([
    redis.get<number>(key) ?? 0,
    redis.ttl(key),
  ]);

  const limit = planRateLimits[plan];
  const resetAt = new Date(Date.now() + (resetTime > 0 ? resetTime * 1000 : 0));

  return {
    used: used || 0,
    limit,
    resetAt,
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
 * Check if user is in priority queue (Pro/Elite)
 */
export async function checkPriorityQueue(
  userId: string,
  plan: Plan,
): Promise<boolean> {
  if (!PLAN_LIMITS[plan].priorityQueue) {
    return false;
  }

  // Priority users get faster processing
  const priorityKey = `rux:priority:${userId}`;
  await redis.setex(priorityKey, 60, "1"); // 1 minute priority window

  return true;
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
 * Queue management for builds
 */
export async function addToBuildQueue(
  buildId: string,
  priority: boolean,
): Promise<number> {
  const queue = priority ? "rux:builds:priority" : "rux:builds:standard";
  return await redis.rpush(queue, buildId);
}

export async function getNextBuild(): Promise<string | null> {
  // Check priority queue first
  const buildId = await redis.lpop<string>("rux:builds:priority");
  if (buildId) return buildId;

  // Then standard queue
  return await redis.lpop<string>("rux:builds:standard");
}

export { redis };
