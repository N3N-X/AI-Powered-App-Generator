import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { withCors } from "@/lib/cors";
import { z } from "zod";

// --- Validation Schemas ---

export const CreateDocumentSchema = z.object({
  collectionId: z.string(),
  data: z.record(z.unknown()),
});

export const UpdateDocumentSchema = z.object({
  documentId: z.string(),
  data: z.record(z.unknown()),
});

// --- Types ---

export type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// --- Helpers ---

export async function verifyProjectOwnership(
  supabase: SupabaseClient,
  projectId: string,
  uid: string,
) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();

  if (error || !project || project.user_id !== uid) {
    return null;
  }
  return project;
}

export async function verifyCollectionOwnership(
  supabase: SupabaseClient,
  collectionId: string,
  projectId: string,
) {
  const { data: collection, error } = await supabase
    .from("app_collections")
    .select("id, project_id")
    .eq("id", collectionId)
    .eq("project_id", projectId)
    .single();

  if (error || !collection) return null;
  return collection;
}

export async function verifyDocumentOwnership(
  supabase: SupabaseClient,
  documentId: string,
  projectId: string,
) {
  const { data: doc } = await supabase
    .from("app_documents")
    .select("id, collection_id, app_collections!inner(project_id)")
    .eq("id", documentId)
    .single();

  if (!doc || (doc as any).app_collections?.project_id !== projectId) {
    return null;
  }
  return doc;
}

export function transformDocument(doc: {
  id: string;
  data: unknown;
  owner_type: string;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: doc.id,
    data: doc.data,
    ownerType: doc.owner_type,
    ownerId: doc.owner_id,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  };
}

// --- Common Responses ---

export function unauthorizedResponse() {
  return withCors(
    NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  );
}

export function notFoundResponse(entity = "Not found") {
  return withCors(
    NextResponse.json({ error: entity }, { status: 404 }),
  );
}

export function badRequestResponse(error: string, details?: unknown) {
  return withCors(
    NextResponse.json(
      details ? { error, details } : { error },
      { status: 400 },
    ),
  );
}

export function serverErrorResponse(error = "Internal server error") {
  return withCors(
    NextResponse.json({ error }, { status: 500 }),
  );
}
