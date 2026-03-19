import { NextRequest } from "next/server";
import {
  extractProxyAuth,
  logProxyUsage,
  hasServiceAccess,
  proxyError,
  proxySuccess,
} from "@/lib/proxy";
import { StorageListRequestSchema } from "@/types/proxy";
import { createAdminClient } from "@/lib/supabase/server";
import { deleteFromR2 } from "@/lib/storage";

export async function handleStorageList(request: NextRequest) {
  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { projectId, services } = auth.context;

  if (!hasServiceAccess(services, "storage")) {
    return proxyError(
      "This API key does not have access to the Storage service",
      "FORBIDDEN",
      403,
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = StorageListRequestSchema.safeParse({
    prefix: searchParams.get("prefix") || undefined,
    limit: searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined,
    cursor: searchParams.get("cursor") || undefined,
  });

  if (!parsed.success) {
    return proxyError(
      `Validation error: ${parsed.error.errors[0]?.message}`,
      "VALIDATION_ERROR",
      400,
    );
  }

  const { prefix, limit, cursor } = parsed.data;
  const supabase = createAdminClient();

  let query = supabase
    .from("storage_files")
    .select("id, filename, content_type, size, url, is_public, created_at")
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (prefix) query = query.ilike("filename", `${prefix}%`);
  if (cursor) query = query.gt("id", cursor);
  query = query.limit(limit + 1);

  const { data: files, error: filesError } = await query;

  if (filesError) {
    console.error("Failed to fetch storage files:", filesError);
    return proxyError("Failed to fetch files", "DATABASE_ERROR", 500);
  }

  const hasMore = files.length > limit;
  const resultFiles = hasMore ? files.slice(0, limit) : files;
  const nextCursor = hasMore ? resultFiles[resultFiles.length - 1]?.id : null;

  let countQuery = supabase
    .from("storage_files")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)
    .is("deleted_at", null);

  if (prefix) countQuery = countQuery.ilike("filename", `${prefix}%`);

  const { count: totalCount, error: countError } = await countQuery;
  if (countError) console.error("Failed to count storage files:", countError);

  const transformedFiles = resultFiles.map((file) => ({
    id: file.id,
    filename: file.filename,
    contentType: file.content_type,
    size: file.size,
    url: file.url,
    isPublic: file.is_public,
    createdAt: file.created_at,
  }));

  return proxySuccess({
    files: transformedFiles,
    nextCursor,
    totalCount: totalCount || 0,
  });
}

export async function handleStorageDelete(request: NextRequest) {
  const startTime = Date.now();

  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { apiKeyId, projectId, userId, services } = auth.context;

  if (!hasServiceAccess(services, "storage")) {
    return proxyError(
      "This API key does not have access to the Storage service",
      "FORBIDDEN",
      403,
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return proxyError("Invalid JSON body", "INVALID_REQUEST", 400);
  }

  const { fileId } = body;
  if (!fileId) {
    return proxyError("fileId is required", "VALIDATION_ERROR", 400);
  }

  const supabase = createAdminClient();

  const { data: file, error: findError } = await supabase
    .from("storage_files")
    .select("*")
    .eq("id", fileId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .single();

  if (findError || !file) {
    return proxyError("File not found", "NOT_FOUND", 404);
  }

  const { error: updateError } = await supabase
    .from("storage_files")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", fileId);

  if (updateError) {
    console.error("Failed to delete storage file:", updateError);
    return proxyError("Failed to delete file", "DATABASE_ERROR", 500);
  }

  const storageProvider = process.env.STORAGE_PROVIDER || "local";
  if ((storageProvider === "s3" || storageProvider === "r2") && file.key) {
    try {
      await deleteFromR2(file.key);
    } catch (e) {
      console.error("Failed to delete from R2:", e);
    }
  }

  await logProxyUsage({
    apiKeyId,
    projectId,
    userId,
    service: "storage",
    operation: "delete",
    creditsUsed: 0,
    success: true,
    metadata: { fileId, filename: file.filename },
    latencyMs: Date.now() - startTime,
  });

  return proxySuccess({
    success: true,
    deleted: fileId,
  });
}
