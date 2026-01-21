import { NextRequest } from "next/server";
import {
  extractProxyAuth,
  checkProxyRateLimit,
  logProxyUsage,
  hasServiceAccess,
  proxyError,
  proxySuccess,
  proxyCorsOptions,
} from "@/lib/proxy";

// Handle CORS preflight requests
export async function OPTIONS() {
  return proxyCorsOptions();
}
import {
  StorageUploadRequestSchema,
  StorageListRequestSchema,
} from "@/types/proxy";
import { ProxyService } from "@prisma/client";
import prisma from "@/lib/db";
import { randomBytes } from "crypto";

/**
 * @swagger
 * /api/proxy/storage:
 *   post:
 *     summary: File Storage - Get Upload URL
 *     description: |
 *       Get a presigned URL for uploading files to the platform's storage.
 *       Generated apps can store files without needing their own S3/cloud storage.
 *
 *       **Authentication:** Requires a valid RUX API key.
 *
 *       **Rate Limits:** 100 requests per minute per project.
 *
 *       **File Size Limits:** Max 50MB per file.
 *
 *       **Storage Limits:** Based on plan (FREE: 100MB, PRO: 1GB, ELITE: 10GB).
 *     tags:
 *       - Proxy Services
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - contentType
 *               - size
 *             properties:
 *               filename:
 *                 type: string
 *                 description: Original filename
 *               contentType:
 *                 type: string
 *                 description: MIME type of the file
 *               size:
 *                 type: integer
 *                 maximum: 52428800
 *                 description: File size in bytes (max 50MB)
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *                 description: Whether the file should be publicly accessible
 *     responses:
 *       200:
 *         description: Upload URL generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 uploadUrl:
 *                   type: string
 *                   description: Presigned URL for uploading the file
 *                 fileUrl:
 *                   type: string
 *                   description: URL where the file will be accessible after upload
 *                 fileId:
 *                   type: string
 *                   description: Unique file identifier
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *                   description: When the upload URL expires
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid or missing API key
 *       413:
 *         description: File too large
 *       429:
 *         description: Rate limit exceeded
 *   get:
 *     summary: File Storage - List Files
 *     description: |
 *       List files stored for the project.
 *
 *       **Authentication:** Requires a valid RUX API key.
 *     tags:
 *       - Proxy Services
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *         description: Filter files by prefix
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *           default: 20
 *         description: Maximum number of files to return
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Pagination cursor
 *     responses:
 *       200:
 *         description: List of files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       filename:
 *                         type: string
 *                       contentType:
 *                         type: string
 *                       size:
 *                         type: integer
 *                       url:
 *                         type: string
 *                       isPublic:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                 nextCursor:
 *                   type: string
 *                 totalCount:
 *                   type: integer
 *   delete:
 *     summary: File Storage - Delete File
 *     description: |
 *       Delete a file from storage.
 *
 *       **Authentication:** Requires a valid RUX API key.
 *     tags:
 *       - Proxy Services
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileId
 *             properties:
 *               fileId:
 *                 type: string
 *                 description: ID of the file to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 */

