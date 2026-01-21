import { NextRequest } from "next/server";
import {
  extractProxyAuth,
  checkProxyRateLimit,
  checkCredits,
  deductCredits,
  logProxyUsage,
  hasServiceAccess,
  proxyError,
  proxySuccess,
} from "@/lib/proxy";
import { DatabaseProxyRequestSchema } from "@/types/proxy";
import { ProxyService, Prisma } from "@prisma/client";
import prisma from "@/lib/db";

/**
 * @swagger
 * /api/proxy/db:
 *   post:
 *     summary: Generic Database Proxy
 *     description: |
 *       Store any data in collections. Perfect for bookings, todos, products,
 *       or any other data your generated app needs.
 *
 *       **Authentication:** Requires a valid RUX API key.
 *
 *       **Rate Limits:** 100 operations per minute per project.
 *
 *       **Credits:** 1 credit per operation.
 *
 *       Data is automatically scoped to your project - you cannot access
 *       other projects' data.
 *     tags:
 *       - Proxy Services
 *     security:
 *       - ApiKeyAuth: []
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Authenticate
  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { apiKeyId, projectId, userId, plan, services } = auth.context;

  // Check service access
  if (!hasServiceAccess(services, ProxyService.DATABASE)) {
    return proxyError(
      "This API key does not have access to the Database service",
      "FORBIDDEN",
      403,
    );
  }

  // Check rate limit
  const rateLimit = await checkProxyRateLimit(projectId, "database");
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

  const parsed = DatabaseProxyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return proxyError(
      `Validation error: ${parsed.error.errors[0]?.message}`,
      "VALIDATION_ERROR",
      400,
    );
  }

  const { collection, operation, data, filter, options } = parsed.data;

  // Check credits (1 credit per operation)
  const creditCheck = await checkCredits(userId, plan, "database", 1);
  if (!creditCheck.hasCredits) {
    return proxyError(
      `Insufficient credits. Required: 1, Available: ${creditCheck.available}`,
      "INSUFFICIENT_CREDITS",
      402,
    );
  }

  try {
    let result: unknown;
    let count: number | undefined;

    // Get or create collection for this project
    const collectionRecord = await prisma.appCollection.upsert({
      where: {
        projectId_name: {
          projectId,
          name: collection,
        },
      },
      create: {
        projectId,
        name: collection,
      },
      update: {},
    });

    switch (operation) {
      case "create": {
        if (!data) {
          return proxyError(
            "Data is required for create operation",
            "VALIDATION_ERROR",
            400,
          );
        }
        const doc = await prisma.appDocument.create({
          data: {
            collectionId: collectionRecord.id,
            data: data as Prisma.InputJsonValue,
          },
        });
        result = {
          id: doc.id,
          ...data,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        };
        break;
      }

      case "findOne": {
        const docs = await prisma.appDocument.findMany({
          where: {
            collectionId: collectionRecord.id,
          },
          take: 100, // Fetch batch to filter in memory
        });

        // Filter documents by matching the filter against data JSON
        const found = docs.find((doc) =>
          matchesFilter(doc.data as Record<string, unknown>, filter),
        );
        result = found
          ? {
              id: found.id,
              ...(found.data as object),
              createdAt: found.createdAt,
              updatedAt: found.updatedAt,
            }
          : null;
        break;
      }

      case "findMany": {
        const limit = options?.limit ?? 20;
        const skip = options?.skip ?? 0;

        const docs = await prisma.appDocument.findMany({
          where: {
            collectionId: collectionRecord.id,
          },
          orderBy: { createdAt: "desc" },
          take: 500, // Max fetch for filtering
        });

        // Filter documents in memory
        let filtered = docs.filter((doc) =>
          matchesFilter(doc.data as Record<string, unknown>, filter),
        );

        // Apply sorting if specified
        if (options?.sort) {
          const sortEntries = Object.entries(options.sort);
          if (sortEntries.length > 0) {
            const [sortField, sortDir] = sortEntries[0];
            filtered.sort((a, b) => {
              const aVal = (a.data as Record<string, unknown>)[sortField];
              const bVal = (b.data as Record<string, unknown>)[sortField];
              if (aVal === bVal) return 0;
              if (aVal === null || aVal === undefined) return 1;
              if (bVal === null || bVal === undefined) return -1;
              const cmp = aVal < bVal ? -1 : 1;
              return sortDir === "asc" ? cmp : -cmp;
            });
          }
        }

        // Apply pagination
        const paginated = filtered.slice(skip, skip + limit);
        result = paginated.map((doc) => ({
          id: doc.id,
          ...(doc.data as object),
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        }));
        break;
      }

      case "update": {
        if (!data) {
          return proxyError(
            "Data is required for update operation",
            "VALIDATION_ERROR",
            400,
          );
        }

        const docs = await prisma.appDocument.findMany({
          where: { collectionId: collectionRecord.id },
          take: 100,
        });

        const toUpdate = docs.find((doc) =>
          matchesFilter(doc.data as Record<string, unknown>, filter),
        );
        if (!toUpdate) {
          result = null;
        } else {
          const mergedData = { ...(toUpdate.data as object), ...data };
          const updatedDoc = await prisma.appDocument.update({
            where: { id: toUpdate.id },
            data: {
              data: mergedData as Prisma.InputJsonValue,
            },
          });
          result = {
            id: updatedDoc.id,
            ...(updatedDoc.data as object),
            createdAt: updatedDoc.createdAt,
            updatedAt: updatedDoc.updatedAt,
          };
        }
        break;
      }

      case "updateMany": {
        if (!data) {
          return proxyError(
            "Data is required for updateMany operation",
            "VALIDATION_ERROR",
            400,
          );
        }

        const docs = await prisma.appDocument.findMany({
          where: { collectionId: collectionRecord.id },
        });

        const toUpdate = docs.filter((doc) =>
          matchesFilter(doc.data as Record<string, unknown>, filter),
        );

        let updatedCount = 0;
        for (const doc of toUpdate) {
          const mergedData = { ...(doc.data as object), ...data };
          await prisma.appDocument.update({
            where: { id: doc.id },
            data: {
              data: mergedData as Prisma.InputJsonValue,
            },
          });
          updatedCount++;
        }
        count = updatedCount;
        result = { modifiedCount: updatedCount };
        break;
      }

      case "delete": {
        const docs = await prisma.appDocument.findMany({
          where: { collectionId: collectionRecord.id },
          take: 100,
        });

        const toDelete = docs.find((doc) =>
          matchesFilter(doc.data as Record<string, unknown>, filter),
        );
        if (!toDelete) {
          result = { deletedCount: 0 };
        } else {
          await prisma.appDocument.delete({ where: { id: toDelete.id } });
          result = {
            deletedCount: 1,
            deleted: { id: toDelete.id, ...(toDelete.data as object) },
          };
        }
        break;
      }

      case "deleteMany": {
        const docs = await prisma.appDocument.findMany({
          where: { collectionId: collectionRecord.id },
        });

        const toDelete = docs.filter((doc) =>
          matchesFilter(doc.data as Record<string, unknown>, filter),
        );

        let deletedCount = 0;
        for (const doc of toDelete) {
          await prisma.appDocument.delete({ where: { id: doc.id } });
          deletedCount++;
        }
        count = deletedCount;
        result = { deletedCount };
        break;
      }

      case "count": {
        const docs = await prisma.appDocument.findMany({
          where: { collectionId: collectionRecord.id },
        });

        const filtered = docs.filter((doc) =>
          matchesFilter(doc.data as Record<string, unknown>, filter),
        );
        count = filtered.length;
        result = { count };
        break;
      }

      default:
        return proxyError(
          `Unknown operation: ${operation}`,
          "INVALID_OPERATION",
          400,
        );
    }

    // Deduct credits
    const deduction = await deductCredits(userId, "database", 1);

    // Log usage
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: ProxyService.DATABASE,
      operation,
      creditsUsed: 1,
      success: true,
      metadata: {
        collection,
        hasFilter: !!filter,
        count: count ?? null,
      },
      latencyMs: Date.now() - startTime,
    });

    return proxySuccess({
      success: true,
      data: result,
      count,
      creditsUsed: 1,
      creditsRemaining: deduction.newBalance,
    });
  } catch (error) {
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: ProxyService.DATABASE,
      operation,
      creditsUsed: 0,
      success: false,
      errorCode: "DATABASE_ERROR",
      metadata: { error: error instanceof Error ? error.message : "Unknown" },
      latencyMs: Date.now() - startTime,
    });

    return proxyError(
      error instanceof Error ? error.message : "Database operation failed",
      "DATABASE_ERROR",
      500,
    );
  }
}

/**
 * Simple filter matching for JSON documents
 * Supports exact match and basic operators
 */
