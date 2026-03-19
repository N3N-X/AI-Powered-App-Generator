import { SupabaseClient } from "@supabase/supabase-js";

export type CollectionRecord = { id: string; [key: string]: unknown };

export interface OperationContext {
  supabase: SupabaseClient;
  collectionRecord: CollectionRecord;
  resolvedScope?: string;
  resolvedUserId: string | null;
  filter?: Record<string, unknown>;
  data?: Record<string, unknown> | Record<string, unknown>[];
  options?: {
    limit?: number;
    skip?: number;
    sort?: Record<string, "asc" | "desc">;
  };
}

export interface OperationResult {
  result?: unknown;
  count?: number;
  error?: { message: string; code: string; status: number };
}
