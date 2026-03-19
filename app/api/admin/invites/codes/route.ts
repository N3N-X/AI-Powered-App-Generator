/**
 * Admin API for viewing invite codes.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return data?.role === "ADMIN";
}

export async function GET() {
  const supabase = await createClient();

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get invite codes with owner info
  const { data, error } = await supabase
    .from("invite_codes")
    .select(
      `
      id,
      code,
      owner_id,
      created_at,
      times_used,
      max_uses,
      is_active,
      code_type
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get owner emails
  const ownerIds = data
    ?.filter((c) => c.owner_id)
    .map((c) => c.owner_id) as string[];

  let ownerEmails: Record<string, string> = {};
  if (ownerIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, email")
      .in("id", ownerIds);

    if (users) {
      ownerEmails = Object.fromEntries(users.map((u) => [u.id, u.email]));
    }
  }

  const codes = data?.map((code) => ({
    ...code,
    owner_email: code.owner_id ? ownerEmails[code.owner_id] : null,
  }));

  return NextResponse.json({ codes });
}
