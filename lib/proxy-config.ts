/**
 * Proxy Configuration Helpers
 *
 * Detection logic and database operations for per-project proxy configurations.
 */

import { createAdminClient } from "@/lib/supabase/server";
import type {
  ProxyConfigService,
  ProxyConfigData,
  ProxyConfigsResponse,
  EmailProxyConfig,
  SMSProxyConfig,
  PushProxyConfig,
  StorageProxyConfig,
  MapsProxyConfig,
  NotificationsProxyConfig,
} from "@/types/proxy-config";

// Re-export detection utilities so existing imports keep working
export { detectProxyServices, mapApiToService } from "./proxy-config-detection";

// ---------------------------------------------------------------------------
// Configuration CRUD
// ---------------------------------------------------------------------------

/**
 * Get all proxy configs for a project
 */
export async function getProxyConfigs(
  projectId: string,
): Promise<ProxyConfigsResponse> {
  const supabase = createAdminClient();

  // Import inline to avoid circular — detection is in its own module
  const { detectProxyServices } = await import("./proxy-config-detection");
  const detectedServices = await detectProxyServices(projectId);

  // Fetch existing configs (table may not exist yet)
  let configs: Array<{
    service: string;
    config: unknown;
    enabled: boolean;
  }> | null = null;
  try {
    const { data } = await supabase
      .from("proxy_configs")
      .select("*")
      .eq("project_id", projectId);
    configs = data;
  } catch {
    // Table may not exist yet
  }

  // Build response
  const result: ProxyConfigsResponse = {
    configs: {
      email: null,
      sms: null,
      push: null,
      storage: null,
      maps: null,
      notifications: null,
    },
    detectedServices,
    enabledServices: [],
  };

  if (configs) {
    for (const record of configs) {
      const service = record.service as ProxyConfigService;
      if (service in result.configs) {
        (result.configs as Record<string, ProxyConfigData | null>)[service] =
          record.config as ProxyConfigData;
        if (record.enabled) {
          result.enabledServices.push(service);
        }
      }
    }
  }

  return result;
}

/**
 * Get a specific proxy config for a project
 */
export async function getProxyConfig<T extends ProxyConfigData>(
  projectId: string,
  service: ProxyConfigService,
): Promise<T | null> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("proxy_configs")
    .select("config, enabled")
    .eq("project_id", projectId)
    .eq("service", service)
    .eq("enabled", true)
    .single();

  if (!data) return null;
  return data.config as T;
}

/**
 * Save a proxy config (create or update)
 */
export async function saveProxyConfig(
  projectId: string,
  service: ProxyConfigService,
  config: Partial<ProxyConfigData>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("proxy_configs")
    .select("id, config")
    .eq("project_id", projectId)
    .eq("service", service)
    .single();

  if (existing) {
    const mergedConfig = { ...existing.config, ...config };
    const { error } = await supabase
      .from("proxy_configs")
      .update({
        config: mergedConfig,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("proxy_configs").insert({
      project_id: projectId,
      service,
      config,
      enabled: true,
    });

    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Delete a proxy config
 */
export async function deleteProxyConfig(
  projectId: string,
  service: ProxyConfigService,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("proxy_configs")
    .delete()
    .eq("project_id", projectId)
    .eq("service", service);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------------
// Type-Safe Config Getters
// ---------------------------------------------------------------------------

export async function getEmailConfig(
  projectId: string,
): Promise<EmailProxyConfig | null> {
  return getProxyConfig<EmailProxyConfig>(projectId, "email");
}

export async function getSMSConfig(
  projectId: string,
): Promise<SMSProxyConfig | null> {
  return getProxyConfig<SMSProxyConfig>(projectId, "sms");
}

export async function getPushConfig(
  projectId: string,
): Promise<PushProxyConfig | null> {
  return getProxyConfig<PushProxyConfig>(projectId, "push");
}

export async function getStorageConfig(
  projectId: string,
): Promise<StorageProxyConfig | null> {
  return getProxyConfig<StorageProxyConfig>(projectId, "storage");
}

export async function getMapsConfig(
  projectId: string,
): Promise<MapsProxyConfig | null> {
  return getProxyConfig<MapsProxyConfig>(projectId, "maps");
}

export async function getNotificationsConfig(
  projectId: string,
): Promise<NotificationsProxyConfig | null> {
  return getProxyConfig<NotificationsProxyConfig>(projectId, "notifications");
}
