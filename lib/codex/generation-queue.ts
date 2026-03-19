/**
 * Generation queue with plan-based priority.
 *
 * Uses Upstash Redis sorted sets for serverless-compatible queueing.
 * Lower score = higher priority. Within the same plan tier, FIFO by timestamp.
 *
 * Redis keys:
 *   rux:gen-queue:waiting    — Sorted set of waiting job IDs
 *   rux:gen-queue:slots      — Set of active job IDs
 *   rux:gen-queue:slot:{id}  — TTL sentinel per slot (crash recovery)
 *   rux:gen-queue:meta:{id}  — Hash with job metadata
 */

import { redis } from "@/lib/rate-limit";
import type { Plan } from "@/types";

// ── Configuration ────────────────────────────────────────────────────

const KEYS = {
  waiting: "rux:gen-queue:waiting",
  slots: "rux:gen-queue:slots",
  slot: (id: string) => `rux:gen-queue:slot:${id}`,
  meta: (id: string) => `rux:gen-queue:meta:${id}`,
} as const;

const PRIORITY_WEIGHTS: Record<Plan, number> = {
  ELITE: 1,
  PRO: 5,
  FREE: 10,
};

const MAX_CONCURRENT = Math.max(
  1,
  Number(process.env.GENERATION_MAX_CONCURRENT || 5),
);

const SLOT_TTL_SECONDS = Math.max(
  60,
  Number(process.env.GENERATION_SLOT_TTL || 300),
);

const POLL_INTERVAL_MS = 1000;
const MAX_WAIT_MS = 5 * 60 * 1000;

// ── Score ────────────────────────────────────────────────────────────

function computeScore(plan: Plan): number {
  return PRIORITY_WEIGHTS[plan] * 1e13 + Date.now();
}

// ── Public API ───────────────────────────────────────────────────────

/** Add a job to the waiting queue. */
export async function enqueue(
  jobId: string,
  userId: string,
  plan: Plan,
): Promise<void> {
  const score = computeScore(plan);
  await Promise.all([
    redis.zadd(KEYS.waiting, { score, member: jobId }),
    redis.hset(KEYS.meta(jobId), {
      userId,
      plan,
      enqueuedAt: String(Date.now()),
    }),
  ]);
}

/** Remove a job from the waiting queue (cancel / cleanup). */
export async function dequeue(jobId: string): Promise<void> {
  await Promise.all([
    redis.zrem(KEYS.waiting, jobId),
    redis.del(KEYS.meta(jobId)),
  ]);
}

/**
 * Try to acquire an execution slot for a job.
 *
 * 1. Clean up expired slot TTL keys (crash recovery)
 * 2. Check global concurrency capacity
 * 3. Verify this job is the highest-priority waiter
 * 4. Atomically claim via ZREM (only one caller wins)
 */
export async function tryAcquireSlot(jobId: string): Promise<boolean> {
  await cleanupExpiredSlots();

  const activeCount = await redis.scard(KEYS.slots);
  if (activeCount >= MAX_CONCURRENT) return false;

  const top = (await redis.zrange(KEYS.waiting, 0, 0)) as string[];
  if (!top || top.length === 0 || top[0] !== jobId) return false;

  const removed = await redis.zrem(KEYS.waiting, jobId);
  if (removed === 0) return false;

  await Promise.all([
    redis.sadd(KEYS.slots, jobId),
    redis.setex(KEYS.slot(jobId), SLOT_TTL_SECONDS, "1"),
  ]);
  return true;
}

/** Release an execution slot (completion / error / cancel). */
export async function releaseSlot(jobId: string): Promise<void> {
  await Promise.all([
    redis.srem(KEYS.slots, jobId),
    redis.del(KEYS.slot(jobId)),
    redis.del(KEYS.meta(jobId)),
  ]);
}

/** 1-based queue position. Returns 0 if not in the waiting queue. */
export async function getQueuePosition(jobId: string): Promise<number> {
  const rank = await redis.zrank(KEYS.waiting, jobId);
  return rank === null || rank === undefined ? 0 : rank + 1;
}

/** Total number of jobs waiting. */
export async function getQueueLength(): Promise<number> {
  return redis.zcard(KEYS.waiting);
}

/**
 * Poll for a slot, calling back with queue position for SSE events.
 * Resolves when slot acquired, rejects on timeout or abort.
 */
export async function waitForSlot(
  jobId: string,
  signal?: AbortSignal,
  onQueueUpdate?: (position: number, total: number) => void,
): Promise<void> {
  const deadline = Date.now() + MAX_WAIT_MS;

  while (Date.now() < deadline) {
    if (signal?.aborted) {
      await dequeue(jobId);
      throw new Error("Queue wait aborted");
    }

    const acquired = await tryAcquireSlot(jobId);
    if (acquired) return;

    if (onQueueUpdate) {
      const [position, total] = await Promise.all([
        getQueuePosition(jobId),
        getQueueLength(),
      ]);
      onQueueUpdate(position, total);
    }

    await sleep(POLL_INTERVAL_MS, signal);
  }

  await dequeue(jobId);
  throw new Error("Queue wait timed out — please try again");
}

// ── Internals ────────────────────────────────────────────────────────

async function cleanupExpiredSlots(): Promise<void> {
  const members = (await redis.smembers(KEYS.slots)) as string[];
  if (!members || members.length === 0) return;

  const checks = await Promise.all(
    members.map(async (id) => ({
      id,
      alive: (await redis.exists(KEYS.slot(id))) === 1,
    })),
  );

  const expired = checks.filter((c) => !c.alive);
  if (expired.length > 0) {
    await Promise.all(expired.map((c) => releaseSlot(c.id)));
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (!signal) return;
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error("aborted"));
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}
