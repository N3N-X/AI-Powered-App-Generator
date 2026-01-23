import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateCode, getModelForPlan, canUseModel } from "@/lib/ai";
import { checkPlanRateLimit, incrementUsage } from "@/lib/rate-limit";
import { decrypt } from "@/lib/encrypt";
import { RefineRequestSchema, Plan, CodeFiles, CREDIT_COSTS } from "@/types";

/**
 * @swagger
 * /api/vibe/refine:
 *   post:
 *     summary: Refine existing code for a project
 *     description: Refines existing code files based on a prompt using AI models. Can target specific files or refine all existing code. Merges refined code with existing files, checks rate limits, and updates the project. Supports different models based on user plan.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: ID of the project to refine code for
 *               prompt:
 *                 type: string
 *                 description: The prompt describing how to refine the code
 *               model:
 *                 type: string
 *                 description: Optional AI model to use (validated against plan)
 *               targetFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional array of specific file paths to refine (if not provided, refines all files)
 *             required:
 *               - projectId
 *               - prompt
 *     responses:
 *       200:
 *         description: Code refined successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 codeFiles:
 *                   type: object
 *                   description: Refined code files
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
 *         description: Refinement failed
 */
export async function POST(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = RefineRequestSchema.parse(body);

    // Get user and project
    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", data.projectId)
      .eq("user_id", uid)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check credits
    const creditCost = CREDIT_COSTS.codeRefinement;
    if (user.credits < creditCost) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          required: creditCost,
          available: user.credits,
          message: `You need ${creditCost} credits to refine code. You have ${user.credits} credits remaining.`,
        },
        { status: 402 },
      );
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
    const hasCustomClaudeKey = !!user.claude_key_encrypted;
    let model =
      data.model || getModelForPlan(user.plan as Plan, hasCustomClaudeKey);

    if (!canUseModel(user.plan as Plan, model, hasCustomClaudeKey)) {
      model = getModelForPlan(user.plan as Plan, hasCustomClaudeKey);
    }

    // Get custom Claude key if available
    let userClaudeKey: string | undefined;
    if (model === "claude" && user.claude_key_encrypted) {
      try {
        userClaudeKey = await decrypt(user.claude_key_encrypted);
      } catch (error) {
        console.error("Failed to decrypt Claude key:", error);
      }
    }

    // Get existing code files
    const existingCode = project.code_files as CodeFiles;

    // Filter to target files if specified
    let codeToRefine = existingCode;
    if (data.targetFiles && data.targetFiles.length > 0) {
      codeToRefine = Object.fromEntries(
        Object.entries(existingCode).filter(([path]) =>
          data.targetFiles!.includes(path),
        ),
      );
    }

    // Get API base URL from request headers
    // This ensures localhost works during development
    const host = request.headers.get("host") || "rux.sh";
    const isLocalhost =
      host.includes("localhost") || host.includes("127.0.0.1");
    const protocol = isLocalhost
      ? "http"
      : request.headers.get("x-forwarded-proto") || "https";
    const apiBaseUrl = `${protocol}://${host}`;

    // Generate refined code
    const result = await generateCode({
      prompt: `Refine the following code based on this request: ${data.prompt}`,
      existingCode: codeToRefine,
      model,
      userClaudeKey,
      platform: project.platform,
      apiBaseUrl,
    });

    // Merge refined files with existing files
    const updatedCodeFiles = {
      ...existingCode,
      ...result.codeFiles,
    };

    // Update project
    await supabase
      .from("projects")
      .update({
        code_files: updatedCodeFiles,
        updated_at: new Date().toISOString(),
      })
      .eq("id", project.id);

    // Save prompt history
    await supabase.from("prompt_history").insert({
      prompt: `[REFINE] ${data.prompt}`,
      response: JSON.stringify(result.codeFiles),
      model: result.model,
      tokens: result.tokensUsed,
      user_id: user.id,
      project_id: project.id,
    });

    // Deduct credits
    await supabase
      .from("users")
      .update({
        credits: user.credits - creditCost,
        total_credits_used: (user.total_credits_used || 0) + creditCost,
      })
      .eq("id", user.id);

    await incrementUsage(user.id);

    return NextResponse.json({
      success: true,
      codeFiles: result.codeFiles,
      model: result.model,
      tokensUsed: result.tokensUsed,
      message: `Refined ${Object.keys(result.codeFiles).length} file(s)`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Refine error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Refinement failed" },
      { status: 500 },
    );
  }
}
