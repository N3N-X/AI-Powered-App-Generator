import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/encrypt";
import { getRepositoryInfo } from "@/lib/github";

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repo = searchParams.get("repo");

    if (!repo || !repo.includes("/")) {
      return NextResponse.json(
        { error: "Invalid repo format. Expected: owner/repo" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("github_token_encrypted")
      .eq("id", uid)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.github_token_encrypted) {
      return NextResponse.json(
        { error: "GitHub account not connected" },
        { status: 400 }
      );
    }

    const githubToken = await decrypt(user.github_token_encrypted);
    const [owner, repoName] = repo.split("/");

    const repoInfo = await getRepositoryInfo(githubToken, owner, repoName);

    return NextResponse.json({
      fullName: repoInfo.fullName,
      htmlUrl: repoInfo.htmlUrl,
      private: repoInfo.private,
      defaultBranch: repoInfo.defaultBranch,
      pushedAt: repoInfo.pushedAt,
    });
  } catch (error) {
    console.error("GitHub repo info error:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository info" },
      { status: 500 }
    );
  }
}
