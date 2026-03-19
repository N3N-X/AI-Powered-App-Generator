import { matchesFilter } from "./filters";
import { applyScopeFilter, formatDoc } from "./read-operations";
import type { OperationContext } from "./types";

export async function handleUpdate(ctx: OperationContext) {
  const {
    supabase,
    collectionRecord,
    resolvedScope,
    resolvedUserId,
    filter,
    data,
  } = ctx;

  if (!data) {
    return {
      error: {
        message: "Data is required for update operation",
        code: "VALIDATION_ERROR",
        status: 400,
      },
    };
  }

  let query = supabase
    .from("app_documents")
    .select("*")
    .eq("collection_id", collectionRecord.id)
    .limit(100);

  query = applyScopeFilter(query, resolvedScope, resolvedUserId);

  const { data: docs, error: fetchError } = await query;
  if (fetchError) throw fetchError;

  const toUpdate = docs?.find((doc: Record<string, unknown>) =>
    matchesFilter(doc.data as Record<string, unknown>, filter),
  );

  if (!toUpdate) {
    return { result: null };
  }

  const mergedData = { ...(toUpdate.data as object), ...data };
  const { data: updatedDoc, error: updateError } = await supabase
    .from("app_documents")
    .update({ data: mergedData })
    .eq("id", toUpdate.id)
    .select()
    .single();

  if (updateError) throw updateError;

  return { result: formatDoc(updatedDoc) };
}

export async function handleUpdateMany(ctx: OperationContext) {
  const {
    supabase,
    collectionRecord,
    resolvedScope,
    resolvedUserId,
    filter,
    data,
  } = ctx;

  if (!data) {
    return {
      error: {
        message: "Data is required for updateMany operation",
        code: "VALIDATION_ERROR",
        status: 400,
      },
    };
  }

  let query = supabase
    .from("app_documents")
    .select("*")
    .eq("collection_id", collectionRecord.id);

  query = applyScopeFilter(query, resolvedScope, resolvedUserId);

  const { data: docs, error: fetchError } = await query;
  if (fetchError) throw fetchError;

  const toUpdate = (docs || []).filter((doc: Record<string, unknown>) =>
    matchesFilter(doc.data as Record<string, unknown>, filter),
  );

  let updatedCount = 0;
  for (const doc of toUpdate) {
    const mergedData = { ...(doc.data as object), ...data };
    const { error: updateError } = await supabase
      .from("app_documents")
      .update({ data: mergedData })
      .eq("id", doc.id);

    if (updateError) throw updateError;
    updatedCount++;
  }

  return { result: { modifiedCount: updatedCount }, count: updatedCount };
}

export async function handleDelete(ctx: OperationContext) {
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

  const toDelete = docs?.find((doc: Record<string, unknown>) =>
    matchesFilter(doc.data as Record<string, unknown>, filter),
  );

  if (!toDelete) {
    return { result: { deletedCount: 0 } };
  }

  const { error: deleteError } = await supabase
    .from("app_documents")
    .delete()
    .eq("id", toDelete.id);

  if (deleteError) throw deleteError;

  return {
    result: {
      deletedCount: 1,
      deleted: { id: toDelete.id, ...(toDelete.data as object) },
    },
  };
}

export async function handleDeleteMany(ctx: OperationContext) {
  const { supabase, collectionRecord, resolvedScope, resolvedUserId, filter } =
    ctx;

  let query = supabase
    .from("app_documents")
    .select("*")
    .eq("collection_id", collectionRecord.id);

  query = applyScopeFilter(query, resolvedScope, resolvedUserId);

  const { data: docs, error: fetchError } = await query;
  if (fetchError) throw fetchError;

  const toDelete = (docs || []).filter((doc: Record<string, unknown>) =>
    matchesFilter(doc.data as Record<string, unknown>, filter),
  );

  let deletedCount = 0;
  for (const doc of toDelete) {
    const { error: deleteError } = await supabase
      .from("app_documents")
      .delete()
      .eq("id", doc.id);

    if (deleteError) throw deleteError;
    deletedCount++;
  }

  return { result: { deletedCount }, count: deletedCount };
}

export async function handleSeed(ctx: OperationContext) {
  const { supabase, collectionRecord, data } = ctx;

  const items = Array.isArray(data) ? data : [];
  if (items.length === 0) {
    return {
      error: {
        message: "Data array is required for seed operation",
        code: "VALIDATION_ERROR",
        status: 400,
      },
    };
  }
  if (items.length > 100) {
    return {
      error: {
        message: "Maximum 100 items per seed operation",
        code: "VALIDATION_ERROR",
        status: 400,
      },
    };
  }

  const seedDocs = items.map((item) => ({
    collection_id: collectionRecord.id,
    data: item,
    owner_type: "global" as const,
    owner_id: null,
  }));

  const { data: inserted, error: seedError } = await supabase
    .from("app_documents")
    .insert(seedDocs)
    .select();

  if (seedError) throw seedError;

  return {
    result: {
      insertedCount: inserted?.length || 0,
      items: (inserted || []).map((doc: Record<string, unknown>) => ({
        id: doc.id,
        ...(doc.data as object),
        createdAt: doc.created_at,
      })),
    },
  };
}
