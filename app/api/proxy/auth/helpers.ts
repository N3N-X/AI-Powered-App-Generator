import { NextRequest } from "next/server";
import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

// Session token validity: 30 days
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Hash a token for storage
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Format user for response
 */
export function formatUser(user: {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  is_anonymous?: boolean;
  metadata: unknown;
  created_at: string;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    emailVerified: user.email_verified,
    isAnonymous: user.is_anonymous || false,
    metadata: user.metadata,
    createdAt: user.created_at,
  };
}

/**
 * Create a new session for a user
 */
export async function createSession(
  appUserId: string,
  request: NextRequest,
): Promise<{ sessionToken: string; expiresAt: Date }> {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const supabase = createAdminClient();

  await supabase.from("app_sessions").insert({
    app_user_id: appUserId,
    token: tokenHash,
    expires_at: expiresAt.toISOString(),
    user_agent: request.headers.get("user-agent") || undefined,
    ip_address:
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      undefined,
  });

  return { sessionToken: rawToken, expiresAt };
}

/**
 * Validate a session token and return the session if valid
 */
export async function validateSession(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from("app_sessions")
    .select()
    .eq("token", tokenHash)
    .single();

  if (!session || new Date(session.expires_at) < new Date()) {
    // Clean up expired session
    if (session) {
      await supabase.from("app_sessions").delete().eq("id", session.id);
    }
    return null;
  }

  // Update last active
  await supabase
    .from("app_sessions")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", session.id);

  return session;
}

export type AuthResult = {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    emailVerified: boolean;
    metadata: unknown;
    createdAt: string;
  };
  sessionToken?: string;
  expiresAt?: string;
  message?: string;
};
