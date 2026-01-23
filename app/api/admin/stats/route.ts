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
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    // Get user statistics
    const [
      totalUsers,
      freeUsers,
      proUsers,
      eliteUsers,
      totalProjects,
      totalBuilds,
      recentSignups,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plan: "FREE" } }),
      prisma.user.count({ where: { plan: "PRO" } }),
      prisma.user.count({ where: { plan: "ELITE" } }),
      prisma.project.count(),
      prisma.build.count(),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          createdAt: true,
        },
      }),
    ]);

    // Get credit usage stats
    const creditStats = await prisma.user.aggregate({
      _sum: {
        totalCreditsUsed: true,
        credits: true,
      },
      _avg: {
        credits: true,
        totalCreditsUsed: true,
      },
    });

    // Get build statistics
    const buildStats = await prisma.build.groupBy({
      by: ["status"],
      _count: true,
    });

    // Calculate revenue estimate (rough)
    const monthlyRevenue = proUsers * 19 + eliteUsers * 49;

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
        byStatus: buildStats.reduce(
          (acc, stat) => ({
            ...acc,
            [stat.status.toLowerCase()]: stat._count,
          }),
          {},
        ),
      },
      credits: {
        totalUsed: creditStats._sum.totalCreditsUsed || 0,
        totalRemaining: creditStats._sum.credits || 0,
        avgPerUser: Math.round(creditStats._avg.totalCreditsUsed || 0),
      },
      revenue: {
        monthlyEstimate: monthlyRevenue,
      },
      recentSignups,
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
