import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { withCors, handleCorsOptions } from "@/lib/cors";
import { z } from "zod";
import { verifyProjectOwnership, fetchCollectionsWithCounts } from "./helpers";

export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * GET /api/projects/[id]/collections
 * Returns collections with document counts for a project
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
    const result = await verifyProjectOwnership(projectId, uid);
    if (result.error) return result.error;

    const { collections, error: collectionsError } =
      await fetchCollectionsWithCounts(projectId);

    if (collectionsError) {
      console.error("Failed to fetch collections:", collectionsError);
      return withCors(
        NextResponse.json(
          { error: "Failed to fetch collections" },
          { status: 500 },
        ),
      );
    }

    return withCors(NextResponse.json({ collections }));
  } catch (error) {
    console.error("Collections API error:", error);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    );
  }
}

const CreateCollectionSchema = z.object({
  name: z.string().min(1).max(100),
});

/**
 * POST /api/projects/[id]/collections
 * Create a new collection for a project
 */
export async function POST(
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
    const result = await verifyProjectOwnership(projectId, uid);
    if (result.error) return result.error;

    const body = await request.json();
    const parsed = CreateCollectionSchema.safeParse(body);
    if (!parsed.success) {
      return withCors(
        NextResponse.json(
          { error: "Invalid collection name" },
          { status: 400 },
        ),
      );
    }

    const supabase = await createClient();

    // Check for duplicate name
    const { data: existing } = await supabase
      .from("app_collections")
      .select("id")
      .eq("project_id", projectId)
      .eq("name", parsed.data.name)
      .single();

    if (existing) {
      return withCors(
        NextResponse.json(
          { error: "A collection with that name already exists" },
          { status: 409 },
        ),
      );
    }

    const { data: collection, error: insertError } = await supabase
      .from("app_collections")
      .insert({
        project_id: projectId,
        name: parsed.data.name,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create collection:", insertError);
      return withCors(
        NextResponse.json(
          { error: "Failed to create collection" },
          { status: 500 },
        ),
      );
    }

    return withCors(
      NextResponse.json({
        collection: {
          id: collection.id,
          name: collection.name,
          documentCount: 0,
          globalCount: 0,
          userCount: 0,
          createdAt: collection.created_at,
        },
      }),
    );
  } catch (error) {
    console.error("Collections POST error:", error);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    );
  }
}

/**
 * DELETE /api/projects/[id]/collections?collectionId=xxx
 * Delete a collection and all its documents
 */
export async function DELETE(
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
    const result = await verifyProjectOwnership(projectId, uid);
    if (result.error) return result.error;

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");

    if (!collectionId) {
      return withCors(
        NextResponse.json(
          { error: "collectionId is required" },
          { status: 400 },
        ),
      );
    }

    const supabase = await createClient();

    // Verify collection belongs to this project
    const { data: collection } = await supabase
      .from("app_collections")
      .select("id")
      .eq("id", collectionId)
      .eq("project_id", projectId)
      .single();

    if (!collection) {
      return withCors(
        NextResponse.json({ error: "Collection not found" }, { status: 404 }),
      );
    }

    // Delete all documents in the collection first
    await supabase
      .from("app_documents")
      .delete()
      .eq("collection_id", collectionId);

    // Delete the collection
    const { error: deleteError } = await supabase
      .from("app_collections")
      .delete()
      .eq("id", collectionId);

    if (deleteError) {
      console.error("Failed to delete collection:", deleteError);
      return withCors(
        NextResponse.json(
          { error: "Failed to delete collection" },
          { status: 500 },
        ),
      );
    }

    return withCors(NextResponse.json({ success: true }));
  } catch (error) {
    console.error("Collections DELETE error:", error);
    return withCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
    );
  }
}
