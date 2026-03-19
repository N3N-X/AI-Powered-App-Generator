import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encrypt";
import { pushCodeToRepo } from "@/lib/github";
import { PushCodeRequestSchema, PLAN_LIMITS, Plan, CodeFiles } from "@/types";
import { withRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limit: 20 per minute per IP
  const limited = await withRateLimit(request, { limit: 20, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = PushCodeRequestSchema.parse(body);

    const supabase = await createClient();

    // Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check plan
    if (!PLAN_LIMITS[user.plan as Plan].githubIntegration) {
      return NextResponse.json(
        { error: "GitHub integration requires Pro or Elite plan" },
        { status: 403 },
      );
    }

    if (!user.github_token_encrypted) {
      return NextResponse.json(
        { error: "GitHub account not connected" },
        { status: 400 },
      );
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", data.projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.github_repo) {
      return NextResponse.json(
        { error: "Project not connected to a GitHub repository" },
        { status: 400 },
      );
    }

    // Decrypt GitHub token
    const githubToken = await decrypt(user.github_token_encrypted);

    // Parse repo info
    const [owner, repoName] = project.github_repo.split("/");

    // Push code
    const codeFiles = project.code_files as CodeFiles;
    const { commitSha, commitUrl } = await pushCodeToRepo(githubToken, {
      owner,
      repo: repoName,
      files: codeFiles,
      message: data.commitMessage,
    });

    return NextResponse.json({
      success: true,
      commit: {
        sha: commitSha,
        url: commitUrl,
        message: data.commitMessage,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Push code error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to push code" },
      { status: 500 },
    );
  }
}
