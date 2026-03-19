/**
 * In-memory generation job management.
 * Handles active generation jobs and their subscriptions.
 */

import type { SSEUpdate } from "@/app/api/vibe/generate/schema";

export interface GenerationJob {
  id: string;
  userId: string;
  status: "running" | "completed" | "canceled" | "error";
  createdAt: Date;
  abortController?: AbortController;
  subscribers: Set<(update: SSEUpdate) => void>;
}

// In-memory store for active jobs
const activeJobs = new Map<string, GenerationJob>();

/**
 * Create a new generation job.
 */
export function createGenerationJob(
  jobId: string,
  userId: string,
): GenerationJob {
  const job: GenerationJob = {
    id: jobId,
    userId,
    status: "running",
    createdAt: new Date(),
    abortController: new AbortController(),
    subscribers: new Set(),
  };
  activeJobs.set(jobId, job);
  return job;
}

/**
 * Get an existing generation job by ID.
 */
export function getGenerationJob(jobId: string): GenerationJob | undefined {
  return activeJobs.get(jobId);
}

/**
 * Subscribe to job updates.
 * Returns an unsubscribe function.
 */
export function subscribeToJob(
  job: GenerationJob,
  callback: (update: SSEUpdate) => void,
): () => void {
  job.subscribers.add(callback);
  return () => {
    job.subscribers.delete(callback);
  };
}

/**
 * Broadcast an update to all job subscribers.
 */
export function broadcastToJob(job: GenerationJob, update: SSEUpdate): void {
  for (const subscriber of job.subscribers) {
    try {
      subscriber(update);
    } catch {
      // Ignore subscriber errors
    }
  }
}

/**
 * Cancel a running job.
 * Returns the cancel event payload if job was running.
 */
export function cancelJob(
  job: GenerationJob,
): { eventId: number; type: "canceled" } | null {
  if (job.status !== "running") {
    return null;
  }

  job.status = "canceled";
  job.abortController?.abort();

  const payload = { eventId: Date.now(), type: "canceled" as const };
  broadcastToJob(job, payload);

  return payload;
}

/**
 * Mark a job as completed.
 */
export function completeJob(job: GenerationJob): void {
  job.status = "completed";
  activeJobs.delete(job.id);
}

/**
 * Mark a job as errored.
 */
export function errorJob(job: GenerationJob, error: string): void {
  job.status = "error";
  broadcastToJob(job, { type: "error", message: error });
  activeJobs.delete(job.id);
}

/**
 * Clean up old jobs (call periodically).
 */
export function cleanupOldJobs(maxAgeMs: number = 30 * 60 * 1000): void {
  const now = Date.now();
  for (const [id, job] of activeJobs) {
    if (now - job.createdAt.getTime() > maxAgeMs) {
      activeJobs.delete(id);
    }
  }
}
