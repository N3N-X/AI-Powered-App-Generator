import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encrypt";
import {
  createRepository,
  pushCodeToRepo,
  generateGitignore,
  generateReadme,
} from "@/lib/github";
import { CreateRepoRequestSchema, PLAN_LIMITS, Plan, CodeFiles } from "@/types";

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 10, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = CreateRepoRequestSchema.parse(body);

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

    // Check plan allows GitHub integration
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

    // Decrypt GitHub token
    const githubToken = await decrypt(user.github_token_encrypted);

    // Create repository
    const repo = await createRepository(githubToken, {
      name: data.repoName,
      description: data.description || `${project.name} - Built with Rulxy`,
      isPrivate: data.isPrivate,
      autoInit: false, // We'll push our own files
    });

    // Prepare files to push
    const codeFiles = project.code_files as CodeFiles;
    const filesToPush: CodeFiles = {
      ...codeFiles,
      ".gitignore": generateGitignore(),
      "README.md": generateReadme(
        project.name,
        project.description || undefined,
      ),
    };

    // Push code to the new repo
    const { commitSha, commitUrl } = await pushCodeToRepo(githubToken, {
      owner: repo.fullName.split("/")[0],
      repo: repo.name,
      files: filesToPush,
      message: "Initial commit from Rulxy",
    });

    // Update project with GitHub info
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        github_repo: repo.fullName,
        github_url: repo.htmlUrl,
      })
      .eq("id", project.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      repository: {
        name: repo.name,
        fullName: repo.fullName,
        url: repo.htmlUrl,
        cloneUrl: repo.cloneUrl,
        private: repo.private,
      },
      commit: {
        sha: commitSha,
        url: commitUrl,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Create repo error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create repository",
      },
      { status: 500 },
    );
  }
}
