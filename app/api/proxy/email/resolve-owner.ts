/**
 * Resolve the owner's notification email for a project.
 * 1. Check proxy_configs for a custom notification email
 * 2. Fallback to project owner's account email
 */

import { getNotificationsConfig } from "@/lib/proxy-config";
import { createAdminClient } from "@/lib/supabase/server";

export async function resolveOwnerEmail(
  projectId: string,
): Promise<string | null> {
  // 1. Check notifications config
  const notifConfig = await getNotificationsConfig(projectId);
  if (notifConfig?.notificationEmail) {
    return notifConfig.notificationEmail;
  }

  // 2. Fallback: project owner's account email
  const adminDb = createAdminClient();
  const { data: project } = await adminDb
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();

  if (!project?.user_id) return null;

  const { data: owner } = await adminDb
    .from("users")
    .select("email")
    .eq("id", project.user_id)
    .single();

  return owner?.email || null;
}
