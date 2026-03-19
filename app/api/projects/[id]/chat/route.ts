import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

// Save chat history
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  const { uid } = await getAuthenticatedUser(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { messages } = body;
    const supabase = await createClient();

    // Verify project ownership
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Update chat history using snake_case
    const { data: updateData, error: updateError } = await supabase
      .from("projects")
      .update({ chat_history: messages })
      .eq("id", id)
      .select();

    if (updateError) {
      console.error("Failed to save chat history:", updateError);
      return NextResponse.json(
        { error: "Failed to save chat history" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save chat history:", error);
    return NextResponse.json(
      { error: "Failed to save chat history" },
      { status: 500 },
    );
  }
}

// Clear chat history
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  const { uid } = await getAuthenticatedUser(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const supabase = await createClient();

    // Verify project ownership
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Clear chat history using snake_case
    const { error: updateError } = await supabase
      .from("projects")
      .update({ chat_history: [] })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to clear chat history:", updateError);
      return NextResponse.json(
        { error: "Failed to clear chat history" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to clear chat history:", error);
    return NextResponse.json(
      { error: "Failed to clear chat history" },
      { status: 500 },
    );
  }
}
