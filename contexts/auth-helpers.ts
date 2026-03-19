/**
 * Auth helper functions used by AuthContext.
 * Each function takes a supabase client instance to avoid recreating it.
 */

import type { SupabaseClient, User } from "@supabase/supabase-js";

type OAuthProvider =
  | "google"
  | "github"
  | "azure"
  | "apple"
  | "gitlab"
  | "bitbucket";

export type { OAuthProvider };

export function createAuthActions(supabase: SupabaseClient) {
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (
    email: string,
    password: string,
    displayName?: string,
    inviteCode?: string,
  ) => {
    // Validate invite code if provided
    if (inviteCode) {
      const res = await fetch("/api/invite/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode }),
      });
      const validation = await res.json();
      if (!validation.valid) {
        throw new Error(validation.error || "Invalid invite code");
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, invite_code: inviteCode },
      },
    });
    if (error) throw error;

    // Redeem invite code after successful signup
    if (inviteCode && data.user) {
      await fetch("/api/invite/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode, userId: data.user.id }),
      });
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) throw error;
  };

  const signInWithOAuth = async (provider: OAuthProvider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const logoutAllDevices = async () => {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
  };

  const updateUserProfile = async (
    user: User | null,
    displayName?: string,
    photoURL?: string,
  ) => {
    if (!user) throw new Error("No user logged in");
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName, avatar_url: photoURL },
    });
    if (error) throw error;
  };

  const updateEmail = async (user: User | null, newEmail: string) => {
    if (!user) throw new Error("No user logged in");
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  };

  const changePassword = async (user: User | null, newPassword: string) => {
    if (!user) throw new Error("No user logged in");
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  };

  const linkOAuthProvider = async (
    user: User | null,
    provider: OAuthProvider,
  ) => {
    if (!user) throw new Error("No user logged in");
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
      },
    });
    if (error) throw error;
  };

  return {
    signIn,
    signUp,
    signInWithGoogle,
    signInWithOAuth,
    logout,
    logoutAllDevices,
    resetPassword,
    updateUserProfile,
    updateEmail,
    changePassword,
    linkOAuthProvider,
  };
}

export function createMfaActions(supabase: SupabaseClient) {
  const mfaEnroll = async (friendlyName?: string) => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: friendlyName || "Authenticator App",
    });
    if (error) throw error;
    return data;
  };

  const mfaChallenge = async (factorId: string) => {
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });
    if (error) throw error;
    return data.id;
  };

  const mfaVerify = async (
    factorId: string,
    challengeId: string,
    code: string,
    refreshMfaState: () => Promise<void>,
  ) => {
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });
    if (error) throw error;
    await refreshMfaState();
  };

  const mfaUnenroll = async (
    factorId: string,
    refreshMfaState: () => Promise<void>,
  ) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw error;
    await refreshMfaState();
  };

  const mfaListFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    return data;
  };

  return { mfaEnroll, mfaChallenge, mfaVerify, mfaUnenroll, mfaListFactors };
}
