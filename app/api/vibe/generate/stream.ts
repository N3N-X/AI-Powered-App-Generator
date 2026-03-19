import { NextRequest } from "next/server";
import { runCodexGeneration } from "@/lib/codex/generate";
import { CodexRateLimitError } from "@/lib/codex/error-utils";
import { runCompletion } from "./completion";
import type { SSEUpdate } from "./schema";
import type { GenerationContext } from "./build-context";
import {
  appendJobEvent,
  cleanupJobEvents,
  cleanupJobs,
  updateJobStatus,
} from "@/lib/codex/generation-store";
import {
  broadcastToJob,
  completeJob,
  errorJob,
  cleanupOldJobs,
} from "@/lib/codex/generation-jobs";
import type { GenerationJob } from "@/lib/codex/generation-jobs";
import { refundGenerationCredits } from "./credits";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  waitForSlot,
  dequeue,
  releaseSlot,
} from "@/lib/codex/generation-queue";
import type { Plan } from "@/types";

interface GenerationStreamParams {
  request: NextRequest;
  jobId: string;
  job: GenerationJob;
  supabase: SupabaseClient;
  user: { id: string };
  project: {
    id: string;
    name: string;
    slug: string;
    app_spec?: Record<string, unknown> | null;
  };
  ctx: GenerationContext;
  prompt: string;
  projectId: string;
  creditCost: number;
  creditsReserved: boolean;
  nextEventId: () => number;
  plan: Plan;
}

export function createGenerationStream(params: GenerationStreamParams): {
  stream: ReadableStream;
  abortController: AbortController;
} {
  const {
    request,
    jobId,
    job,
    supabase,
    user,
    project,
    ctx,
    prompt,
    projectId,
    creditCost,
    nextEventId,
  } = params;
  let creditsReserved = params.creditsReserved;

  const encoder = new TextEncoder();
  const abortController = new AbortController();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      abortController.signal.addEventListener("abort", () => close());
      request.signal?.addEventListener("abort", () => close());

      const refundIfReserved = async () => {
        if (!creditsReserved) return;
        creditsReserved = false;
        await refundGenerationCredits(
          supabase,
          user.id,
          creditCost,
          jobId,
          nextEventId,
        );
      };

      const send = (update: SSEUpdate) => {
        if (closed || abortController.signal.aborted) return;
        try {
          const payload = {
            ...update,
            eventId: nextEventId(),
          };
          safeEnqueue(`data: ${JSON.stringify(payload)}\n\n`);
          broadcastToJob(job, payload);
          void appendJobEvent(jobId, payload.eventId, payload);
        } catch {
          closed = true;
        }
      };

      const safeEnqueue = (data: string) => {
        if (closed || abortController.signal.aborted) return false;
        try {
          controller.enqueue(encoder.encode(data));
          return true;
        } catch {
          closed = true;
          return false;
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
        send({ type: "job", jobId });

        // ── Wait for queue slot ──────────────────────────────────────
        try {
          await waitForSlot(
            jobId,
            abortController.signal,
            (position, total) => {
              send({
                type: "queue",
                position,
                total,
                message:
                  position === 1
                    ? "You're next! Starting soon..."
                    : `You are #${position} in queue (${total} waiting)`,
              });
            },
          );
          send({
            type: "queue",
            position: 0,
            message: "Slot acquired — starting generation...",
          });
        } catch (queueError) {
          send({
            type: "error",
            phase: "error",
            error:
              queueError instanceof Error ? queueError.message : "Queue error",
          });
          safeEnqueue("data: [DONE]\n\n");
          errorJob(
            job,
            queueError instanceof Error ? queueError.message : "Queue error",
          );
          await refundIfReserved();
          await updateJobStatus(jobId, "error");
          close();
          return;
        }

        const result = await runCodexGeneration(
          {
            projectId,
            prompt,
            platform: ctx.platform,
            apiBaseUrl: ctx.apiBaseUrl,
            existingCode: ctx.existingCode,
            chatHistory: ctx.fullChatHistory,
            appSpec: (project.app_spec as Record<string, unknown>) || null,
            projectName: project.name,
          },
          send,
          abortController.signal,
        );

        if (!result) {
          if (abortController.signal.aborted) {
            job.status = "canceled";
            send({ type: "canceled" });
            send({ type: "done" });
            await dequeue(jobId);
            await releaseSlot(jobId);
            await refundIfReserved();
            await updateJobStatus(jobId, "canceled");
            void cleanupJobEvents();
            void cleanupJobs();
            cleanupOldJobs();
            close();
            return;
          }
          send({
            type: "error",
            phase: "error",
            error: "Failed to generate code — no files produced",
          });
          send({ type: "done" });
          errorJob(job, "No files produced");
          await releaseSlot(jobId);
          await refundIfReserved();
          await updateJobStatus(jobId, "error");
          void cleanupJobEvents();
          void cleanupJobs();
          cleanupOldJobs();
          close();
          return;
        }

        await runCompletion({
          finalFiles: result.finalFiles,
          changedFiles: result.newFiles,
          changedFileCount: Object.keys(result.newFiles).length,
          createdFileCount: result.createdFiles.length,
          platform: ctx.platform,
          apiBaseUrl: ctx.apiBaseUrl,
          fullChatHistory: ctx.fullChatHistory,
          projectId,
          userId: user.id,
          prompt,
          projectName: project.name,
          projectSlug: project.slug,
          appSpec: project.app_spec as Record<string, unknown> | null,
          send,
        });

        safeEnqueue("data: [DONE]\n\n");
        completeJob(job);
        await releaseSlot(jobId);
        await updateJobStatus(jobId, "completed");
        await appendJobEvent(jobId, nextEventId(), {
          type: "credits.finalized",
          amount: creditCost,
        });
        creditsReserved = false;
        void cleanupJobEvents();
        void cleanupJobs();
        cleanupOldJobs();
      } catch (error) {
        console.error("[Generate] Error:", error);
        await dequeue(jobId);
        await releaseSlot(jobId);
        if (abortController.signal.aborted) {
          job.status = "canceled";
          send({ type: "canceled" });
          safeEnqueue("data: [DONE]\n\n");
          await refundIfReserved();
          await updateJobStatus(jobId, "canceled");
          void cleanupJobEvents();
          void cleanupJobs();
          cleanupOldJobs();
          close();
          return;
        }
        send({
          type: "error",
          phase: "error",
          error: error instanceof Error ? error.message : "Generation failed",
          errorType:
            error instanceof CodexRateLimitError ? "rate_limit" : "unknown",
          retryAfterMs:
            error instanceof CodexRateLimitError
              ? error.retryAfterMs
              : undefined,
        });
        safeEnqueue("data: [DONE]\n\n");
        errorJob(
          job,
          error instanceof Error ? error.message : "Generation failed",
        );
        await refundIfReserved();
        await updateJobStatus(jobId, "error");
        void cleanupJobEvents();
        void cleanupJobs();
        cleanupOldJobs();
      }

      close();
    },
    cancel() {
      // Client disconnected — keep job running for possible reattach.
    },
  });

  return { stream, abortController };
}
