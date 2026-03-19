/**
 * Cancel an active generation job.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { cancelJob, getGenerationJob } from "@/lib/codex/generation-jobs";
import { appendJobEvent, updateJobStatus } from "@/lib/codex/generation-store";
import { dequeue, releaseSlot } from "@/lib/codex/generation-queue";

const RequestSchema = z.object({
  jobId: z.string(),
});

export async function POST(request: NextRequest) {
  const { uid } = await getAuthenticatedUser(request);
  if (!uid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Missing jobId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const job = getGenerationJob(parsed.data.jobId);
  if (!job) {
    return new Response(JSON.stringify({ error: "Job not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (job.userId !== uid) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = cancelJob(job);
  if (payload) {
    await appendJobEvent(job.id, payload.eventId, payload);
  }
  await dequeue(job.id);
  await releaseSlot(job.id);
  await updateJobStatus(job.id, "canceled");

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