const STORAGE_LIMITS = {
  FREE: 100 * 1024 * 1024, // 100MB
  PRO: 1024 * 1024 * 1024, // 1GB
  ELITE: 10 * 1024 * 1024 * 1024, // 10GB
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Authenticate
  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { apiKeyId, projectId, userId, plan, services } = auth.context;

  // Check service access
  if (!hasServiceAccess(services, ProxyService.STORAGE)) {
    return proxyError(
      "This API key does not have access to the Storage service",
      "FORBIDDEN",
      403,
    );
  }

  // Check rate limit
  const rateLimit = await checkProxyRateLimit(projectId, "storage");
  if (!rateLimit.success) {
    return proxyError(
      `Rate limit exceeded. Try again in ${Math.ceil((rateLimit.reset - Date.now()) / 1000)}s`,
      "RATE_LIMITED",
      429,
    );
  }

  // Parse request
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

  const { filename, contentType, size, isPublic } = parsed.data;

  // Check current storage usage
  const currentUsage = await prisma.storageFile.aggregate({
    where: { projectId, deletedAt: null },
    _sum: { size: true },
  });

  const usedStorage = currentUsage._sum.size || 0;
  const storageLimit = STORAGE_LIMITS[plan];

  if (usedStorage + size > storageLimit) {
    return proxyError(
      `Storage limit exceeded. Used: ${Math.round(usedStorage / 1024 / 1024)}MB, Limit: ${Math.round(storageLimit / 1024 / 1024)}MB`,
      "STORAGE_LIMIT_EXCEEDED",
      413,
    );
  }

  // Generate file key and ID
  const fileId = randomBytes(16).toString("hex");
  const fileExtension = filename.split(".").pop() || "";
  const key = `${projectId}/${fileId}${fileExtension ? `.${fileExtension}` : ""}`;
  const bucket = process.env.STORAGE_BUCKET || "rux-storage";

  // For now, we'll use a simple approach that stores files in the database
  // In production, this would integrate with S3/R2/etc.
  const storageProvider = process.env.STORAGE_PROVIDER || "local";

  let uploadUrl: string;
  let fileUrl: string;

  if (storageProvider === "s3" || storageProvider === "r2") {
    // TODO: Implement S3/R2 presigned URL generation
    // const s3Client = new S3Client({ ... });
    // uploadUrl = await getSignedUrl(s3Client, new PutObjectCommand({ Bucket: bucket, Key: key }));
    return proxyError(
      "S3/R2 storage not yet configured",
      "SERVICE_UNAVAILABLE",
      503,
    );
  } else {
    // Local/development mode - use internal upload endpoint
    uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/proxy/storage/upload?fileId=${fileId}`;
    fileUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/proxy/storage/file/${fileId}`;
  }

  // Create file record (pending upload)
  await prisma.storageFile.create({
    data: {
      id: fileId,
      filename,
      contentType,
      size,
      bucket,
      key,
      url: isPublic ? fileUrl : null,
      isPublic,
      projectId,
      userId,
    },
  });

  // Log usage
  await logProxyUsage({
    apiKeyId,
    projectId,
    userId,
    service: ProxyService.STORAGE,
    operation: "upload.request",
    creditsUsed: 0, // Credits charged on actual upload
    success: true,
    metadata: { filename, contentType, size, fileId },
    latencyMs: Date.now() - startTime,
  });

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  return proxySuccess({
    success: true,
    uploadUrl,
    fileUrl,
    fileId,
    expiresAt: expiresAt.toISOString(),
  });
}

export async function GET(request: NextRequest) {
  // Authenticate
  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { projectId, services } = auth.context;

  // Check service access
  if (!hasServiceAccess(services, ProxyService.STORAGE)) {
    return proxyError(
      "This API key does not have access to the Storage service",
      "FORBIDDEN",
      403,
    );
  }

  // Parse query params
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

  // Build query
  const where: {
    projectId: string;
    deletedAt: null;
    filename?: { startsWith: string };
  } = {
    projectId,
    deletedAt: null,
  };

  if (prefix) {
    where.filename = { startsWith: prefix };
  }

  // Get files
  const files = await prisma.storageFile.findMany({
    where,
    take: limit + 1, // Get one extra to check for more
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      contentType: true,
      size: true,
      url: true,
      isPublic: true,
      createdAt: true,
    },
  });

  // Check if there are more results
  const hasMore = files.length > limit;
  const resultFiles = hasMore ? files.slice(0, limit) : files;
  const nextCursor = hasMore ? resultFiles[resultFiles.length - 1]?.id : null;

  // Get total count
  const totalCount = await prisma.storageFile.count({ where });

  return proxySuccess({
    files: resultFiles,
    nextCursor,
    totalCount,
  });
}

export async function DELETE(request: NextRequest) {
  const startTime = Date.now();

  // Authenticate
  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { apiKeyId, projectId, userId, services } = auth.context;

  // Check service access
  if (!hasServiceAccess(services, ProxyService.STORAGE)) {
    return proxyError(
      "This API key does not have access to the Storage service",
      "FORBIDDEN",
      403,
    );
  }

  // Parse request
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

  // Find file
  const file = await prisma.storageFile.findFirst({
    where: { id: fileId, projectId, deletedAt: null },
  });

  if (!file) {
    return proxyError("File not found", "NOT_FOUND", 404);
  }

  // Soft delete the file
  await prisma.storageFile.update({
    where: { id: fileId },
    data: { deletedAt: new Date() },
  });

  // TODO: Actually delete from S3/R2 in production

  // Log usage
  await logProxyUsage({
    apiKeyId,
    projectId,
    userId,
    service: ProxyService.STORAGE,
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
