import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  const { uid } = await getAuthenticatedUser(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("role")
    .eq("id", uid)
    .single();

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 },
    );
  }

  const supabaseAdmin = createAdminClient();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const status = searchParams.get("status");
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from("call_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch call logs" },
      { status: 500 },
    );
  }

  // Fetch stats
  const [totalResult, forwardedResult, todayResult] = await Promise.all([
    supabaseAdmin.from("call_logs").select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("call_logs")
      .select("*", { count: "exact", head: true })
      .eq("forwarded", true),
    supabaseAdmin
      .from("call_logs")
      .select("*", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      ),
  ]);

  // Avg duration
  const { data: durationData } = await supabaseAdmin
    .from("call_logs")
    .select("duration_seconds")
    .not("duration_seconds", "is", null);

  const avgDuration =
    durationData && durationData.length > 0
      ? Math.round(
          durationData.reduce((sum, r) => sum + (r.duration_seconds || 0), 0) /
            durationData.length,
        )
      : 0;

  return NextResponse.json({
    calls: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
    stats: {
      totalCalls: totalResult.count || 0,
      forwardedCalls: forwardedResult.count || 0,
      callsToday: todayResult.count || 0,
      avgDuration,
    },
  });
}
