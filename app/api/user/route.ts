import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { PLAN_LIMITS, Plan } from "@/types";

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get current user data from database
 *     description: Retrieves the current user's data. If the user doesn't exist, it creates them. Also handles monthly credit reset for paid plans.
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     clerkId:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *                     plan:
 *                       type: string
 *                     role:
 *                       type: string
 *                     credits:
 *                       type: integer
 *                     totalCreditsUsed:
 *                       type: integer
 *                     hasGitHub:
 *                       type: boolean
 *                     hasCustomApiKey:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch user
 */
export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    // If user doesn't exist in database, create them
    if (!user) {
      const clerkUser = await currentUser();

      if (!clerkUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          name: clerkUser.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
            : null,
          avatarUrl: clerkUser.imageUrl,
          plan: "FREE",
          role: "USER",
          credits: PLAN_LIMITS.FREE.monthlyCredits, // 3000 for free tier
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
        clerkId: user.clerkId,
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

/**
 * @swagger
 * /api/user:
 *   patch:
 *     summary: Update current user's profile
 *     description: Updates the current user's profile information.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to update user
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = UpdateUserSchema.parse(body);

    const user = await prisma.user.update({
      where: { clerkId: userId },
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
