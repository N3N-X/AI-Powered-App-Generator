import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { withCors } from "@/lib/cors";

/**
 * Verify project ownership. Returns project data or a CORS-wrapped error response.
 */
export async function verifyProjectOwnership(
  projectId: string,
  uid: string,
): Promise<
  | { project: { id: string; user_id: string }; error?: never }
  | { project?: never; error: NextResponse }
> {
  const supabase = await createClient();

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

  return { project };
}

/**
 * Fetch collections with document counts for a project.
 */
export async function fetchCollectionsWithCounts(projectId: string) {
  const supabase = await createClient();

  const { data: collections, error: collectionsError } = await supabase
    .from("app_collections")
    .select("id, name, created_at, updated_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (collectionsError) {
    return { collections: null, error: collectionsError };
  }

  const collectionsWithCounts = await Promise.all(
    (collections || []).map(async (col) => {
      const { count: totalCount } = await supabase
        .from("app_documents")
        .select("id", { count: "exact", head: true })
        .eq("collection_id", col.id);

      const { count: globalCount } = await supabase
        .from("app_documents")
        .select("id", { count: "exact", head: true })
        .eq("collection_id", col.id)
        .eq("owner_type", "global");

      const { count: userCount } = await supabase
        .from("app_documents")
        .select("id", { count: "exact", head: true })
        .eq("collection_id", col.id)
        .eq("owner_type", "user");

      return {
        id: col.id,
        name: col.name,
        documentCount: totalCount || 0,
        globalCount: globalCount || 0,
        userCount: userCount || 0,
        createdAt: col.created_at,
        updatedAt: col.updated_at,
      };
    }),
  );

  return { collections: collectionsWithCounts, error: null };
}
