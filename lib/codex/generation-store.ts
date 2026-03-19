/**
 * Database persistence for generation jobs.
 * Stores job state and events for recovery after server restarts.
 */

import { createAdminClient } from "@/lib/supabase/server";

export interface JobRecord {
  id: string;
  user_id: string;
  project_id: string;
  status: "running" | "completed" | "canceled" | "error";
  last_event_id: number;
  created_at: string;
  updated_at: string;
}

export interface JobEventRecord {
  id: string;
  job_id: string;
  event_id: number;
  payload: Record<string, unknown>;
  created_at: string;
}

/**
 * Get a job record from the database.
 */
export async function getJob(jobId: string): Promise<JobRecord> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("generation_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error || !data) {
    throw new Error("Job not found");
  }

  return data as JobRecord;
}

/**
 * Create a new job record.
 */
export async function createJob(
  jobId: string,
  userId: string,
  projectId: string,
): Promise<JobRecord> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("generation_jobs")
    .insert({
      id: jobId,
      user_id: userId,
      project_id: projectId,
      status: "running",
      last_event_id: 0,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create job: ${error.message}`);
  }

  return data as JobRecord;
}

/**
 * Update job status.
 */
export async function updateJobStatus(
  jobId: string,
  status: JobRecord["status"],
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("generation_jobs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  if (error) {
    console.error(`Failed to update job status: ${error.message}`);
  }
}

/**
 * Append an event to a job.
 */
export async function appendJobEvent(
  jobId: string,
  eventId: number,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = createAdminClient();

  // Insert event
  const { error: eventError } = await supabase
    .from("generation_job_events")
    .insert({
      job_id: jobId,
      event_id: eventId,
      payload,
    });

  if (eventError) {
    console.error(`Failed to append job event: ${eventError.message}`);
    return;
  }

  // Update last_event_id on job
  const { error: updateError } = await supabase
    .from("generation_jobs")
    .update({ last_event_id: eventId })
    .eq("id", jobId);

  if (updateError) {
    console.error(`Failed to update last_event_id: ${updateError.message}`);
  }
}

/**
 * Get job events after a given event ID.
 */
export async function getJobEvents(options: {
  jobId: string;
  afterEventId?: number;
}): Promise<JobEventRecord[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("generation_job_events")
    .select("*")
    .eq("job_id", options.jobId)
    .order("event_id", { ascending: true });

  if (options.afterEventId !== undefined) {
    query = query.gt("event_id", options.afterEventId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get job events: ${error.message}`);
  }

  return (data || []) as JobEventRecord[];
}

/**
 * Find a running generation job for a project.
 * Returns null if no running job exists or if the job is stale (>10 min without updates).
 */
export async function getRunningJobForProject(
  projectId: string,
  userId: string,
): Promise<JobRecord | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("generation_jobs")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .eq("status", "running")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  // Treat jobs older than 10 minutes without updates as stale
  const updatedAt = new Date(data.updated_at).getTime();
  const staleThreshold = 10 * 60 * 1000;
  if (Date.now() - updatedAt > staleThreshold) {
    await supabase
      .from("generation_jobs")
      .update({ status: "error", updated_at: new Date().toISOString() })
      .eq("id", data.id);
    return null;
  }

  return data as JobRecord;
}

/**
 * Cleanup old job events from the database.
 */
export async function cleanupJobEvents(
  maxAgeMs: number = 24 * 60 * 60 * 1000,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
    const { error } = await supabase
      .from("generation_job_events")
      .delete()
      .lt("created_at", cutoff);
    if (error) {
      console.error(`Failed to cleanup job events: ${error.message}`);
    }
  } catch (error) {
    console.error("Job event cleanup error:", error);
  }
}

/**
 * Cleanup completed/errored/canceled jobs older than maxAgeMs.
 */
export async function cleanupJobs(
  maxAgeMs: number = 24 * 60 * 60 * 1000,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
    const { error } = await supabase
      .from("generation_jobs")
      .delete()
      .neq("status", "running")
      .lt("updated_at", cutoff);
    if (error) {
      console.error(`Failed to cleanup jobs: ${error.message}`);
    }
  } catch (error) {
    console.error("Job cleanup error:", error);
  }
}
