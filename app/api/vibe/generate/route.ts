import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { generateCode, getModelForPlan, canUseModel } from "@/lib/ai";
import { checkPlanRateLimit, incrementUsage } from "@/lib/rate-limit";
import { decrypt } from "@/lib/encrypt";
import { GenerateRequestSchema, PLAN_LIMITS, Plan, CodeFiles } from "@/types";

/**
 * @swagger
 * /api/vibe/generate:
 *   post:
 *     summary: Generate code for a project
 *     description: Generates code based on a prompt for an existing project using AI models. Merges generated code with existing files, checks rate limits, and updates the project. Supports different models based on user plan.
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
 *         description: Code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 codeFiles:
 *                   type: object
 *                   description: Generated code files
 *                 model:
 *                   type: string
 *                 tokensUsed:
 *                   type: integer
 *                 message:
 *                   type: string
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = user.projects[0];
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check rate limit
    const rateLimit = await checkPlanRateLimit(user.id, user.plan as Plan);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          remaining: rateLimit.remaining,
          reset: rateLimit.reset,
        },
        { status: 429 },
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

    // Generate code
    const result = await generateCode({
      prompt: data.prompt,
      existingCode:
        Object.keys(existingCode).length > 0 ? existingCode : undefined,
      model,
      userClaudeKey,
    });

    // Merge generated files with existing files
    const updatedCodeFiles = {
      ...existingCode,
      ...result.codeFiles,
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
        response: JSON.stringify(result.codeFiles),
        model: result.model,
        tokens: result.tokensUsed,
        userId: user.id,
        projectId: project.id,
      },
    });

    // Update user's prompt count
    await prisma.user.update({
      where: { id: user.id },
      data: {
        dailyPromptCount: { increment: 1 },
        totalPrompts: { increment: 1 },
      },
    });

    // Increment rate limit counter
    await incrementUsage(user.id);

    return NextResponse.json({
      success: true,
      codeFiles: result.codeFiles,
      model: result.model,
      tokensUsed: result.tokensUsed,
      message: `Generated ${Object.keys(result.codeFiles).length} file(s)`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Generate error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 },
    );
  }
}
