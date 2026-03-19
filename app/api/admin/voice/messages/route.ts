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
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const adminDb = createAdminClient();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const direction = searchParams.get("direction");
  const offset = (page - 1) * limit;

  let query = adminDb
    .from("message_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (direction) {
    query = query.eq("direction", direction);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error("message_logs fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }

  // Stats
  const [totalResult, incomingResult, outgoingResult, todayResult] =
    await Promise.all([
      adminDb.from("message_logs").select("*", { count: "exact", head: true }),
      adminDb
        .from("message_logs")
        .select("*", { count: "exact", head: true })
        .eq("direction", "incoming"),
      adminDb
        .from("message_logs")
        .select("*", { count: "exact", head: true })
        .eq("direction", "outgoing"),
      adminDb
        .from("message_logs")
        .select("*", { count: "exact", head: true })
        .gte(
          "created_at",
          new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
        ),
    ]);

  return NextResponse.json({
    messages: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
    stats: {
      totalMessages: totalResult.count || 0,
      incoming: incomingResult.count || 0,
      outgoing: outgoingResult.count || 0,
      messagesToday: todayResult.count || 0,
    },
  });
}
