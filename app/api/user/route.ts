import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, Plan } from "@/types";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid, email } = await getAuthenticatedUser(request);

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user from database (id is now the Supabase UUID)
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    let userData = user;

    // If user doesn't exist in database, create them
    if (fetchError || !user) {
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          id: uid, // Supabase UUID
          email: email || "",
          plan: "FREE",
          role: "USER",
          credits: PLAN_LIMITS.FREE.monthlyCredits,
          total_credits_used: 0,
        })
        .select()
        .single();

      if (createError || !newUser) {
        console.error("Failed to create user:", createError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 },
        );
      }

      userData = newUser;
    }

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if we need to reset credits for paid plans (monthly reset)
    const plan = userData.plan as Plan;
    const planLimits = PLAN_LIMITS[plan];

    if (planLimits.creditsRefresh && userData.last_credit_reset) {
      const now = new Date();
      const lastReset = new Date(userData.last_credit_reset);
      const monthsSinceReset =
        (now.getFullYear() - lastReset.getFullYear()) * 12 +
        (now.getMonth() - lastReset.getMonth());

      // Reset credits if it's been at least a month
      if (monthsSinceReset >= 1) {
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({
            credits: planLimits.monthlyCredits,
            last_credit_reset: now.toISOString(),
          })
          .eq("id", userData.id)
          .select()
          .single();

        if (!updateError && updatedUser) {
          userData = updatedUser;
        }
      }
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatarUrl: userData.avatar_url,
        plan: userData.plan,
        role: userData.role,
        credits: userData.credits,
        totalCreditsUsed: userData.total_credits_used,
        lastCreditReset: userData.last_credit_reset,
        hasGitHub: !!userData.github_token_encrypted,
        hasCustomApiKey: !!userData.claude_key_encrypted,
        stripeCustomerId: userData.stripe_customer_id,
        stripeSubscriptionId: userData.stripe_subscription_id,
      },
    });
  } catch (error) {
    console.error("User fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

// Update user profile
const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

export async function PATCH(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 30, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = UpdateUserSchema.parse(body);

    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name) {
      updateData.name = data.name;
    }

    const { data: user, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", uid)
      .select()
      .single();

    if (error || !user) {
      console.error("Failed to update user:", error);
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}
