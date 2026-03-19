import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

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

    // Get user statistics
    const [
      totalUsersResult,
      freeUsersResult,
      proUsersResult,
      eliteUsersResult,
      totalProjectsResult,
      totalBuildsResult,
      recentSignupsResult,
      totalBlogPostsResult,
      publishedBlogPostsResult,
    ] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("plan", "FREE"),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("plan", "PRO"),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("plan", "ELITE"),
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase.from("builds").select("*", { count: "exact", head: true }),
      supabase
        .from("users")
        .select("id, email, name, plan, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("blog_posts").select("*", { count: "exact", head: true }),
      supabase
        .from("blog_posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "published"),
    ]);

    if (
      totalUsersResult.error ||
      freeUsersResult.error ||
      proUsersResult.error ||
      eliteUsersResult.error ||
      totalProjectsResult.error ||
      totalBuildsResult.error ||
      recentSignupsResult.error
    ) {
      console.error("Error fetching statistics:", {
        totalUsersResult: totalUsersResult.error,
        freeUsersResult: freeUsersResult.error,
        proUsersResult: proUsersResult.error,
        eliteUsersResult: eliteUsersResult.error,
        totalProjectsResult: totalProjectsResult.error,
        totalBuildsResult: totalBuildsResult.error,
        recentSignupsResult: recentSignupsResult.error,
      });
      return NextResponse.json(
        { error: "Failed to fetch statistics" },
        { status: 500 },
      );
    }

    const totalUsers = totalUsersResult.count || 0;
    const freeUsers = freeUsersResult.count || 0;
    const proUsers = proUsersResult.count || 0;
    const eliteUsers = eliteUsersResult.count || 0;
    const totalProjects = totalProjectsResult.count || 0;
    const totalBuilds = totalBuildsResult.count || 0;
    const recentSignups = recentSignupsResult.data || [];

    // Get credit usage stats - fetch all users and aggregate manually
    const { data: allUsers, error: allUsersError } = await supabase
      .from("users")
      .select("total_credits_used, credits");

    if (allUsersError) {
      console.error("Error fetching credit stats:", allUsersError);
      return NextResponse.json(
        { error: "Failed to fetch credit statistics" },
        { status: 500 },
      );
    }

    const creditStats = (allUsers || []).reduce(
      (acc, user) => {
        acc.totalCreditsUsed += user.total_credits_used || 0;
        acc.totalCreditsRemaining += user.credits || 0;
        acc.count += 1;
        return acc;
      },
      { totalCreditsUsed: 0, totalCreditsRemaining: 0, count: 0 },
    );

    const avgCreditsPerUser =
      creditStats.count > 0
        ? Math.round(creditStats.totalCreditsUsed / creditStats.count)
        : 0;

    // Get build statistics - group by status
    const { data: builds, error: buildsError } = await supabase
      .from("builds")
      .select("status");

    if (buildsError) {
      console.error("Error fetching build stats:", buildsError);
      return NextResponse.json(
        { error: "Failed to fetch build statistics" },
        { status: 500 },
      );
    }

    const buildStats = (builds || []).reduce(
      (acc, build) => {
        const status = build.status.toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Calculate revenue estimate (rough)
    const monthlyRevenue = proUsers * 19 + eliteUsers * 49;

    // Transform recentSignups to camelCase
    const recentSignupsCamelCase = recentSignups.map((signup) => ({
      id: signup.id,
      email: signup.email,
      name: signup.name,
      plan: signup.plan,
      createdAt: signup.created_at,
    }));

    return NextResponse.json({
      users: {
        total: totalUsers,
        byPlan: {
          free: freeUsers,
          pro: proUsers,
          elite: eliteUsers,
        },
      },
      projects: {
        total: totalProjects,
      },
      builds: {
        total: totalBuilds,
        byStatus: buildStats,
      },
      credits: {
        totalUsed: creditStats.totalCreditsUsed,
        totalRemaining: creditStats.totalCreditsRemaining,
        avgPerUser: avgCreditsPerUser,
      },
      revenue: {
        monthlyEstimate: monthlyRevenue,
      },
      blog: {
        total: totalBlogPostsResult.count || 0,
        published: publishedBlogPostsResult.count || 0,
      },
      recentSignups: recentSignupsCamelCase,
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
