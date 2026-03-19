/**
 * Code Generation Endpoint — delegates to Codex SDK agent.
 *
 * Flow: Auth → Credits → Rate limit → Build context → Codex generation → Save to DB
 */

import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkPlanRateLimit } from "@/lib/rate-limit";
import { Plan, CREDIT_COSTS } from "@/types";
import { buildGenerationContext } from "./build-context";
import { createJob, updateJobStatus } from "@/lib/codex/generation-store";
import { createGenerationJob } from "@/lib/codex/generation-jobs";
import { randomUUID } from "crypto";
import { jsonError } from "./http";
import { createGenerationStream } from "./stream";
import { reserveGenerationCredits, refundGenerationCredits } from "./credits";
import { enqueue, dequeue, releaseSlot } from "@/lib/codex/generation-queue";

// ── Request Schema ───────────────────────────────────────────────────

const RequestSchema = z.object({
  projectId: z.string(),
  prompt: z.string().min(1),
  chatHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
});

// ── POST Handler ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let jobId: string | undefined;
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const data = RequestSchema.parse(body);
    const supabase = await createClient();
    let creditsReserved = false;

    // ── Fetch user + project ─────────────────────────────────────────

    const [userResult, projectResult] = await Promise.all([
      supabase
        .from("users")
        .select("id, credits, plan, total_credits_used")
        .eq("id", uid)
        .single(),
      supabase
        .from("projects")
        .select("id, name, slug, platform, code_files, chat_history, app_spec")
        .eq("id", data.projectId)
        .single(),
    ]);

    const user = userResult.data;
    const project = projectResult.data;

    if (!user) {
      return jsonError("User not found", 404);
    }
    if (!project) {
      return jsonError("Project not found", 404);
    }

    // ── Rate limit & credit reservation ─────────────────────────────

    const creditCost = CREDIT_COSTS.codeGeneration;

    const rateLimit = await checkPlanRateLimit(user.id, user.plan as Plan);
    if (!rateLimit.success) {
      return jsonError("Rate limit exceeded", 429);
    }

    // ── Job setup (DB) ───────────────────────────────────────────────

    jobId = randomUUID();
    try {
      await createJob(jobId, user.id, data.projectId);
    } catch (error) {
      throw error;
    }

    // ── Credit reservation ───────────────────────────────────────────

    let eventId = 0;
    const nextEventId = () => {
      eventId = eventId + 1;
      return eventId;
    };

    const reservation = await reserveGenerationCredits(
      supabase,
      user.id,
      creditCost,
      jobId,
      nextEventId,
    );
    if (!reservation.success) {
      await updateJobStatus(jobId, "error");
      return jsonError("Insufficient credits", 402);
    }
    creditsReserved = true;

    // ── Enqueue for execution slot ───────────────────────────────────

    await enqueue(jobId, user.id, user.plan as Plan);

    // ── Build context ────────────────────────────────────────────────

    let ctx;
    try {
      ctx = await buildGenerationContext(
        request,
        project,
        data.chatHistory,
        data.prompt,
      );
    } catch (error) {
      if (creditsReserved) {
        await refundGenerationCredits(
          supabase,
          user.id,
          creditCost,
          jobId,
          nextEventId,
        );
        creditsReserved = false;
      }
      await updateJobStatus(jobId, "error");
      throw error;
    }

    // ── Job setup (in-memory) ────────────────────────────────────────

    const job = createGenerationJob(jobId, user.id);
    const { stream, abortController } = createGenerationStream({
      request,
      jobId,
      job,
      supabase,
      user,
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        app_spec: (project.app_spec as Record<string, unknown>) || null,
      },
      ctx,
      prompt: data.prompt,
      projectId: data.projectId,
      creditCost,
      creditsReserved,
      nextEventId,
      plan: user.plan as Plan,
    });
    job.abortController = abortController;

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[Generate] Request error:", error);
    // Best-effort queue cleanup on unexpected errors
    if (jobId) {
      dequeue(jobId).catch(() => {});
      releaseSlot(jobId).catch(() => {});
    }
    if (error instanceof z.ZodError) {
      return jsonError("Invalid request", 400);
    }
    return jsonError(
      error instanceof Error ? error.message : "Internal error",
      500,
    );
  }
}
