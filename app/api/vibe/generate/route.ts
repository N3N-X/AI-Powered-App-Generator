import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { checkPlanRateLimit, incrementUsage } from "@/lib/rate-limit";
import { Plan, CodeFiles, CREDIT_COSTS } from "@/types";
import { orchestratePlan, orchestrateBuild } from "@/lib/agents/orchestrator";
import { StreamUpdate, Platform, AppSpec } from "@/lib/agents/types";

// Extended schema to support quickMode
const GenerateRequestSchema = z.object({
  projectId: z.string(),
  prompt: z.string().min(1),
  quickMode: z.boolean().optional().default(false), // Skip confirmation step
});

/**
 * @swagger
 * /api/vibe/generate:
 *   post:
 *     summary: Generate code for a project with streaming progress
 *     description: Generates code based on a prompt for an existing project using AI models. Streams progress updates via SSE. Merges generated code with existing files, checks rate limits, and updates the project. Supports different models based on user plan.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: ID of the project to generate code for
 *               prompt:
 *                 type: string
 *                 description: The prompt describing the code to generate
 *               model:
 *                 type: string
 *                 description: Optional AI model to use (validated against plan)
 *             required:
 *               - projectId
 *               - prompt
 *     responses:
 *       200:
 *         description: Streaming progress updates via Server-Sent Events
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User or project not found
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Generation failed
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

    // Parse request body
    const body = await request.json();
    const data = GenerateRequestSchema.parse(body);

    // Get user from database with project and API key
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
          message: `You need ${creditCost} credits to generate code. You have ${user.credits} credits remaining.`,
        }),
        {
          status: 402,
          headers: { "Content-Type": "application/json" },
        },
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
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get existing code files
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

    // Create a readable stream for SSE with beautiful phases
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send stream update with phase info
        const sendUpdate = (update: StreamUpdate) => {
          const eventData = `data: ${JSON.stringify({
            type: "phase",
            phase: update.phase,
            message: update.message,
            icon: update.icon,
            progress: update.progress,
            detail: update.detail,
            appSpec: update.appSpec, // Include spec for confirmation
          })}\n\n`;
          controller.enqueue(encoder.encode(eventData));
        };

        try {
          // Check if this is a REAL app (has screens) or just default template
          // Default/blank projects only have App.tsx with minimal content
          const hasScreenFiles = Object.keys(existingCode).some(
            (f) => f.includes("/screens/") || f.includes("/components/"),
          );
          const appTsxContent =
            existingCode["App.tsx"] || existingCode["App.js"] || "";

          // A blank project is one that:
          // - Has no screen files (no /screens/ or /components/)
          // - Only has App.tsx (or very few files like package.json, etc.)
          // - The default template App.tsx is ~821 chars, so use 1000 as threshold
          const fileCount = Object.keys(existingCode).length;
          const isBlankProject =
            !hasScreenFiles &&
            (fileCount <= 1 || (fileCount <= 3 && appTsxContent.length < 1000));
          const hasExistingAppCode = !isBlankProject && fileCount > 0;

          // Debug logging
          console.log("[Generate] Project detection:", {
            fileCount: Object.keys(existingCode).length,
            hasScreenFiles,
            appTsxLength: appTsxContent.length,
            isBlankProject,
            hasExistingAppCode,
            files: Object.keys(existingCode),
          });

          const context = {
            userPrompt: data.prompt,
            platforms: [project.platform as Platform],
            apiBaseUrl,
            apiKey: decryptedApiKey, // Inject actual API key
            existingCode: hasExistingAppCode ? existingCode : undefined,
          };

          // If actual app code exists, this is a REFINEMENT - skip planning/confirmation
          // Just build the changes directly
          if (hasExistingAppCode) {
            sendUpdate({
              phase: "building",
              message: "Updating your app",
              icon: "🔨",
              progress: 30,
              detail: "Applying changes...",
            });

            // For refinements, create a simple spec based on existing code
            const refinementSpec: AppSpec = {
              name: project.name,
              description: data.prompt,
              platforms: [project.platform as Platform],
              features: [data.prompt], // The change requested
              screens: [],
              api: {
                collections: [],
                externalApis: [],
                authRequired: false,
                paymentsRequired: false,
              },
              styling: {
                primaryColor: "#6366F1",
                secondaryColor: "#EC4899",
                style: "modern",
              },
            };

            const buildResult = await orchestrateBuild(
              refinementSpec,
              context,
              sendUpdate,
            );

            if (!buildResult.success) {
              throw new Error("Build failed");
            }

            // Merge generated files with existing files
            const updatedCodeFiles = {
              ...existingCode,
              ...buildResult.files,
            };

            // Update project in database
            await prisma.project.update({
              where: { id: project.id },
              data: {
                codeFiles: updatedCodeFiles,
                updatedAt: new Date(),
              },
            });

            // Save prompt history
            await prisma.promptHistory.create({
              data: {
                prompt: data.prompt,
                response: JSON.stringify(buildResult.files),
                model: "grok",
                tokens: 0,
                userId: user.id,
                projectId: project.id,
              },
            });

            // Deduct credits
            await prisma.user.update({
              where: { id: user.id },
              data: {
                credits: { decrement: creditCost },
                totalCreditsUsed: { increment: creditCost },
              },
            });

            await incrementUsage(user.id);

            // Send completion
            const completeData = `data: ${JSON.stringify({
              type: "complete",
              success: true,
              codeFiles: buildResult.files,
              message: `Updated ${Object.keys(buildResult.files).length} file(s)`,
            })}\n\n`;
            controller.enqueue(encoder.encode(completeData));

            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          // NEW APP: Go through planning and confirmation flow
          // Step 1: Plan the app
          const planResult = await orchestratePlan(context, sendUpdate);

          if (!planResult.success || !planResult.spec) {
            throw new Error("Planning failed");
          }

          // If quickMode is false, stop here and wait for confirmation
          // The orchestratePlan already sent the awaiting_confirmation phase with appSpec
          // Frontend will call /api/vibe/build with the confirmed spec
          if (!data.quickMode) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            return;
          }

          // Quick mode: continue building without confirmation
          sendUpdate({
            phase: "building",
            message: "Building your app",
            icon: "🔨",
            progress: 30,
            detail: "Starting code generation...",
          });

          const buildResult = await orchestrateBuild(
            planResult.spec,
            context,
            sendUpdate,
          );

          if (!buildResult.success) {
            throw new Error("Build failed");
          }

          // Merge generated files with existing files
          const updatedCodeFiles = {
            ...existingCode,
            ...buildResult.files,
          };

          // Update project in database
          await prisma.project.update({
            where: { id: project.id },
            data: {
              codeFiles: updatedCodeFiles,
              updatedAt: new Date(),
            },
          });

          // Save prompt history
          await prisma.promptHistory.create({
            data: {
              prompt: data.prompt,
              response: JSON.stringify(buildResult.files),
              model: "grok",
              tokens: 0,
              userId: user.id,
              projectId: project.id,
            },
          });

          // Deduct credits from user
          await prisma.user.update({
            where: { id: user.id },
            data: {
              credits: { decrement: creditCost },
              totalCreditsUsed: { increment: creditCost },
            },
          });

          // Increment rate limit counter
          await incrementUsage(user.id);

          // Send completion
          const completeData = `data: ${JSON.stringify({
            type: "complete",
            success: true,
            codeFiles: buildResult.files,
            message: `Generated ${Object.keys(buildResult.files).length} file(s)`,
          })}\n\n`;
          controller.enqueue(encoder.encode(completeData));

          // Send done signal
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Generation error:", error);

          const errorData = `data: ${JSON.stringify({
            type: "error",
            phase: "error",
            icon: "❌",
            error: error instanceof Error ? error.message : "Generation failed",
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
      return new Response(
        JSON.stringify({
          error: "Validation error",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    console.error("Generate error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Generation failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
