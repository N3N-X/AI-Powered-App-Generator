import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Verify that the request is from an authenticated admin user.
 * Returns the user's uid and a supabase client if authorized,
 * or an error response if not.
 */
export async function requireAdmin(request: NextRequest) {
  const { uid } = await getAuthenticatedUser(request);
  if (!uid) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      uid: null as string | null,
      supabase: null as Awaited<ReturnType<typeof createClient>> | null,
    };
  }

  const supabase = await createClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", uid)
    .single();

  if (error || !user || user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      ),
      uid: null as string | null,
      supabase: null as Awaited<ReturnType<typeof createClient>> | null,
    };
  }

  return { error: null, uid, supabase };
}
