import { createAdminClient } from "@/lib/supabase/server";
import { ProxyService, SERVICE_CREDIT_COSTS } from "@/types/proxy";
import { Plan } from "@/types";

// ============================================
// Credits Management - Uses users.credits table
// ============================================

/**
 * Check if user has enough credits for an operation
 */
export async function checkCredits(
  userId: string,
  _plan: Plan,
  service: ProxyService,
  units: number = 1,
): Promise<{ hasCredits: boolean; required: number; available: number }> {
  const supabase = createAdminClient();
  const cost = SERVICE_CREDIT_COSTS[service] * units;

  const { data: user, error } = await supabase
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single();

  if (error || !user) {
    console.error("[proxy] Failed to fetch user credits:", error?.message);
    return { hasCredits: false, required: cost, available: 0 };
  }

  return {
    hasCredits: user.credits >= cost,
    required: cost,
    available: user.credits,
  };
}

/**
 * Deduct credits for a service operation using atomic Postgres function.
 * Prevents race conditions and negative balances.
 */
export async function deductCredits(
  userId: string,
  service: ProxyService,
  units: number = 1,
): Promise<{ success: boolean; newBalance: number; overageUsed: boolean }> {
  const cost = SERVICE_CREDIT_COSTS[service] * units;
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("deduct_credits", {
    p_user_id: userId,
    p_amount: cost,
  });

  if (error) {
    console.error("[proxy] Atomic credit deduction failed:", error.message);
    return { success: false, newBalance: 0, overageUsed: false };
  }

  const result = data?.[0] ?? { success: false, new_balance: 0 };
  return {
    success: result.success,
    newBalance: result.new_balance,
    overageUsed: false,
  };
}
