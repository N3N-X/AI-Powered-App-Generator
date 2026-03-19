import { createClient } from "@/lib/supabase/server";
import { appendJobEvent } from "@/lib/codex/generation-store";

export async function reserveGenerationCredits(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  creditCost: number,
  jobId: string,
  nextEventId: () => number,
): Promise<{ success: boolean }> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data: user, error } = await supabase
      .from("users")
      .select("credits, total_credits_used")
      .eq("id", userId)
      .single();

    if (error || !user) {
      console.error("[Generate] Failed to fetch user credits:", error);
      await appendJobEvent(jobId, nextEventId(), {
        type: "credits.reserve_failed",
        amount: creditCost,
        reason: "user_fetch_failed",
      });
      return { success: false };
    }

    if (user.credits < creditCost) {
      await appendJobEvent(jobId, nextEventId(), {
        type: "credits.reserve_failed",
        amount: creditCost,
        reason: "insufficient_credits",
      });
      return { success: false };
    }

    const { data: updated, error: updateError } = await supabase
      .from("users")
      .update({
        credits: user.credits - creditCost,
        total_credits_used: (user.total_credits_used || 0) + creditCost,
      })
      .eq("id", userId)
      .eq("credits", user.credits)
      .select("credits")
      .single();

    if (!updateError && updated) {
      await appendJobEvent(jobId, nextEventId(), {
        type: "credits.reserved",
        amount: creditCost,
      });
      return { success: true };
    }
  }

  console.error("[Generate] Credit reservation race condition");
  await appendJobEvent(jobId, nextEventId(), {
    type: "credits.reserve_failed",
    amount: creditCost,
    reason: "race_condition",
  });
  return { success: false };
}

export async function refundGenerationCredits(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  creditCost: number,
  jobId: string,
  nextEventId: () => number,
): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data: user, error } = await supabase
      .from("users")
      .select("credits, total_credits_used")
      .eq("id", userId)
      .single();

    if (error || !user) {
      console.error("[Generate] Failed to fetch user for refund:", error);
      await appendJobEvent(jobId, nextEventId(), {
        type: "credits.refund_failed",
        amount: creditCost,
        reason: "user_fetch_failed",
      });
      return;
    }

    const newTotal = Math.max((user.total_credits_used || 0) - creditCost, 0);
    const { data: updated, error: updateError } = await supabase
      .from("users")
      .update({
        credits: user.credits + creditCost,
        total_credits_used: newTotal,
      })
      .eq("id", userId)
      .eq("credits", user.credits)
      .select("credits")
      .single();

    if (!updateError && updated) {
      await appendJobEvent(jobId, nextEventId(), {
        type: "credits.refunded",
        amount: creditCost,
      });
      return;
    }
  }

  console.error("[Generate] Credit refund race condition");
  await appendJobEvent(jobId, nextEventId(), {
    type: "credits.refund_failed",
    amount: creditCost,
    reason: "race_condition",
  });
}
