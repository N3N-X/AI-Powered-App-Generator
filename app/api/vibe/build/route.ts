import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { checkPlanRateLimit, incrementUsage } from "@/lib/rate-limit";
import { Plan, CodeFiles, CREDIT_COSTS } from "@/types";
import { orchestrateBuild } from "@/lib/agents/orchestrator";
import { StreamUpdate, Platform, AppSpec } from "@/lib/agents/types";

const BuildRequestSchema = z.object({
  projectId: z.string(),
  spec: z.object({
    name: z.string(),
    description: z.string(),
    platforms: z.array(z.enum(["IOS", "ANDROID", "WEB"])),
    features: z.array(z.string()),
    screens: z.array(
      z.object({
        name: z.string(),
        path: z.string().optional(), // Make optional - AI might not always include
        description: z.string(),
        components: z.array(z.string()).optional().default([]),
        dataNeeded: z.array(z.string()).optional().default([]),
      }),
    ),
    api: z.object({
      collections: z
        .array(
          z.object({
            name: z.string(),
            fields: z.array(z.object({ name: z.string(), type: z.string() })),
          }),
        )
        .optional()
        .default([]),
      externalApis: z.array(z.string()).optional().default([]),
      authRequired: z.boolean().optional().default(false),
      paymentsRequired: z.boolean().optional().default(false),
    }),
    styling: z
      .object({
        primaryColor: z.string().optional().default("#6366F1"),
        secondaryColor: z.string().optional().default("#EC4899"),
        style: z
          .enum(["modern", "minimal", "vibrant", "dark", "light"])
          .optional()
          .default("modern"),
      })
      .optional()
      .default({}),
  }),
});

/**
 * Build from confirmed app spec
 * POST /api/vibe/build
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const data = BuildRequestSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        projects: {
          where: { id: data.projectId },
          include: {
            apiKeys: {
              where: { active: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const project = user.projects[0];
    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check credits
    const creditCost = CREDIT_COSTS.codeGeneration;
    if (user.credits < creditCost) {
      return new Response(
        JSON.stringify({
          error: "Insufficient credits",
          required: creditCost,
          available: user.credits,
        }),
        { status: 402, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check rate limit
    const rateLimit = await checkPlanRateLimit(user.id, user.plan as Plan);
    if (!rateLimit.success) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          remaining: rateLimit.remaining,
          reset: rateLimit.reset,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    const existingCode = project.codeFiles as CodeFiles;

    // Get API base URL from request headers
    // This ensures localhost works during development
    const host = request.headers.get("host") || "rux.sh";
    const isLocalhost =
      host.includes("localhost") || host.includes("127.0.0.1");
    const protocol = isLocalhost
      ? "http"
      : request.headers.get("x-forwarded-proto") || "https";
    const apiBaseUrl = `${protocol}://${host}`;

    // Decrypt the project's API key for injection into generated code
    let decryptedApiKey: string | undefined;
    const activeApiKey = project.apiKeys[0];
    if (activeApiKey?.keyEncrypted) {
      try {
        const { decrypt } = await import("@/lib/encrypt");
        decryptedApiKey = await decrypt(activeApiKey.keyEncrypted);
      } catch (error) {
        console.error("Failed to decrypt API key:", error);
        // Continue without injecting key - user will need to add it manually
      }
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = (update: StreamUpdate) => {
          const eventData = `data: ${JSON.stringify({
            type: "phase",
            phase: update.phase,
            message: update.message,
            icon: update.icon,
            progress: update.progress,
            detail: update.detail,
          })}\n\n`;
          controller.enqueue(encoder.encode(eventData));
        };

        try {
          const result = await orchestrateBuild(
            data.spec as AppSpec,
            {
              userPrompt: `Build: ${data.spec.name} - ${data.spec.description}`,
              platforms: [project.platform as Platform],
              apiBaseUrl,
              apiKey: decryptedApiKey, // Inject actual API key
              existingCode:
                Object.keys(existingCode).length > 0 ? existingCode : undefined,
            },
            sendUpdate,
          );

          if (!result.success) {
            throw new Error("Build failed");
          }

          const updatedCodeFiles = {
            ...existingCode,
            ...result.files,
          };

          await prisma.project.update({
            where: { id: project.id },
            data: {
              codeFiles: updatedCodeFiles,
              updatedAt: new Date(),
            },
          });

          await prisma.promptHistory.create({
            data: {
              prompt: `[Confirmed Build] ${data.spec.name}: ${data.spec.features.join(", ")}`,
              response: JSON.stringify(result.files),
              model: "grok",
              tokens: 0,
              userId: user.id,
              projectId: project.id,
            },
          });

          await prisma.user.update({
            where: { id: user.id },
            data: {
              credits: { decrement: creditCost },
              totalCreditsUsed: { increment: creditCost },
            },
          });

          await incrementUsage(user.id);

          const completeData = `data: ${JSON.stringify({
            type: "complete",
            success: true,
            codeFiles: result.files,
            message: `Generated ${Object.keys(result.files).length} file(s)`,
          })}\n\n`;
          controller.enqueue(encoder.encode(completeData));

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Build error:", error);

          const errorData = `data: ${JSON.stringify({
            type: "error",
            phase: "error",
            icon: "❌",
            error: error instanceof Error ? error.message : "Build failed",
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        "[Build] Validation error:",
        JSON.stringify(error.errors, null, 2),
      );
      return new Response(
        JSON.stringify({ error: "Validation error", details: error.errors }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    console.error("[Build] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Build failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
