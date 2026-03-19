import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { ProxyService } from "@/types/proxy";
import { Plan } from "@/types";

// ============================================
// API Key Management
// ============================================

/**
 * Generate a new API key for a project
 * Returns the raw key (only shown once) and the key info
 * Also stores encrypted version for injection into generated code
 */
export async function generateApiKey(
  projectId: string,
  name: string = "Default",
  services: ProxyService[] = [
    "database",
    "email",
    "sms",
    "maps",
    "storage",
    "openai",
    "xai",
    "auth",
  ],
): Promise<{ rawKey: string; keyId: string; keyPrefix: string }> {
  // Generate a secure random key
  const rawKey = `rux_${randomBytes(32).toString("hex")}`;
  const keyPrefix = rawKey.substring(0, 12); // "rux_xxxxxxxx"
  const keyHash = hashApiKey(rawKey);

  // Encrypt the raw key for later retrieval (for code injection)
  const { encrypt } = await import("@/lib/encrypt");
  const keyEncrypted = await encrypt(rawKey);

  const supabase = createAdminClient();
  const { data: apiKey, error } = await supabase
    .from("project_api_keys")
    .insert({
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      key_encrypted: keyEncrypted,
      services,
      project_id: projectId,
      active: true,
    })
    .select()
    .single();

  if (error || !apiKey) {
    throw new Error(`Failed to create API key: ${error?.message}`);
  }

  return {
    rawKey, // Only returned once!
    keyId: apiKey.id,
    keyPrefix,
  };
}

/**
 * Hash an API key for secure storage
 */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Validate an API key and return project/user info
 */
export async function validateApiKey(rawKey: string): Promise<{
  valid: boolean;
  apiKey?: {
    id: string;
    services: ProxyService[];
    active: boolean;
    expires_at: string | null;
    project: { id: string; user_id: string; user: { plan: Plan } };
  };
  error?: string;
}> {
  if (!rawKey || !rawKey.startsWith("rux_")) {
    return { valid: false, error: "Invalid API key format" };
  }

  const keyHash = hashApiKey(rawKey);
  const supabase = createAdminClient();

  const { data: apiKey, error } = await supabase
    .from("project_api_keys")
    .select(
      `
      id,
      services,
      active,
      expires_at,
      project:projects!project_id (
        id,
        user_id,
        user:users!user_id (
          plan
        )
      )
    `,
    )
    .eq("key_hash", keyHash)
    .single();

  if (error || !apiKey) {
    return { valid: false, error: "API key not found" };
  }

  if (!apiKey.active) {
    return { valid: false, error: "API key is disabled" };
  }

  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return { valid: false, error: "API key has expired" };
  }

  // Supabase returns joined relations as arrays — normalize to single objects
  const project = Array.isArray(apiKey.project)
    ? apiKey.project[0]
    : apiKey.project;
  const user = Array.isArray(project?.user) ? project.user[0] : project?.user;

  if (!project || !user) {
    return { valid: false, error: "API key project or user not found" };
  }

  // Update last used timestamp (non-blocking, fire and forget)
  supabase
    .from("project_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", apiKey.id)
    .then(() => {});

  return {
    valid: true,
    apiKey: {
      id: apiKey.id,
      services: apiKey.services,
      active: apiKey.active,
      expires_at: apiKey.expires_at,
      project: {
        id: project.id,
        user_id: project.user_id,
        user: { plan: user.plan },
      },
    },
  };
}

/**
 * Check if an API key has access to a specific service
 */
export function hasServiceAccess(
  apiKeyServices: ProxyService[],
  service: ProxyService,
): boolean {
  return apiKeyServices.includes(service);
}
