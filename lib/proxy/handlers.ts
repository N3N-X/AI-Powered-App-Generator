import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { ProxyService } from "@/types/proxy";
import { Plan } from "@/types";
import { validateApiKey } from "./keys";

// ============================================
// App Session Validation (for user-scoped operations)
// ============================================

/**
 * Validate an app session token and return the app user ID
 * Used for user-scoped database operations in generated apps
 */
export async function validateAppSession(
  sessionToken: string,
): Promise<{ userId: string } | null> {
  if (!sessionToken) return null;

  const tokenHash = createHash("sha256").update(sessionToken).digest("hex");
  const supabase = createAdminClient();

  const { data: session, error } = await supabase
    .from("app_sessions")
    .select("id, app_user_id, expires_at")
    .eq("token", tokenHash)
    .single();

  if (error || !session) return null;

  // Check if session is expired
  if (new Date(session.expires_at) < new Date()) return null;

  return { userId: session.app_user_id };
}

// ============================================
// Proxy Request Handler Utilities
// ============================================

export interface ProxyContext {
  apiKeyId: string;
  projectId: string;
  userId: string;
  plan: Plan;
  services: ProxyService[];
}

/**
 * Extract and validate proxy authentication from request headers
 */
export async function extractProxyAuth(
  headers: Headers,
): Promise<{ valid: boolean; context?: ProxyContext; error?: string }> {
  const apiKey =
    headers.get("x-rux-api-key") ||
    headers.get("authorization")?.replace("Bearer ", "");

  if (!apiKey) {
    return { valid: false, error: "Missing API key" };
  }

  const validation = await validateApiKey(apiKey);

  if (!validation.valid || !validation.apiKey) {
    return { valid: false, error: validation.error };
  }

  const project = Array.isArray(validation.apiKey.project)
    ? validation.apiKey.project[0]
    : validation.apiKey.project;
  const user = Array.isArray(project.user) ? project.user[0] : project.user;

  return {
    valid: true,
    context: {
      apiKeyId: validation.apiKey.id,
      projectId: project.id,
      userId: project.user_id,
      plan: user.plan as Plan,
      services: validation.apiKey.services,
    },
  };
}

// CORS headers for proxy endpoints (needed for Expo Snack web player)
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, X-RUX-API-Key, x-rux-api-key, Authorization",
};

/**
 * Create a standardized error response for proxy endpoints
 */
export function proxyError(
  message: string,
  code: string,
  status: number = 400,
): Response {
  return new Response(
    JSON.stringify({
      error: { message, code },
    }),
    {
      status,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    },
  );
}

/**
 * Create a standardized success response for proxy endpoints
 */
export function proxySuccess<T>(data: T, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

/**
 * Handle CORS preflight OPTIONS request
 */
export function proxyCorsOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
