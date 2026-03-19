import { NextRequest } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { handleCorsOptions } from "@/lib/cors";
import { randomBytes } from "crypto";
import { uploadToR2, deleteFromR2, getPublicUrl } from "@/lib/storage";
import {
  authenticateAndVerifyProject,
  getStorageUsage,
  getStorageLimit,
  corsError,
  corsJson,
} from "./helpers";

export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * POST /api/projects/[id]/images
 * Upload an image via multipart/form-data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const auth = await authenticateAndVerifyProject(request, params);
    if ("error" in auth) return auth.error;

    const { uid, projectId, supabase, plan } = auth;

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return corsError("No file provided", 400);
    }

    if (!file.type.startsWith("image/")) {
      return corsError("Only image files are allowed", 400);
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return corsError("File too large (max 10MB)", 413);
    }

    // Check storage quota
    const usedStorage = await getStorageUsage(supabase, projectId);
    const storageLimit = getStorageLimit(plan);

    if (usedStorage + file.size > storageLimit) {
      return corsError(
        `Storage limit exceeded. Used: ${Math.round(usedStorage / 1024 / 1024)}MB, Limit: ${Math.round(storageLimit / 1024 / 1024)}MB`,
        413,
      );
    }

    // Generate file ID and key
    const fileId = randomBytes(16).toString("hex");
    const ext = file.name.split(".").pop() || "";
    const key = `${projectId}/${fileId}${ext ? `.${ext}` : ""}`;

    // Upload to R2
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(key, buffer, file.type);

    const fileUrl = getPublicUrl(key);

    // Insert record into storage_files
    const { error: insertError } = await supabase.from("storage_files").insert({
      id: fileId,
      filename: file.name,
      content_type: file.type,
      size: file.size,
      bucket: process.env.STORAGE_BUCKET || "rux-storage",
      key,
      url: fileUrl,
      is_public: true,
      project_id: projectId,
      user_id: uid,
    });

    if (insertError) {
      console.error("Failed to create file record:", insertError);
      try {
        await deleteFromR2(key);
      } catch {}
      return corsError("Failed to save file record", 500);
    }

    return corsJson({
      success: true,
      file: {
        id: fileId,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        url: fileUrl,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Image upload error:", error);
    return corsError("Internal server error", 500);
  }
}

/**
 * GET /api/projects/[id]/images
 * List images for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const auth = await authenticateAndVerifyProject(request, params);
    if ("error" in auth) return auth.error;

    const { projectId, supabase, plan } = auth;
    const storageLimit = getStorageLimit(plan);

    // Fetch images
    const { data: files, error: filesError } = await supabase
      .from("storage_files")
      .select("id, filename, content_type, size, url, created_at")
      .eq("project_id", projectId)
      .ilike("content_type", "image/%")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (filesError) {
      console.error("Failed to fetch images:", filesError);
      return corsError("Failed to fetch images", 500);
    }

    const totalSize = await getStorageUsage(supabase, projectId);

    return corsJson({
      files: (files || []).map((f) => ({
        id: f.id,
        filename: f.filename,
        contentType: f.content_type,
        size: f.size,
        url: f.url,
        createdAt: f.created_at,
      })),
      totalSize,
      storageLimit,
      totalCount: files?.length || 0,
    });
  } catch (error) {
    console.error("Image list error:", error);
    return corsError("Internal server error", 500);
  }
}

/**
 * DELETE /api/projects/[id]/images
 * Soft-delete an image
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const auth = await authenticateAndVerifyProject(request, params);
    if ("error" in auth) return auth.error;

    const { projectId, supabase } = auth;

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return corsError("Invalid JSON body", 400);
    }

    const { fileId } = body;
    if (!fileId) {
      return corsError("fileId is required", 400);
    }

    // Find the file
    const { data: file, error: findError } = await supabase
      .from("storage_files")
      .select("id, key")
      .eq("id", fileId)
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .single();

    if (findError || !file) {
      return corsError("File not found", 404);
    }

    // Soft delete in DB
    const { error: updateError } = await supabase
      .from("storage_files")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", fileId);

    if (updateError) {
      console.error("Failed to delete file:", updateError);
      return corsError("Failed to delete file", 500);
    }

    // Delete from R2
    if (file.key) {
      try {
        await deleteFromR2(file.key);
      } catch (e) {
        console.error("Failed to delete from R2:", e);
      }
    }

    return corsJson({ success: true });
  } catch (error) {
    console.error("Image delete error:", error);
    return corsError("Internal server error", 500);
  }
}
