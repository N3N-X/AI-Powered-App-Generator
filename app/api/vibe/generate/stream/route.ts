/**
 * Generation stream endpoint — reattach to an existing job.
 */

import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { getGenerationJob, subscribeToJob } from "@/lib/codex/generation-jobs";
import { getJob, getJobEvents } from "@/lib/codex/generation-store";
import type { SSEUpdate } from "../schema";

export async function GET(request: NextRequest) {
  const { uid } = await getAuthenticatedUser(request);
  if (!uid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");
  const afterEventId = url.searchParams.get("afterEventId");
  const afterId =
    afterEventId && Number.isFinite(Number(afterEventId))
      ? Number(afterEventId)
      : undefined;
  if (!jobId) {
    return new Response(JSON.stringify({ error: "Missing jobId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let dbJob;
  try {
    dbJob = await getJob(jobId);
  } catch {
    return new Response(JSON.stringify({ error: "Job not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (dbJob.user_id !== uid) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const job = getGenerationJob(jobId);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (update: SSEUpdate) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(update)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {}
      };

      try {
        const backlog = await getJobEvents({
          jobId,
          afterEventId: afterId,
        });
        backlog.forEach((event) => send(event.payload as SSEUpdate));
      } catch {
        // ignore backlog errors
      }

      if (job) {
        const unsubscribe = subscribeToJob(job, (update) => {
          send(update);
          if (
            update.type === "complete" ||
            update.type === "error" ||
            update.type === "canceled"
          ) {
            close();
          }
        });
        request.signal?.addEventListener("abort", () => {
          unsubscribe();
          close();
        });
        if (job.status !== "running") {
          unsubscribe();
          close();
        }
        return;
      }

      // No in-memory job (server restart or another instance). Poll DB.
      let lastEventId = afterId ?? dbJob.last_event_id ?? 0;
      const poll = async () => {
        if (closed) return;
        try {
          const events = await getJobEvents({
            jobId,
            afterEventId: lastEventId,
          });
          for (const event of events) {
            const payload = event.payload as SSEUpdate & { eventId?: number };
            send(payload);
            lastEventId = Math.max(lastEventId, event.event_id);
            if (
              payload.type === "complete" ||
              payload.type === "error" ||
              payload.type === "canceled"
            ) {
              close();
              return;
            }
          }

          const latest = await getJob(jobId);
          if (latest.status !== "running") {
            close();
            return;
          }
        } catch {
          close();
          return;
        }
      };

      await poll();
      const interval = setInterval(poll, 1000);
      request.signal?.addEventListener("abort", () => {
        clearInterval(interval);
        close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
