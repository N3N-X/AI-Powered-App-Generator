import { matchesFilter } from "./filters";
import type { OperationContext } from "./types";

export function formatDoc(doc: Record<string, unknown>) {
  return {
    id: doc.id,
    ...(doc.data as object),
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function applyScopeFilter(
  query: any,
  resolvedScope: string | undefined,
  resolvedUserId: string | null,
): any {
  if (resolvedScope === "global") {
    return query.eq("owner_type", "global");
  } else if (resolvedScope === "user" && resolvedUserId) {
    return query.eq("owner_type", "user").eq("owner_id", resolvedUserId);
  }
  return query;
}

export async function handleCreate(ctx: OperationContext) {
  const { supabase, collectionRecord, resolvedScope, resolvedUserId, data } =
    ctx;

  if (!data || Array.isArray(data)) {
    return {
      error: {
        message: "Data object is required for create operation",
        code: "VALIDATION_ERROR",
        status: 400,
      },
    };
  }

  const ownerType = resolvedScope === "user" ? "user" : "global";
  const ownerId = resolvedScope === "user" ? resolvedUserId : null;

  const { data: doc, error: createError } = await supabase
    .from("app_documents")
    .insert({
      collection_id: collectionRecord.id,
      data: data,
      owner_type: ownerType,
      owner_id: ownerId,
    })
    .select()
    .single();

  if (createError) throw createError;

  return {
    result: {
      id: doc.id,
      ...(data as object),
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    },
  };
}

export async function handleFindOne(ctx: OperationContext) {
  const { supabase, collectionRecord, resolvedScope, resolvedUserId, filter } =
    ctx;

  let query = supabase
    .from("app_documents")
    .select("*")
    .eq("collection_id", collectionRecord.id)
    .limit(100);

  query = applyScopeFilter(query, resolvedScope, resolvedUserId);

  const { data: docs, error: fetchError } = await query;
  if (fetchError) throw fetchError;

  const found = docs?.find((doc: Record<string, unknown>) =>
    matchesFilter(doc.data as Record<string, unknown>, filter),
  );

  return { result: found ? formatDoc(found) : null };
}

export async function handleFindMany(ctx: OperationContext) {
  const {
    supabase,
    collectionRecord,
    resolvedScope,
    resolvedUserId,
    filter,
    options,
  } = ctx;

  const limit = options?.limit ?? 20;
  const skip = options?.skip ?? 0;

  let query = supabase
    .from("app_documents")
    .select("*")
    .eq("collection_id", collectionRecord.id)
    .order("created_at", { ascending: false })
    .limit(500);

  query = applyScopeFilter(query, resolvedScope, resolvedUserId);

  const { data: docs, error: fetchError } = await query;
  if (fetchError) throw fetchError;

  const filtered = (docs || []).filter((doc: Record<string, unknown>) =>
    matchesFilter(doc.data as Record<string, unknown>, filter),
  );

  if (options?.sort) {
    const sortEntries = Object.entries(options.sort);
    if (sortEntries.length > 0) {
      const [sortField, sortDir] = sortEntries[0];
      filtered.sort(
        (a: Record<string, unknown>, b: Record<string, unknown>) => {
          const aVal = (a.data as Record<string, unknown>)[sortField];
          const bVal = (b.data as Record<string, unknown>)[sortField];
          if (aVal === bVal) return 0;
          if (aVal === null || aVal === undefined) return 1;
          if (bVal === null || bVal === undefined) return -1;
          const cmp = aVal < bVal ? -1 : 1;
          return sortDir === "asc" ? cmp : -cmp;
        },
      );
    }
  }

  const paginated = filtered.slice(skip, skip + limit);
  return { result: paginated.map(formatDoc) };
}

export async function handleCount(ctx: OperationContext) {
  const { supabase, collectionRecord, resolvedScope, resolvedUserId, filter } =
    ctx;

  let query = supabase
    .from("app_documents")
    .select("*")
    .eq("collection_id", collectionRecord.id);

  query = applyScopeFilter(query, resolvedScope, resolvedUserId);

  const { data: docs, error: fetchError } = await query;
  if (fetchError) throw fetchError;

  const filtered = (docs || []).filter((doc: Record<string, unknown>) =>
    matchesFilter(doc.data as Record<string, unknown>, filter),
  );

  const count = filtered.length;
  return { result: { count }, count };
}
