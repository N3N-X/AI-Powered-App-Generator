import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

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
    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .select("role")
      .eq("id", uid)
      .single();

    if (adminError || !adminUser || adminUser.role?.toUpperCase() !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const search = searchParams.get("search") || "";
    const plan = searchParams.get("plan")?.toLowerCase() as
      | "free"
      | "pro"
      | "elite"
      | null;

    // Build query for users
    let usersQuery = supabase
      .from("users")
      .select(
        `
        id,
        email,
        name,
        plan,
        role,
        credits,
        total_credits_used,
        created_at,
        updated_at
      `,
      )
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Apply search filter
    if (search) {
      usersQuery = usersQuery.or(
        `email.ilike.%${search}%,name.ilike.%${search}%`,
      );
    }

    // Apply plan filter
    if (plan) {
      usersQuery = usersQuery.eq("plan", plan);
    }

    // Build count query
    let countQuery = supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (search) {
      countQuery = countQuery.or(
        `email.ilike.%${search}%,name.ilike.%${search}%`,
      );
    }

    if (plan) {
      countQuery = countQuery.eq("plan", plan);
    }

    const [usersResult, countResult] = await Promise.all([
      usersQuery,
      countQuery,
    ]);

    if (usersResult.error) {
      console.error("Error fetching users:", usersResult.error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 },
      );
    }

    if (countResult.error) {
      console.error("Error counting users:", countResult.error);
      return NextResponse.json(
        { error: "Failed to count users" },
        { status: 500 },
      );
    }

    const users = usersResult.data || [];
    const total = countResult.count || 0;

    // Get project and build counts for each user
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const [projectsCount, buildsCount] = await Promise.all([
          supabase
            .from("projects")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .then((result) => result.count || 0),
          supabase
            .from("builds")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .then((result) => result.count || 0),
        ]);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
          role: user.role,
          credits: user.credits,
          totalCreditsUsed: user.total_credits_used,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          _count: {
            projects: projectsCount,
            builds: buildsCount,
          },
        };
      }),
    );

    return NextResponse.json({
      users: usersWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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
  plan: z
    .string()
    .transform((v) => v.toUpperCase())
    .pipe(z.enum(["FREE", "PRO", "ELITE"]))
    .optional(),
  role: z
    .string()
    .transform((v) => v.toUpperCase())
    .pipe(z.enum(["USER", "ADMIN"]))
    .optional(),
  credits: z.number().min(0).optional(),
});

export async function PATCH(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .select("role")
      .eq("id", uid)
      .single();

    if (adminError || !adminUser || adminUser.role?.toUpperCase() !== "ADMIN") {
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
      console.error("Error updating user:", updateError);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 },
      );
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
