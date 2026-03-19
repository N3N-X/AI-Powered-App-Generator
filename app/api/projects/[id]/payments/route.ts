import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { withCors, handleCorsOptions } from "@/lib/cors";
import { handleRevenueCat } from "./handle-revenuecat";
import { handleStripe } from "./handle-stripe";

export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * GET /api/projects/[id]/payments?type=overview|transactions|subscribers|products&page=1&limit=20&search=
 *
 * Returns payment data for the project's CRM tab.
 * - Mobile projects (IOS/ANDROID): pulls from RevenueCat REST API v1
 * - Web projects: pulls from Stripe API filtered by metadata.projectId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 20, window: 60_000 });
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
      .select("id, user_id, platform")
      .eq("id", projectId)
      .single();

    if (projectError || !project || project.user_id !== uid) {
      return withCors(
        NextResponse.json({ error: "Project not found" }, { status: 404 }),
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overview";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20", 10),
      100,
    );
    const search = searchParams.get("search") || "";

    const platform = (project.platform || "").toUpperCase();
    const isMobile = platform === "IOS" || platform === "ANDROID";

    if (isMobile) {
      return withCors(
        await handleRevenueCat(projectId, type, page, limit, search),
      );
    } else {
      return withCors(await handleStripe(projectId, type, page, limit, search));
    }
  } catch (error) {
    console.error("Payments CRM API error:", error);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    );
  }
}
