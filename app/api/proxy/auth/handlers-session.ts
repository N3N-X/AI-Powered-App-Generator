import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { proxyError } from "@/lib/proxy";
import {
  hashToken,
  formatUser,
  validateSession,
  type AuthResult,
} from "./helpers";

export async function handleMe(requestData: {
  sessionToken: string;
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

  if (!user || !user.active) {
    return proxyError("User not found", "USER_NOT_FOUND", 404);
  }

  return { success: true, user: formatUser(user) };
}

export async function handleUpdateProfile(requestData: {
  sessionToken: string;
  name?: string | null;
  avatarUrl?: string | null;
  metadata?: unknown;
}): Promise<AuthResult | Response> {
  const session = await validateSession(requestData.sessionToken);
  if (!session) {
    return proxyError("Invalid or expired session", "INVALID_SESSION", 401);
  }

  const updateData: Record<string, unknown> = {};
  if (requestData.name) updateData.name = requestData.name;
  if (requestData.avatarUrl) updateData.avatar_url = requestData.avatarUrl;
  if (requestData.metadata !== undefined)
    updateData.metadata = requestData.metadata;

  const supabase = createAdminClient();
  const { data: updatedUser, error: updateError } = await supabase
    .from("app_users")
    .update(updateData)
    .eq("id", session.app_user_id)
    .select()
    .single();

  if (updateError || !updatedUser) {
    throw new Error(updateError?.message || "Failed to update profile");
  }

  return {
    success: true,
    user: formatUser(updatedUser),
    message: "Profile updated successfully",
  };
}

export async function handleChangePassword(requestData: {
  sessionToken: string;
  currentPassword: string;
  newPassword: string;
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
    requestData.currentPassword,
    user.password_hash,
  );
  if (!validPassword) {
    return proxyError("Current password is incorrect", "INVALID_PASSWORD", 401);
  }

  const newPasswordHash = await bcrypt.hash(requestData.newPassword, 12);
  await supabase
    .from("app_users")
    .update({ password_hash: newPasswordHash })
    .eq("id", user.id);

  const currentTokenHash = hashToken(requestData.sessionToken);
  await supabase
    .from("app_sessions")
    .delete()
    .eq("app_user_id", user.id)
    .neq("token", currentTokenHash);

  return { success: true, message: "Password changed successfully" };
}

export async function handleForgotPassword(
  requestData: { email: string },
  projectId: string,
): Promise<AuthResult> {
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("app_users")
    .select()
    .eq("project_id", projectId)
    .eq("email", requestData.email.toLowerCase())
    .single();

  if (user && user.active) {
    const resetToken = randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await supabase
      .from("app_users")
      .update({
        reset_token: resetToken,
        reset_expires: resetExpires.toISOString(),
      })
      .eq("id", user.id);
  }

  return {
    success: true,
    message:
      "If an account exists with this email, a password reset link has been sent",
  };
}

export async function handleResetPassword(
  requestData: { token: string; newPassword: string },
  projectId: string,
): Promise<AuthResult | Response> {
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("app_users")
    .select()
    .eq("project_id", projectId)
    .eq("reset_token", requestData.token)
    .gt("reset_expires", new Date().toISOString())
    .single();

  if (!user) {
    return proxyError("Invalid or expired reset token", "INVALID_TOKEN", 400);
  }

  const newPasswordHash = await bcrypt.hash(requestData.newPassword, 12);

  await supabase
    .from("app_users")
    .update({
      password_hash: newPasswordHash,
      reset_token: null,
      reset_expires: null,
    })
    .eq("id", user.id);

  await supabase.from("app_sessions").delete().eq("app_user_id", user.id);

  return {
    success: true,
    message:
      "Password reset successfully. Please log in with your new password.",
  };
}

export async function handleVerifyEmail(
  requestData: { token: string },
  projectId: string,
): Promise<AuthResult | Response> {
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("app_users")
    .select()
    .eq("project_id", projectId)
    .eq("verify_token", requestData.token)
    .single();

  if (!user) {
    return proxyError("Invalid verification token", "INVALID_TOKEN", 400);
  }

  await supabase
    .from("app_users")
    .update({ email_verified: true, verify_token: null })
    .eq("id", user.id);

  return { success: true, message: "Email verified successfully" };
}
