import { NextRequest } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import {
  extractProxyAuth,
  checkProxyRateLimit,
  checkCredits,
  deductCredits,
  logProxyUsage,
  hasServiceAccess,
  proxyError,
  proxySuccess,
  proxyCorsOptions,
  validateAppSession,
} from "@/lib/proxy";
import { createAdminClient } from "@/lib/supabase/server";
import { DatabaseProxyRequestSchema } from "@/types/proxy";
import {
  handleCreate,
  handleFindOne,
  handleFindMany,
  handleUpdate,
  handleUpdateMany,
  handleDelete,
  handleDeleteMany,
  handleCount,
  handleSeed,
} from "./operations";
import type { OperationContext, OperationResult } from "./operations";

// Handle CORS preflight requests
export async function OPTIONS() {
  return proxyCorsOptions();
}

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 120, window: 60_000 });
  if (limited) return limited;

  const startTime = Date.now();

  // Authenticate
  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { apiKeyId, projectId, userId, plan, services } = auth.context;

  // Check service access
  if (!hasServiceAccess(services, "database")) {
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
    console.error(
      "[proxy/db] Validation failed:",
      JSON.stringify(parsed.error.errors),
      "Body:",
      JSON.stringify(body),
    );
    return proxyError(
      `Validation error: ${parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
      "VALIDATION_ERROR",
      400,
    );
  }

  const { collection, operation, data, filter, options, scope, sessionToken } =
    parsed.data;

  // Resolve user ID for user-scoped operations
  let resolvedUserId: string | null = null;
  let resolvedScope = scope;
  if (scope === "user") {
    if (sessionToken) {
      const session = await validateAppSession(sessionToken);
      if (session) {
        resolvedUserId = session.userId;
      } else {
        return proxyError(
          "Invalid or expired session token. Call initSession() on app launch.",
          "INVALID_SESSION",
          401,
        );
      }
    } else {
      return proxyError(
        "Session token required for user-scoped operations. Call initSession() on app launch.",
        "SESSION_REQUIRED",
        401,
      );
    }
  }

  // Check credits (1 credit per operation)
  const creditCheck = await checkCredits(userId, plan, "database", 1);

  const supabase = createAdminClient();
  if (!creditCheck.hasCredits) {
    return proxyError(
      `Insufficient credits. Required: 1, Available: ${creditCheck.available}`,
      "INSUFFICIENT_CREDITS",
      402,
    );
  }

  try {
    // Get or create collection for this project (upsert pattern)
    const { data: existingCollection } = await supabase
      .from("app_collections")
      .select("*")
      .eq("project_id", projectId)
      .eq("name", collection)
      .single();

    let collectionRecord;
    if (existingCollection) {
      collectionRecord = existingCollection;
    } else {
      const { data: newCollection, error: createError } = await supabase
        .from("app_collections")
        .insert({ project_id: projectId, name: collection })
        .select()
        .single();

      if (createError) throw createError;
      collectionRecord = newCollection;
    }

    const ctx = {
      supabase,
      collectionRecord,
      resolvedScope,
      resolvedUserId,
      filter,
      data,
      options,
    };

    const operationHandlers: Record<
      string,
      (ctx: OperationContext) => Promise<OperationResult>
    > = {
      create: handleCreate,
      findOne: handleFindOne,
      findMany: handleFindMany,
      update: handleUpdate,
      updateMany: handleUpdateMany,
      delete: handleDelete,
      deleteMany: handleDeleteMany,
      count: handleCount,
      seed: handleSeed,
    };

    const handler = operationHandlers[operation];
    if (!handler) {
      return proxyError(
        `Unknown operation: ${operation}`,
        "INVALID_OPERATION",
        400,
      );
    }

    const outcome = await handler(ctx);

    if (outcome.error) {
      return proxyError(
        outcome.error.message,
        outcome.error.code,
        outcome.error.status,
      );
    }

    // Deduct credits
    const deduction = await deductCredits(userId, "database", 1);

    // Log usage
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: "database",
      operation,
      creditsUsed: 1,
      success: true,
      metadata: {
        collection,
        hasFilter: !!filter,
        count: outcome.count ?? null,
      },
      latencyMs: Date.now() - startTime,
    });

    return proxySuccess({
      success: true,
      data: outcome.result,
      count: outcome.count,
      creditsUsed: 1,
      creditsRemaining: deduction.newBalance,
    });
  } catch (error) {
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: "database",
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
