import { createBrowserClient } from "@supabase/ssr";
import { RealtimeChannel } from "@supabase/supabase-js";

// Singleton client for realtime subscriptions (browser only)
let realtimeClient: ReturnType<typeof createBrowserClient> | null = null;

export function getRealtimeClient() {
  if (!realtimeClient) {
    realtimeClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return realtimeClient;
}

// Realtime subscription helpers
export function subscribeToUserChanges(
  userId: string,
  onUpdate: (payload: any) => void,
): RealtimeChannel {
  const supabase = getRealtimeClient();

  return supabase
    .channel(`user:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "users",
        filter: `id=eq.${userId}`,
      },
      (payload: any) => {
        console.log("[Realtime] User updated:", payload);
        onUpdate(payload.new);
      },
    )
    .subscribe();
}

export function subscribeToProjectChanges(
  projectId: string,
  onUpdate: (payload: any) => void,
  onDelete?: () => void,
): RealtimeChannel {
  const supabase = getRealtimeClient();

  return supabase
    .channel(`project:${projectId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "projects",
        filter: `id=eq.${projectId}`,
      },
      (payload: any) => {
        console.log("[Realtime] Project updated:", payload);
        onUpdate(payload.new);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "projects",
        filter: `id=eq.${projectId}`,
      },
      () => {
        console.log("[Realtime] Project deleted");
        onDelete?.();
      },
    )
    .subscribe();
}

export function subscribeToUserProjects(
  userId: string,
  onInsert: (payload: any) => void,
  onUpdate: (payload: any) => void,
  onDelete: (payload: any) => void,
): RealtimeChannel {
  const supabase = getRealtimeClient();

  return supabase
    .channel(`user-projects:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "projects",
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        console.log("[Realtime] Project created:", payload);
        onInsert(payload.new);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "projects",
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        console.log("[Realtime] Project updated:", payload);
        onUpdate(payload.new);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "projects",
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        console.log("[Realtime] Project deleted:", payload);
        onDelete(payload.old);
      },
    )
    .subscribe();
}

export function unsubscribe(channel: RealtimeChannel) {
  channel.unsubscribe();
}
