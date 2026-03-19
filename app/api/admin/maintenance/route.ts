import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 5, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", uid)
      .single();

    if (userError || !user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled must be a boolean" },
        { status: 400 },
      );
    }

    // Update maintenance mode in database
    const { error: updateError } = await supabase.from("system_config").upsert(
      {
        key: "maintenance_mode",
        value: { enabled },
        updated_at: new Date().toISOString(),
        updated_by: uid,
      },
      { onConflict: "key" },
    );

    if (updateError) {
      console.error("Failed to update maintenance mode:", updateError);
      return NextResponse.json(
        { error: "Failed to update maintenance mode" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      maintenanceMode: enabled,
      message: `Maintenance mode ${enabled ? "enabled" : "disabled"}`,
    });
  } catch (error) {
    console.error("Maintenance mode toggle error:", error);
    return NextResponse.json(
      { error: "Failed to toggle maintenance mode" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 5, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", uid)
      .single();

    if (userError || !user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const { data: config } = await supabase
      .from("system_config")
      .select("value")
      .eq("key", "maintenance_mode")
      .single();

    const maintenanceMode =
      (config?.value as { enabled?: boolean })?.enabled ?? false;

    return NextResponse.json({ maintenanceMode });
  } catch (error) {
    console.error("Maintenance mode status error:", error);
    return NextResponse.json(
      { error: "Failed to get maintenance mode status" },
      { status: 500 },
    );
  }
}
