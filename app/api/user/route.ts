import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser, updateUser, PLAN_LIMITS } from "@/lib/supabase/db";
import type { Plan } from "@/lib/supabase/types";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const { uid, email } = await getAuthenticatedUser(request);

    if (!uid || !email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get or create user from database
    let user = await getOrCreateUser(uid, email);

    // Check if we need to reset credits for paid plans (monthly reset)
    const plan = user.plan as Plan;
    const planLimits = PLAN_LIMITS[plan];

    if (user.last_credit_reset) {
      const now = new Date();
      const lastReset = new Date(user.last_credit_reset);
      const monthsSinceReset =
        (now.getFullYear() - lastReset.getFullYear()) * 12 +
        (now.getMonth() - lastReset.getMonth());

      // Reset credits if it's been at least a month and user has a paid plan
      if (monthsSinceReset >= 1 && plan !== "FREE") {
        user = await updateUser(user.id, {
          credits: planLimits.monthlyCredits,
          last_credit_reset: now.toISOString(),
        });
      }
    } else if (plan !== "FREE") {
      // Set initial credit reset date for paid plans
      user = await updateUser(user.id, {
        last_credit_reset: new Date().toISOString(),
      });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

const updateUserSchema = z.object({
  name: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error },
        { status: 400 },
      );
    }

    const { name, avatarUrl } = parsed.data;

    const user = await updateUser(uid, {
      ...(name !== undefined && { name }),
      ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }
}
