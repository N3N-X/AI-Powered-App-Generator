import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     description: Returns platform statistics for admins including user counts, credit usage, and project counts.
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Failed to fetch statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const supabase = await createClient();
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

    // Get user statistics
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const { count: freeUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("plan", "FREE");

    const { count: proUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("plan", "PRO");

    const { count: eliteUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("plan", "ELITE");

    const { count: totalProjects } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true });

    const { count: totalBuilds } = await supabase
      .from("builds")
      .select("*", { count: "exact", head: true });

    const { data: recentSignups } = await supabase
      .from("users")
      .select("id, email, name, plan, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    // Get credit usage stats - manually aggregate
    const { data: allUsers } = await supabase
      .from("users")
      .select("credits, total_credits_used");

    const creditStats = (allUsers || []).reduce(
      (acc, u) => ({
        totalUsed: acc.totalUsed + (u.total_credits_used || 0),
        totalRemaining: acc.totalRemaining + (u.credits || 0),
        count: acc.count + 1,
      }),
      { totalUsed: 0, totalRemaining: 0, count: 0 },
    );

    // Get build statistics - manually group
    const { data: allBuilds } = await supabase.from("builds").select("status");

    const buildStats = (allBuilds || []).reduce(
      (acc, b) => {
        acc[b.status.toLowerCase()] = (acc[b.status.toLowerCase()] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Calculate revenue estimate (rough)
    const monthlyRevenue = (proUsers || 0) * 19 + (eliteUsers || 0) * 49;

    return NextResponse.json({
      users: {
        total: totalUsers || 0,
        byPlan: {
          free: freeUsers || 0,
          pro: proUsers || 0,
          elite: eliteUsers || 0,
        },
      },
      projects: {
        total: totalProjects || 0,
      },
      builds: {
        total: totalBuilds || 0,
        byStatus: buildStats,
      },
      credits: {
        totalUsed: creditStats.totalUsed,
        totalRemaining: creditStats.totalRemaining,
        avgPerUser: Math.round(
          creditStats.count > 0 ? creditStats.totalUsed / creditStats.count : 0,
        ),
      },
      revenue: {
        monthlyEstimate: monthlyRevenue,
      },
      recentSignups: (recentSignups || []).map((u) => ({
        ...u,
        createdAt: u.created_at,
      })),
      maintenanceMode: process.env.MAINTENANCE_MODE === "true",
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 },
    );
  }
}
