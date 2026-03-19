import { createAdminClient } from "@/lib/supabase/server";
import { ProxyService } from "@/types/proxy";

// ============================================
// Usage Logging
// ============================================

/**
 * Log a proxy usage event
 */
export async function logProxyUsage(params: {
  apiKeyId: string;
  projectId: string;
  userId: string;
  service: ProxyService;
  operation: string;
  creditsUsed: number;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, string | number | boolean | null>;
  requestSize?: number;
  responseSize?: number;
  latencyMs?: number;
}): Promise<void> {
  const supabase = createAdminClient();

  await supabase.from("proxy_usage").insert({
    api_key_id: params.apiKeyId,
    project_id: params.projectId,
    user_id: params.userId,
    service: params.service,
    operation: params.operation,
    credits_used: params.creditsUsed,
    success: params.success,
    error_code: params.errorCode,
    metadata: params.metadata,
    request_size: params.requestSize,
    response_size: params.responseSize,
    latency_ms: params.latencyMs,
  });
}
