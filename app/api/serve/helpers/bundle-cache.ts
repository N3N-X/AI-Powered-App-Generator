/**
 * Two-layer cache for esbuild bundles: in-memory LRU + Upstash Redis.
 */

import { createHash } from "crypto";
import { redis } from "@/lib/rate-limit";

const REDIS_PREFIX = "rux:serve:bundle:";
const REDIS_TTL = 24 * 60 * 60; // 24 hours
const MAX_MEMORY_ENTRIES = 100;

/** In-memory LRU cache. Entries are evicted when capacity is exceeded. */
const memoryCache = new Map<string, string>();

function evictIfNeeded(): void {
  if (memoryCache.size <= MAX_MEMORY_ENTRIES) return;
  // Delete oldest entry (first key in insertion order)
  const firstKey = memoryCache.keys().next().value;
  if (firstKey) memoryCache.delete(firstKey);
}

/** Compute a stable cache key from code files. */
export function computeCacheKey(codeFiles: Record<string, string>): string {
  const hash = createHash("sha256");
  hash.update(JSON.stringify(codeFiles));
  return hash.digest("hex");
}

/** Try to retrieve a cached bundle. Checks memory first, then Redis. */
export async function getCachedBundle(
  codeFiles: Record<string, string>,
): Promise<string | null> {
  const key = computeCacheKey(codeFiles);

  // Check memory cache
  const memResult = memoryCache.get(key);
  if (memResult) {
    // Move to end (most recently used)
    memoryCache.delete(key);
    memoryCache.set(key, memResult);
    return memResult;
  }

  // Check Redis
  try {
    const redisResult = await redis.get<string>(`${REDIS_PREFIX}${key}`);
    if (redisResult) {
      // Promote to memory cache
      memoryCache.set(key, redisResult);
      evictIfNeeded();
      return redisResult;
    }
  } catch (err) {
    console.warn("[serve] Redis cache read failed:", err);
  }

  return null;
}

/** Store a bundle in both memory and Redis caches. */
export async function setCachedBundle(
  codeFiles: Record<string, string>,
  js: string,
): Promise<void> {
  const key = computeCacheKey(codeFiles);

  // Store in memory
  memoryCache.set(key, js);
  evictIfNeeded();

  // Store in Redis (fire-and-forget, don't block response)
  try {
    await redis.setex(`${REDIS_PREFIX}${key}`, REDIS_TTL, js);
  } catch (err) {
    console.warn("[serve] Redis cache write failed:", err);
  }
}
