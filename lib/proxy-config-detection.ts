/**
 * Proxy Service Detection Logic
 *
 * Detects which proxy services a project uses by scanning multiple sources.
 */

import { createAdminClient } from "@/lib/supabase/server";
import type { ProxyConfigService } from "@/types/proxy-config";

/**
 * Map API/service names to proxy config service types
 */
export function mapApiToService(api: string): ProxyConfigService | null {
  const mapping: Record<string, ProxyConfigService> = {
    email: "email",
    sms: "sms",
    push: "push",
    storage: "storage",
    maps: "maps",
    // Common variations
    mail: "email",
    notifications: "push",
    files: "storage",
    location: "maps",
    geocoding: "maps",
  };

  return mapping[api.toLowerCase()] || null;
}

/**
 * Detect which proxy services a project uses.
 * Checks multiple sources:
 * 1. AppSpec.api.externalApis (from code generation)
 * 2. project_api_keys.services (enabled services)
 * 3. proxy_usage table (actual usage)
 */
export async function detectProxyServices(
  projectId: string,
): Promise<ProxyConfigService[]> {
  const supabase = createAdminClient();
  const detected = new Set<ProxyConfigService>();

  // 1. Check project's app_spec for externalApis and scan codeFiles
  const { data: project } = await supabase
    .from("projects")
    .select("app_spec, code_files")
    .eq("id", projectId)
    .single();

  if (project?.app_spec) {
    const appSpec = project.app_spec as {
      api?: { externalApis?: string[]; authRequired?: boolean };
    };
    const externalApis = appSpec?.api?.externalApis || [];

    for (const api of externalApis) {
      const service = mapApiToService(api);
      if (service) detected.add(service);
    }
  }

  // 1b. Scan codeFiles for proxy endpoint references
  if (project?.code_files && typeof project.code_files === "object") {
    const allCode = Object.values(
      project.code_files as Record<string, string>,
    ).join("\n");
    const proxyPatterns: [RegExp, ProxyConfigService][] = [
      [/proxy\/email|sendEmail|send_email/i, "email"],
      [/proxy\/sms|sendSMS|send_sms/i, "sms"],
      [/proxy\/push|pushNotif|send_push/i, "push"],
      [/proxy\/storage|uploadFile|upload_file/i, "storage"],
      [/proxy\/maps|geocode|getDirections|get_directions/i, "maps"],
    ];
    for (const [pattern, service] of proxyPatterns) {
      if (pattern.test(allCode)) {
        detected.add(service);
      }
    }
  }

  // 2. Check project_api_keys.services (skip "database" and AI services)
  const { data: apiKeys } = await supabase
    .from("project_api_keys")
    .select("services")
    .eq("project_id", projectId)
    .eq("is_active", true)
    .limit(1);

  if (apiKeys && apiKeys.length > 0) {
    const services = apiKeys[0].services as string[];
    for (const service of services) {
      const configService = mapApiToService(service);
      if (configService) detected.add(configService);
    }
  }

  // 3. Check proxy_usage for actual usage in last 30 days
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: usage } = await supabase
      .from("proxy_usage")
      .select("service")
      .eq("project_id", projectId)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .limit(100);

    if (usage) {
      for (const record of usage) {
        const configService = mapApiToService(record.service);
        if (configService) detected.add(configService);
      }
    }
  } catch {
    // proxy_usage table may not exist yet
  }

  return Array.from(detected);
}
