import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { PLAN_LIMITS, Plan } from "@/types";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const { uid, email } = await getAuthenticatedUser(request);

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database (id is now the Supabase UUID)
    let user = await prisma.user.findUnique({
      where: { id: uid },
    });

    // If user doesn't exist in database, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: uid, // Supabase UUID
          email: email || "",
          plan: "FREE",
          role: "USER",
          credits: PLAN_LIMITS.FREE.monthlyCredits,
          totalCreditsUsed: 0,
        },
      });
    }

    // Check if we need to reset credits for paid plans (monthly reset)
    const plan = user.plan as Plan;
    const planLimits = PLAN_LIMITS[plan];

    if (planLimits.creditsRefresh && user.lastCreditReset) {
      const now = new Date();
      const lastReset = new Date(user.lastCreditReset);
      const monthsSinceReset =
        (now.getFullYear() - lastReset.getFullYear()) * 12 +
        (now.getMonth() - lastReset.getMonth());

      // Reset credits if it's been at least a month
      if (monthsSinceReset >= 1) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            credits: planLimits.monthlyCredits,
            lastCreditReset: now,
          },
        });
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        plan: user.plan,
        role: user.role,
        credits: user.credits,
        totalCreditsUsed: user.totalCreditsUsed,
        lastCreditReset: user.lastCreditReset,
        hasGitHub: !!user.githubTokenEncrypted,
        hasCustomApiKey: !!user.claudeKeyEncrypted,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
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
  try {
    const { uid } = await getAuthenticatedUser(request);

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = UpdateUserSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: uid },
      data: {
        ...(data.name && { name: data.name }),
        updatedAt: new Date(),
      },
    });

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