function matchesFilter(
  data: Record<string, unknown>,
  filter?: Record<string, unknown>,
): boolean {
  if (!filter || Object.keys(filter).length === 0) {
    return true;
  }

  for (const [key, value] of Object.entries(filter)) {
    // Handle special operators
    if (key === "id") {
      // ID is handled separately - skip in data matching
      continue;
    }

    const dataValue = data[key];

    // Handle operator objects like { $gt: 5 }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const ops = value as Record<string, unknown>;

      if ("$eq" in ops && dataValue !== ops.$eq) return false;
      if ("$ne" in ops && dataValue === ops.$ne) return false;
      if (
        "$gt" in ops &&
        !(typeof dataValue === "number" && dataValue > (ops.$gt as number))
      )
        return false;
      if (
        "$gte" in ops &&
        !(typeof dataValue === "number" && dataValue >= (ops.$gte as number))
      )
        return false;
      if (
        "$lt" in ops &&
        !(typeof dataValue === "number" && dataValue < (ops.$lt as number))
      )
        return false;
      if (
        "$lte" in ops &&
        !(typeof dataValue === "number" && dataValue <= (ops.$lte as number))
      )
        return false;
      if (
        "$in" in ops &&
        !(Array.isArray(ops.$in) && ops.$in.includes(dataValue))
      )
        return false;
      if (
        "$nin" in ops &&
        Array.isArray(ops.$nin) &&
        ops.$nin.includes(dataValue)
      )
        return false;
      if ("$exists" in ops) {
        const exists = dataValue !== undefined && dataValue !== null;
        if (ops.$exists !== exists) return false;
      }
      if (
        "$contains" in ops &&
        typeof dataValue === "string" &&
        typeof ops.$contains === "string"
      ) {
        if (!dataValue.toLowerCase().includes(ops.$contains.toLowerCase()))
          return false;
      }
    } else {
      // Simple equality match
      if (dataValue !== value) return false;
    }
  }

  return true;
}
