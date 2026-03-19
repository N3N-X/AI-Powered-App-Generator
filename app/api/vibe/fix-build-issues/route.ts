/**
 * Fix pre-build issues (deterministic first, AI optional).
 * Currently applies deterministic fixes for auto-fixable issues.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { BuildPlatform } from "@/lib/build/pre-build-checks";
import { applyAutoFixes } from "@/lib/build/auto-fix";

const requestSchema = z.object({
  projectId: z.string(),
  platform: z.enum(["ios", "android"]),
  issueIds: z.array(z.string()).optional(),
  fixAll: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      try {
        // Auth check
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          send({ type: "error", message: "Unauthorized" });
          controller.close();
          return;
        }

        const body = await req.json();
        const parsed = requestSchema.safeParse(body);
        if (!parsed.success) {
          send({ type: "error", message: "Invalid request" });
          controller.close();
          return;
        }

        const { projectId, platform, issueIds, fixAll } = parsed.data;

        const { data: project, error: projectError } = await supabase
          .from("projects")
          .select("id, name, code_files, user_id")
          .eq("id", projectId)
          .single();

        if (projectError || !project) {
          send({ type: "error", message: "Project not found" });
          controller.close();
          return;
        }

        if (project.user_id !== user.id) {
          send({ type: "error", message: "Access denied" });
          controller.close();
          return;
        }

        const files = (project.code_files as Record<string, string>) || {};
        const { updatedFiles, fixedCount } = applyAutoFixes({
          files,
          platform: platform as BuildPlatform,
          projectName: project.name || "Rulxy App",
          issueIds,
          fixAll,
          onProgress: (message) => send({ type: "progress", message }),
        });

        if (fixedCount > 0) {
          const { error: updateError } = await supabase
            .from("projects")
            .update({ code_files: updatedFiles })
            .eq("id", projectId);
          if (updateError) {
            send({ type: "error", message: "Failed to save fixes" });
            controller.close();
            return;
          }
        }

        send({ type: "complete", fixedCount });
        controller.close();
      } catch (error) {
        console.error("Fix build issues error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message: "Failed to fix build issues",
            })}\n\n`,
          ),
        );
        controller.close();
      }
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
