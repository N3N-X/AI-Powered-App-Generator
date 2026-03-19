import { createAdminClient } from "@/lib/supabase/server";

const INVITE_BONUS_CREDITS = 500;

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "RULXY-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function validateInviteCode(code: string): Promise<{
  valid: boolean;
  inviterName?: string;
  inviterId?: string | null;
  isSystemCode?: boolean;
  error?: string;
}> {
  const supabase = createAdminClient();

  const { data: inviteCode, error } = await supabase
    .from("invite_codes")
    .select("id, owner_id, is_active, max_uses, times_used, code_type")
    .eq("code", code.toUpperCase())
    .single();

  if (error || !inviteCode) {
    return { valid: false, error: "Invalid invite code" };
  }

  if (!inviteCode.is_active) {
    return { valid: false, error: "This invite code is no longer active" };
  }

  if (inviteCode.max_uses && inviteCode.times_used >= inviteCode.max_uses) {
    return {
      valid: false,
      error: "This invite code has reached its maximum uses",
    };
  }

  // System-generated codes (early_access) have no owner
  const isSystemCode =
    !inviteCode.owner_id || inviteCode.code_type === "early_access";

  if (isSystemCode) {
    return {
      valid: true,
      inviterName: "Rulxy Team",
      inviterId: null,
      isSystemCode: true,
    };
  }

  // Get inviter's name for user-generated codes
  const { data: inviter } = await supabase
    .from("users")
    .select("name")
    .eq("id", inviteCode.owner_id)
    .single();

  return {
    valid: true,
    inviterName: inviter?.name || "A Rulxy user",
    inviterId: inviteCode.owner_id,
    isSystemCode: false,
  };
}

export async function redeemInviteCode(
  code: string,
  inviteeId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  // Validate the code first
  const validation = await validateInviteCode(code);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const isSystemCode = validation.isSystemCode;

  // Get the invite code record
  const { data: inviteCode } = await supabase
    .from("invite_codes")
    .select("id, owner_id, code_type")
    .eq("code", code.toUpperCase())
    .single();

  if (!inviteCode) {
    return { success: false, error: "Invalid invite code" };
  }

  // Check if already redeemed by this user
  const { data: existingRedemption } = await supabase
    .from("invite_redemptions")
    .select("id")
    .eq("invitee_id", inviteeId)
    .single();

  if (existingRedemption) {
    return { success: false, error: "You have already used an invite code" };
  }

  // Create redemption record
  const { error: redemptionError } = await supabase
    .from("invite_redemptions")
    .insert({
      invite_code_id: inviteCode.id,
      inviter_id: inviteCode.owner_id,
      invitee_id: inviteeId,
      inviter_credits: isSystemCode ? 0 : INVITE_BONUS_CREDITS,
      invitee_credits: INVITE_BONUS_CREDITS,
    });

  if (redemptionError) {
    return { success: false, error: "Failed to redeem invite code" };
  }

  // Update invite code usage count
  await supabase
    .from("invite_codes")
    .update({
      times_used:
        (
          await supabase
            .from("invite_codes")
            .select("times_used")
            .eq("id", inviteCode.id)
            .single()
        ).data?.times_used + 1,
    })
    .eq("id", inviteCode.id);

  // Grant credits to invitee
  await supabase
    .from("users")
    .update({
      invited_by: inviteCode.owner_id,
      credits: supabase.rpc("increment_credits", {
        user_id: inviteeId,
        amount: INVITE_BONUS_CREDITS,
      }),
      invite_bonus_credits: INVITE_BONUS_CREDITS,
    })
    .eq("id", inviteeId);

  // Grant credits to inviter and increment their invite count (only for user-generated codes)
  if (!isSystemCode && inviteCode.owner_id) {
    const { data: inviterData } = await supabase
      .from("users")
      .select("credits, total_invites, invite_bonus_credits")
      .eq("id", inviteCode.owner_id)
      .single();

    if (inviterData) {
      await supabase
        .from("users")
        .update({
          credits: (inviterData.credits || 0) + INVITE_BONUS_CREDITS,
          total_invites: (inviterData.total_invites || 0) + 1,
          invite_bonus_credits:
            (inviterData.invite_bonus_credits || 0) + INVITE_BONUS_CREDITS,
        })
        .eq("id", inviteCode.owner_id);
    }
  }

  // For early_access codes, update the access_request to track signup
  if (isSystemCode && inviteCode.code_type === "early_access") {
    await supabase
      .from("access_requests")
      .update({
        signed_up_at: new Date().toISOString(),
        signed_up_user_id: inviteeId,
      })
      .eq("invite_code_sent", code.toUpperCase());
  }

  return { success: true };
}

export async function getUserInviteStats(userId: string): Promise<{
  code: string;
  totalInvites: number;
  creditsEarned: number;
  shareUrl: string;
}> {
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("users")
    .select("personal_invite_code, total_invites, invite_bonus_credits")
    .eq("id", userId)
    .single();

  const code = user?.personal_invite_code || "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rulxy.com";

  return {
    code,
    totalInvites: user?.total_invites || 0,
    creditsEarned: user?.invite_bonus_credits || 0,
    shareUrl: `${baseUrl}/?invite=${code}`,
  };
}
