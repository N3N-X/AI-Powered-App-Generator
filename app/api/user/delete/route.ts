import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { withRateLimit } from "@/lib/rate-limit";

export async function DELETE(request: NextRequest) {
  // Rate limit: 3 per hour per IP (destructive action)
  const limited = await withRateLimit(request, { limit: 3, window: 3_600_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Delete user data from the users table first
    const { error: deleteDataError } = await supabase
      .from("users")
      .delete()
      .eq("id", uid);

    if (deleteDataError) {
      console.error("Failed to delete user data:", deleteDataError);
      return NextResponse.json(
        { error: "Failed to delete user data" },
        { status: 500 },
      );
    }

    // Delete the auth user using admin API (requires service role key)
    const { error: deleteAuthError } =
      await supabase.auth.admin.deleteUser(uid);

    if (deleteAuthError) {
      console.error("Failed to delete auth user:", deleteAuthError);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
