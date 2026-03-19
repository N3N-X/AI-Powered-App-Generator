import { NextRequest } from "next/server";
import {
  extractProxyAuth,
  checkProxyRateLimit,
  logProxyUsage,
  hasServiceAccess,
  proxyError,
  proxySuccess,
} from "@/lib/proxy";
import { StorageUploadRequestSchema } from "@/types/proxy";
import { getStorageConfig } from "@/lib/proxy-config";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { getPresignedUploadUrl, getPublicUrl } from "@/lib/storage";

export const STORAGE_LIMITS = {
  FREE: 100 * 1024 * 1024, // 100MB
  PRO: 1024 * 1024 * 1024, // 1GB
  ELITE: 10 * 1024 * 1024 * 1024, // 10GB
};

export async function handleStorageUpload(request: NextRequest) {
  const startTime = Date.now();

  // Authenticate
  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { apiKeyId, projectId, userId, plan, services } = auth.context;

  if (!hasServiceAccess(services, "storage")) {
    return proxyError(
      "This API key does not have access to the Storage service",
      "FORBIDDEN",
      403,
    );
  }

  const rateLimit = await checkProxyRateLimit(projectId, "storage");
  if (!rateLimit.success) {
    return proxyError(
      `Rate limit exceeded. Try again in ${Math.ceil((rateLimit.reset - Date.now()) / 1000)}s`,
      "RATE_LIMITED",
      429,
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return proxyError("Invalid JSON body", "INVALID_REQUEST", 400);
  }

  const parsed = StorageUploadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return proxyError(
      `Validation error: ${parsed.error.errors[0]?.message}`,
      "VALIDATION_ERROR",
      400,
    );
  }

  let { filename, contentType, size, isPublic } = parsed.data;

  // Apply proxy config defaults
  const storageConfig = await getStorageConfig(projectId);
  if (storageConfig) {
    if (isPublic === undefined || isPublic === null) {
      isPublic = storageConfig.defaultVisibility === "public";
    }
    const maxBytes = storageConfig.maxFileSizeMB * 1024 * 1024;
    if (size > maxBytes) {
      return proxyError(
        `File too large. Max: ${storageConfig.maxFileSizeMB}MB`,
        "FILE_TOO_LARGE",
        413,
      );
    }
    if (storageConfig.allowedMimeTypes.length > 0) {
      const allowed = storageConfig.allowedMimeTypes.some(
        (mime) =>
          contentType === mime ||
          (mime.endsWith("/*") &&
            contentType.startsWith(mime.replace("/*", "/"))),
      );
      if (!allowed) {
        return proxyError(
          `File type "${contentType}" is not allowed`,
          "INVALID_FILE_TYPE",
          400,
        );
      }
    }
  }

  const supabase = createAdminClient();

  const { data: aggregateData, error: aggregateError } = await supabase
    .from("storage_files")
    .select("size")
    .eq("project_id", projectId)
    .is("deleted_at", null);

  if (aggregateError) {
    console.error("Failed to aggregate storage usage:", aggregateError);
    return proxyError("Failed to check storage usage", "DATABASE_ERROR", 500);
  }

  const usedStorage =
    aggregateData?.reduce((sum, file) => sum + (file.size || 0), 0) || 0;
  const storageLimit = STORAGE_LIMITS[plan];

  if (usedStorage + size > storageLimit) {
    return proxyError(
      `Storage limit exceeded. Used: ${Math.round(usedStorage / 1024 / 1024)}MB, Limit: ${Math.round(storageLimit / 1024 / 1024)}MB`,
      "STORAGE_LIMIT_EXCEEDED",
      413,
    );
  }

  const fileId = randomBytes(16).toString("hex");
  const fileExtension = filename.split(".").pop() || "";
  const key = `${projectId}/${fileId}${fileExtension ? `.${fileExtension}` : ""}`;
  const bucket = process.env.STORAGE_BUCKET || "rux-storage";
  const storageProvider = process.env.STORAGE_PROVIDER || "local";

  let uploadUrl: string;
  let fileUrl: string;

  if (storageProvider === "s3" || storageProvider === "r2") {
    uploadUrl = await getPresignedUploadUrl(key, contentType);
    fileUrl = getPublicUrl(key);
  } else {
    uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/proxy/storage/upload?fileId=${fileId}`;
    fileUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/proxy/storage/file/${fileId}`;
  }

  const { error: createError } = await supabase.from("storage_files").insert({
    id: fileId,
    filename,
    content_type: contentType,
    size,
    bucket,
    key,
    url: isPublic ? fileUrl : null,
    is_public: isPublic,
    project_id: projectId,
    user_id: userId,
  });

  if (createError) {
    console.error("Failed to create storage file record:", createError);
    return proxyError("Failed to create file record", "DATABASE_ERROR", 500);
  }

  await logProxyUsage({
    apiKeyId,
    projectId,
    userId,
    service: "storage",
    operation: "upload.request",
    creditsUsed: 0,
    success: true,
    metadata: { filename, contentType, size, fileId },
    latencyMs: Date.now() - startTime,
  });

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  return proxySuccess({
    success: true,
    uploadUrl,
    fileUrl,
    fileId,
    expiresAt: expiresAt.toISOString(),
  });
}
