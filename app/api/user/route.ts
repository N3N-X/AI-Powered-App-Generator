import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get current user data from database
 *     description: Retrieves the current user's data. If the user doesn't exist, it creates them. Also resets daily prompt count if it's a new day.
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
 *                     dailyPromptCount:
 *                       type: integer
 *                     totalPrompts:
 *                       type: integer
 *                     hasGitHub:
 *                       type: boolean
 *                     hasCustomClaudeKey:
 *                       type: boolean
 *                     stripeCustomerId:
 *                       type: string
 *                     stripeSubscriptionId:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to fetch user
 */
export async function GET(request: NextRequest) {
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
          dailyPromptCount: 0,
          totalPrompts: 0,
        },
      });
    }

    // Check if we need to reset daily prompt count (new day)
    const now = new Date();
    const lastReset = new Date(user.lastPromptReset);
    const isNewDay = now.toDateString() !== lastReset.toDateString();

    if (isNewDay) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          dailyPromptCount: 0,
          lastPromptReset: now,
        },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        plan: user.plan,
        dailyPromptCount: user.dailyPromptCount,
        totalPrompts: user.totalPrompts,
        hasGitHub: !!user.githubTokenEncrypted,
        hasCustomClaudeKey: !!user.claudeKeyEncrypted,
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
