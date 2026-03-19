import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/rate-limit";

async function verifyAdmin(request: NextRequest) {
  const { uid } = await getAuthenticatedUser(request);
  if (!uid) return null;

  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", uid)
    .single();

  if (!user || user.role !== "ADMIN") return null;
  const adminClient = createAdminClient();
  return { uid, supabase: adminClient };
}

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  const auth = await verifyAdmin(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  let { data, error } = await auth.supabase
    .from("voice_settings")
    .select("*")
    .limit(1)
    .single();

  // Auto-create default settings row if none exists
  if (error?.code === "PGRST116") {
    const { data: inserted, error: insertError } = await auth.supabase
      .from("voice_settings")
      .insert({})
      .select()
      .single();

    if (insertError) {
      console.error("voice_settings insert error:", insertError);
      return NextResponse.json(
        {
          error: "Failed to create default settings",
          details: insertError.message,
        },
        { status: 500 },
      );
    }
    data = inserted;
    error = null;
  }

  if (error) {
    console.error("voice_settings fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 10, window: 60_000 });
  if (limited) return limited;

  const auth = await verifyAdmin(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only allow updating specific fields
  const allowedFields = [
    "enabled",
    "greeting_message",
    "pro_greeting_message",
    "forwarding_number",
    "system_prompt",
    "max_conversation_turns",
    "sms_enabled",
    "sms_auto_reply",
    "sms_system_prompt",
  ];

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: auth.uid,
  };

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  // Get existing settings row ID
  const { data: existing } = await auth.supabase
    .from("voice_settings")
    .select("id")
    .limit(1)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }

  const { data, error } = await auth.supabase
    .from("voice_settings")
    .update(updates)
    .eq("id", existing.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 },
    );
  }

  return NextResponse.json(data);
}
