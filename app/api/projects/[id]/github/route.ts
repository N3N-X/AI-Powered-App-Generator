import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await withRateLimit(request, { limit: 10, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // Verify project exists and belongs to user
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Update project to remove GitHub link
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        github_repo: null,
        github_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to unlink GitHub repo:", updateError);
      return NextResponse.json(
        { error: "Failed to unlink repository" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to unlink GitHub repo:", error);
    return NextResponse.json(
      { error: "Failed to unlink repository" },
      { status: 500 }
    );
  }
}
