import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { withCors, handleCorsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * GET /api/projects/[id]/users?page=1&limit=20&search=xxx
 * Returns paginated app_users for a project (read-only)
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
      parseInt(searchParams.get("limit") || "20", 10),
      100,
    );
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("app_users")
      .select(
        "id, email, name, avatar_url, email_verified, metadata, created_at, updated_at",
        { count: "exact" },
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Search by email or name
    if (search) {
      query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data: users, error: usersError, count } = await query;

    if (usersError) {
      console.error("Failed to fetch app users:", usersError);
      return withCors(
        NextResponse.json({ error: "Failed to fetch users" }, { status: 500 }),
      );
    }

    const transformedUsers = (users || []).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      avatarUrl: u.avatar_url,
      emailVerified: u.email_verified,
      metadata: u.metadata,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));

    return withCors(
      NextResponse.json({
        users: transformedUsers,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }),
    );
  } catch (error) {
    console.error("Users API error:", error);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    );
  }
}
