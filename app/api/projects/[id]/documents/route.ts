import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { withCors, handleCorsOptions } from "@/lib/cors";
import {
  CreateDocumentSchema,
  UpdateDocumentSchema,
  verifyProjectOwnership,
  verifyCollectionOwnership,
  verifyDocumentOwnership,
  transformDocument,
  unauthorizedResponse,
  notFoundResponse,
  badRequestResponse,
  serverErrorResponse,
} from "./helpers";

export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * GET /api/projects/[id]/documents?collectionId=xxx&page=1&limit=20&search=xxx
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) return unauthorizedResponse();

    const { id: projectId } = await params;
    const supabase = await createClient();

    if (!(await verifyProjectOwnership(supabase, projectId, uid))) {
      return notFoundResponse("Project not found");
    }

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20", 10),
      100,
    );
    const search = searchParams.get("search") || "";
    const ownerType = searchParams.get("ownerType");

    if (!collectionId) {
      return badRequestResponse("collectionId is required");
    }

    if (!(await verifyCollectionOwnership(supabase, collectionId, projectId))) {
      return notFoundResponse("Collection not found");
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from("app_documents")
      .select("id, data, owner_type, owner_id, created_at, updated_at", {
        count: "exact",
      })
      .eq("collection_id", collectionId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (ownerType) {
      query = query.eq("owner_type", ownerType);
    }

    const { data: documents, error: docsError, count } = await query;

    if (docsError) {
      console.error("Failed to fetch documents:", docsError);
      return serverErrorResponse("Failed to fetch documents");
    }

    let filteredDocs = (documents || []).map(transformDocument);

    if (search) {
      const searchLower = search.toLowerCase();
      filteredDocs = filteredDocs.filter((doc) =>
        JSON.stringify(doc.data).toLowerCase().includes(searchLower),
      );
    }

    return withCors(
      NextResponse.json({
        documents: filteredDocs,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }),
    );
  } catch (error) {
    console.error("Documents GET error:", error);
    return serverErrorResponse();
  }
}

/**
 * POST /api/projects/[id]/documents
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) return unauthorizedResponse();

    const { id: projectId } = await params;
    const supabase = await createClient();

    if (!(await verifyProjectOwnership(supabase, projectId, uid))) {
      return notFoundResponse("Project not found");
    }

    const body = await request.json();
    const parsed = CreateDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse("Validation error", parsed.error.errors);
    }

    if (
      !(await verifyCollectionOwnership(
        supabase,
        parsed.data.collectionId,
        projectId,
      ))
    ) {
      return notFoundResponse("Collection not found");
    }

    const { data: doc, error: insertError } = await supabase
      .from("app_documents")
      .insert({
        collection_id: parsed.data.collectionId,
        data: parsed.data.data,
        owner_type: "global",
        owner_id: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create document:", insertError);
      return serverErrorResponse("Failed to create document");
    }

    return withCors(NextResponse.json({ document: transformDocument(doc) }));
  } catch (error) {
    console.error("Documents POST error:", error);
    return serverErrorResponse();
  }
}

/**
 * PUT /api/projects/[id]/documents
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) return unauthorizedResponse();

    const { id: projectId } = await params;
    const supabase = await createClient();

    if (!(await verifyProjectOwnership(supabase, projectId, uid))) {
      return notFoundResponse("Project not found");
    }

    const body = await request.json();
    const parsed = UpdateDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return badRequestResponse("Validation error", parsed.error.errors);
    }

    if (
      !(await verifyDocumentOwnership(
        supabase,
        parsed.data.documentId,
        projectId,
      ))
    ) {
      return notFoundResponse("Document not found");
    }

    const { data: updated, error: updateError } = await supabase
      .from("app_documents")
      .update({ data: parsed.data.data })
      .eq("id", parsed.data.documentId)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update document:", updateError);
      return serverErrorResponse("Failed to update document");
    }

    return withCors(
      NextResponse.json({ document: transformDocument(updated) }),
    );
  } catch (error) {
    console.error("Documents PUT error:", error);
    return serverErrorResponse();
  }
}

/**
 * DELETE /api/projects/[id]/documents
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) return unauthorizedResponse();

    const { id: projectId } = await params;
    const supabase = await createClient();

    if (!(await verifyProjectOwnership(supabase, projectId, uid))) {
      return notFoundResponse("Project not found");
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return badRequestResponse("documentId is required");
    }

    if (!(await verifyDocumentOwnership(supabase, documentId, projectId))) {
      return notFoundResponse("Document not found");
    }

    const { error: deleteError } = await supabase
      .from("app_documents")
      .delete()
      .eq("id", documentId);

    if (deleteError) {
      console.error("Failed to delete document:", deleteError);
      return serverErrorResponse("Failed to delete document");
    }

    return withCors(NextResponse.json({ success: true }));
  } catch (error) {
    console.error("Documents DELETE error:", error);
    return serverErrorResponse();
  }
}
