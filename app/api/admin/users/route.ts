import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users (admin only)
 *     description: Returns a paginated list of all users with their details.
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *       - name: plan
 *         in: query
 *         schema:
 *           type: string
 *           enum: [FREE, PRO, ELITE]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
export async function GET(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const supabase = await createClient();
    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .select("role")
      .eq("id", uid)
      .single();

    if (adminError || !adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const search = searchParams.get("search") || "";
    const plan = searchParams.get("plan") as "FREE" | "PRO" | "ELITE" | null;

    // Build query
    let query = supabase
      .from("users")
      .select(
        "id, email, name, plan, role, credits, total_credits_used, created_at, updated_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }
    if (plan) {
      query = query.eq("plan", plan);
    }

    const { data: users, count: total, error: usersError } = await query;

    if (usersError) {
      throw usersError;
    }

    // Get counts for projects and builds per user
    const usersWithCounts = await Promise.all(
      (users || []).map(async (user) => {
        const { count: projectCount } = await supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        const { count: buildCount } = await supabase
          .from("builds")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        return {
          ...user,
          totalCreditsUsed: user.total_credits_used,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          _count: {
            projects: projectCount || 0,
            builds: buildCount || 0,
          },
        };
      }),
    );

    return NextResponse.json({
      users: usersWithCounts,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

const UpdateUserSchema = z.object({
  userId: z.string(),
  plan: z.enum(["FREE", "PRO", "ELITE"]).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  credits: z.number().min(0).optional(),
});

/**
 * @swagger
 * /api/admin/users:
 *   patch:
 *     summary: Update a user (admin only)
 *     description: Update a user's plan, role, or credits.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               plan:
 *                 type: string
 *                 enum: [FREE, PRO, ELITE]
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *               credits:
 *                 type: integer
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
export async function PATCH(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const supabase = await createClient();
    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .select("role")
      .eq("id", uid)
      .single();

    if (adminError || !adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const data = UpdateUserSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.plan !== undefined) updateData.plan = data.plan;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.credits !== undefined) updateData.credits = data.credits;

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", data.userId)
      .select("id, email, name, plan, role, credits")
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Admin user update error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}
