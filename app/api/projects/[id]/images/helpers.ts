import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withCors } from "@/lib/cors";
import { getStorageLimit, getStorageUsage } from "@/lib/storage";

/**
 * Authenticate user and verify project ownership.
 * Returns the uid, projectId, supabase client, and user plan,
 * or an error response if any check fails.
 */
export async function authenticateAndVerifyProject(
  request: NextRequest,
  params: Promise<{ id: string }>,
): Promise<
  | {
      uid: string;
      projectId: string;
      supabase: ReturnType<typeof createAdminClient>;
      plan: string;
      error?: undefined;
    }
  | { error: NextResponse }
> {
  const { uid } = await getAuthenticatedUser(request);
  if (!uid) {
    return {
      error: withCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      ),
    };
  }

  const { id: projectId } = await params;
  const supabase = createAdminClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return {
      error: withCors(
        NextResponse.json({ error: "Project not found" }, { status: 404 }),
      ),
    };
  }

  if (project.user_id !== uid) {
    return {
      error: withCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      ),
    };
  }

  const { data: user } = await supabase
    .from("users")
    .select("plan")
    .eq("id", uid)
    .single();

  const plan = (user?.plan as string) || "FREE";

  return { uid, projectId, supabase, plan };
}

/**
 * Get current storage usage for a project.
 */
export { getStorageUsage, getStorageLimit };

/**
 * Return a JSON error wrapped with CORS headers.
 */
export function corsError(message: string, status: number): NextResponse {
  return withCors(NextResponse.json({ error: message }, { status }));
}

/**
 * Return a JSON success response wrapped with CORS headers.
 */
export function corsJson(data: unknown, status = 200): NextResponse {
  return withCors(NextResponse.json(data, { status }));
}
