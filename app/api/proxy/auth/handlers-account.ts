import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { proxyError } from "@/lib/proxy";
import {
  hashToken,
  formatUser,
  createSession,
  validateSession,
  type AuthResult,
} from "./helpers";

export async function handleSignup(
  requestData: {
    email: string;
    password: string;
    name?: string;
    metadata?: unknown;
    anonymousSessionToken?: string;
  },
  projectId: string,
  request: NextRequest,
): Promise<AuthResult | Response> {
  const supabase = createAdminClient();

  // Check if upgrading from anonymous session
  if (requestData.anonymousSessionToken) {
    const anonSession = await validateSession(
      requestData.anonymousSessionToken,
    );
    if (anonSession) {
      const { data: anonUser } = await supabase
        .from("app_users")
        .select()
        .eq("id", anonSession.app_user_id)
        .eq("is_anonymous", true)
        .single();

      if (anonUser) {
        const { data: emailTaken } = await supabase
          .from("app_users")
          .select("id")
          .eq("project_id", projectId)
          .eq("email", requestData.email.toLowerCase())
          .neq("id", anonUser.id)
          .single();

        if (emailTaken) {
          return proxyError(
            "A user with this email already exists",
            "USER_EXISTS",
            409,
          );
        }

        const upgradeHash = await bcrypt.hash(requestData.password, 12);
        const upgradeVerifyToken = randomBytes(32).toString("hex");

        const { data: upgraded, error: upgradeError } = await supabase
          .from("app_users")
          .update({
            email: requestData.email.toLowerCase(),
            password_hash: upgradeHash,
            name: requestData.name || null,
            metadata: requestData.metadata || null,
            is_anonymous: false,
            verify_token: upgradeVerifyToken,
          })
          .eq("id", anonUser.id)
          .select()
          .single();

        if (upgradeError || !upgraded) {
          throw new Error(
            upgradeError?.message || "Failed to upgrade anonymous user",
          );
        }

        const { sessionToken: upgradeToken, expiresAt: upgradeExpires } =
          await createSession(upgraded.id, request);

        return {
          success: true,
          user: formatUser(upgraded),
          sessionToken: upgradeToken,
          expiresAt: upgradeExpires.toISOString(),
          message: "Account created successfully",
        };
      }
    }
  }

  // Standard signup
  const { data: existing } = await supabase
    .from("app_users")
    .select()
    .eq("project_id", projectId)
    .eq("email", requestData.email.toLowerCase())
    .single();

  if (existing) {
    return proxyError(
      "A user with this email already exists",
      "USER_EXISTS",
      409,
    );
  }

  const passwordHash = await bcrypt.hash(requestData.password, 12);
  const verifyToken = randomBytes(32).toString("hex");

  const { data: newUser, error: createError } = await supabase
    .from("app_users")
    .insert({
      project_id: projectId,
      email: requestData.email.toLowerCase(),
      password_hash: passwordHash,
      name: requestData.name,
      metadata: requestData.metadata,
      verify_token: verifyToken,
    })
    .select()
    .single();

  if (createError || !newUser) {
    throw new Error(createError?.message || "Failed to create user");
  }

  const { sessionToken, expiresAt } = await createSession(
    newUser.id,
    request,
  );

  return {
    success: true,
    user: formatUser(newUser),
    sessionToken,
    expiresAt: expiresAt.toISOString(),
    message: "Account created successfully",
  };
}

export async function handleLogin(
  requestData: { email: string; password: string },
  projectId: string,
  request: NextRequest,
): Promise<AuthResult | Response> {
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("app_users")
    .select()
    .eq("project_id", projectId)
    .eq("email", requestData.email.toLowerCase())
    .single();

  if (!user || !user.active) {
    console.error(
      `Auth login failed: user not found or inactive for email=${requestData.email.toLowerCase()} project=${projectId}`,
    );
    return proxyError(
      "Invalid email or password",
      "INVALID_CREDENTIALS",
      401,
    );
  }

  const validPassword = await bcrypt.compare(
    requestData.password,
    user.password_hash,
  );
  if (!validPassword) {
    console.error(
      `Auth login failed: wrong password for email=${requestData.email.toLowerCase()} project=${projectId}`,
    );
    return proxyError(
      "Invalid email or password",
      "INVALID_CREDENTIALS",
      401,
    );
  }

  await supabase
    .from("app_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", user.id);

  const { sessionToken, expiresAt } = await createSession(user.id, request);

  return {
    success: true,
    user: formatUser(user),
    sessionToken,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function handleLogout(requestData: {
  sessionToken: string;
}): Promise<AuthResult> {
  const supabase = createAdminClient();
  const tokenHash = hashToken(requestData.sessionToken);
  await supabase.from("app_sessions").delete().eq("token", tokenHash);

  return { success: true, message: "Logged out successfully" };
}

export async function handleAnonymousSession(
  projectId: string,
  request: NextRequest,
): Promise<AuthResult> {
  const supabase = createAdminClient();
  const anonEmail = `anon_${randomBytes(16).toString("hex")}@anonymous.local`;

  const { data: anonUser, error: anonError } = await supabase
    .from("app_users")
    .insert({
      project_id: projectId,
      email: anonEmail,
      password_hash: "",
      is_anonymous: true,
    })
    .select()
    .single();

  if (anonError || !anonUser) {
    throw new Error(
      anonError?.message || "Failed to create anonymous session",
    );
  }

  const { sessionToken: anonToken, expiresAt: anonExpires } =
    await createSession(anonUser.id, request);

  return {
    success: true,
    user: formatUser(anonUser),
    sessionToken: anonToken,
    expiresAt: anonExpires.toISOString(),
    message: "Anonymous session created",
  };
}

export async function handleDeleteAccount(requestData: {
  sessionToken: string;
  password: string;
}): Promise<AuthResult | Response> {
  const session = await validateSession(requestData.sessionToken);
  if (!session) {
    return proxyError("Invalid or expired session", "INVALID_SESSION", 401);
  }

  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("app_users")
    .select()
    .eq("id", session.app_user_id)
    .single();

  if (!user) {
    return proxyError("User not found", "USER_NOT_FOUND", 404);
  }

  const validPassword = await bcrypt.compare(
    requestData.password,
    user.password_hash,
  );
  if (!validPassword) {
    return proxyError("Password is incorrect", "INVALID_PASSWORD", 401);
  }

  await supabase.from("app_users").delete().eq("id", user.id);

  return { success: true, message: "Account deleted successfully" };
}
