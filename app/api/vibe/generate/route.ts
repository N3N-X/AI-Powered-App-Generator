import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { generateCode, getModelForPlan, canUseModel } from "@/lib/ai";
import { checkPlanRateLimit, incrementUsage } from "@/lib/rate-limit";
import { decrypt } from "@/lib/encrypt";
import { GenerateRequestSchema, Plan, CodeFiles, CREDIT_COSTS } from "@/types";

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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        projects: {
          where: { id: data.projectId },
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

    // Determine AI model
    const hasCustomClaudeKey = !!user.claudeKeyEncrypted;
    let model =
      data.model || getModelForPlan(user.plan as Plan, hasCustomClaudeKey);

    // Validate model access
    if (!canUseModel(user.plan as Plan, model, hasCustomClaudeKey)) {
      model = getModelForPlan(user.plan as Plan, hasCustomClaudeKey);
    }

    // Get custom Claude key if Elite user has one
    let userClaudeKey: string | undefined;
    if (model === "claude" && user.claudeKeyEncrypted) {
      try {
        userClaudeKey = await decrypt(user.claudeKeyEncrypted);
      } catch (error) {
        console.error("Failed to decrypt Claude key:", error);
      }
    }

    // Get existing code files
    const existingCode = project.codeFiles as CodeFiles;

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (message: string) => {
          const data = `data: ${JSON.stringify({ type: "progress", message })}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        try {
          // Send initial progress
          sendProgress("Analyzing your request...");

          // Simulate analyzing phase
          await new Promise((resolve) => setTimeout(resolve, 500));

          sendProgress(
            `Generating code with ${model === "claude" ? "Claude AI" : "Grok AI"}...`,
          );

          // Get API base URL from request
          const protocol = request.headers.get("x-forwarded-proto") || "https";
          const host = request.headers.get("host") || "rux.sh";
          const apiBaseUrl = `${protocol}://${host}`;

          // Generate code with platform context
          const result = await generateCode({
            prompt: data.prompt,
            existingCode:
              Object.keys(existingCode).length > 0 ? existingCode : undefined,
            model,
            userClaudeKey,
            platform: project.platform,
            apiBaseUrl,
          });

          // Send progress for file processing
          const fileCount = Object.keys(result.codeFiles).length;
          sendProgress(`Processing ${fileCount} file(s)...`);

          // Simulate processing files
          const fileNames = Object.keys(result.codeFiles);
          for (let i = 0; i < Math.min(fileNames.length, 5); i++) {
            await new Promise((resolve) => setTimeout(resolve, 200));
            const fileName = fileNames[i];
            const shortName =
              fileName.length > 30 ? "..." + fileName.slice(-27) : fileName;
            sendProgress(`Creating ${shortName}...`);
          }

          if (fileNames.length > 5) {
            sendProgress(`Creating ${fileNames.length - 5} more files...`);
          }

          // Merge generated files with existing files
          const updatedCodeFiles = {
            ...existingCode,
            ...result.codeFiles,
          };

          sendProgress("Saving project files...");

          // Update project in database
          await prisma.project.update({
            where: { id: project.id },
            data: {
              codeFiles: updatedCodeFiles,
              updatedAt: new Date(),
            },
          });

          sendProgress("Updating project history...");

          // Save prompt history
          await prisma.promptHistory.create({
            data: {
              prompt: data.prompt,
              response: JSON.stringify(result.codeFiles),
              model: result.model,
              tokens: result.tokensUsed,
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

          sendProgress("Finalizing...");

          // Send completion
          const completeData = `data: ${JSON.stringify({
            type: "complete",
            success: true,
            codeFiles: result.codeFiles,
            model: result.model,
            tokensUsed: result.tokensUsed,
            message: `Generated ${Object.keys(result.codeFiles).length} file(s)`,
          })}\n\n`;
          controller.enqueue(encoder.encode(completeData));

          // Send done signal
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          console.error("Generation error:", error);

          const errorData = `data: ${JSON.stringify({
            type: "error",
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
