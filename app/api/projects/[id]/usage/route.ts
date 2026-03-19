import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { withCors, handleCorsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * GET /api/projects/[id]/usage?page=1&limit=50&service=db&from=2024-01-01&to=2024-12-31
 * Returns proxy usage stats and recent log entries for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return withCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }

    const { id: projectId } = await params;
    const supabase = await createClient();

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project || project.user_id !== uid) {
      return withCors(
        NextResponse.json({ error: "Project not found" }, { status: 404 }),
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "50", 10),
      200,
    );
    const service = searchParams.get("service"); // filter by service type
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const offset = (page - 1) * limit;

    // Aggregated stats
    const { data: statsData } = await supabase
      .from("proxy_usage")
      .select("service, credits_used")
      .eq("project_id", projectId);

    const stats = {
      totalCalls: statsData?.length || 0,
      totalCredits: (statsData || []).reduce(
        (sum, r) => sum + (r.credits_used || 0),
        0,
      ),
      byService: {} as Record<string, { calls: number; credits: number }>,
    };

    for (const row of statsData || []) {
      const svc = row.service || "unknown";
      if (!stats.byService[svc]) {
        stats.byService[svc] = { calls: 0, credits: 0 };
      }
      stats.byService[svc].calls += 1;
      stats.byService[svc].credits += row.credits_used || 0;
    }

    // Recent log entries (paginated)
    let logsQuery = supabase
      .from("proxy_usage")
      .select("id, service, operation, credits_used, metadata, created_at", {
        count: "exact",
      })
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (service) {
      logsQuery = logsQuery.eq("service", service);
    }
    if (fromDate) {
      logsQuery = logsQuery.gte("created_at", fromDate);
    }
    if (toDate) {
      logsQuery = logsQuery.lte("created_at", toDate);
    }

    const { data: logs, error: logsError, count } = await logsQuery;

    if (logsError) {
      console.error("Failed to fetch usage logs:", logsError);
      return withCors(
        NextResponse.json(
          { error: "Failed to fetch usage data" },
          { status: 500 },
        ),
      );
    }

    const transformedLogs = (logs || []).map((log) => ({
      id: log.id,
      service: log.service,
      operation: log.operation,
      creditsUsed: log.credits_used,
      metadata: log.metadata,
      createdAt: log.created_at,
    }));

    return withCors(
      NextResponse.json({
        stats,
        logs: transformedLogs,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }),
    );
  } catch (error) {
    console.error("Usage API error:", error);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    );
  }
}
