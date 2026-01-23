import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { encrypt } from "@/lib/encrypt";
import { verifyGitHubToken } from "@/lib/github";

const connectSchema = z.object({
  accessToken: z.string().min(1),
});

/**
 * @swagger
 * /api/github/connect:
 *   post:
 *     summary: Connect GitHub account
 *     description: Verifies and stores an encrypted GitHub access token for the authenticated user. The token is validated and user information is retrieved from GitHub.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: GitHub personal access token
 *             required:
 *               - accessToken
 *     responses:
 *       200:
 *         description: GitHub account connected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 github:
 *                   type: object
 *                   properties:
 *                     login:
 *                       type: string
 *                     name:
 *                       type: string
 *                     avatarUrl:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to connect GitHub account
 */
export async function POST(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = connectSchema.parse(body);

    // Verify the token is valid
    const githubUser = await verifyGitHubToken(data.accessToken);

    // Find user
    const user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Encrypt and store the token
    const encryptedToken = await encrypt(data.accessToken);

    await prisma.user.update({
      where: { id: user.id },
      data: { githubTokenEncrypted: encryptedToken },
    });

    return NextResponse.json({
      success: true,
      github: {
        login: githubUser.login,
        name: githubUser.name,
        avatarUrl: githubUser.avatarUrl,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("GitHub connect error:", error);
    return NextResponse.json(
      { error: "Failed to connect GitHub account" },
      { status: 500 },
    );
  }
}

/**
 * @swagger
 * /api/github/connect:
 *   delete:
 *     summary: Disconnect GitHub account
 *     description: Removes the stored GitHub access token for the authenticated user, disconnecting their GitHub account.
 *     responses:
 *       200:
 *         description: GitHub account disconnected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to disconnect GitHub account
 */
export async function DELETE(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { githubTokenEncrypted: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("GitHub disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect GitHub account" },
      { status: 500 },
    );
  }
}

/**
 * @swagger
 * /api/github/connect:
 *   get:
 *     summary: Check GitHub connection status
 *     description: Returns whether the authenticated user has a connected GitHub account.
 *     responses:
 *       200:
 *         description: Connection status retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connected:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to check GitHub status
 */
export async function GET(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid: uid },
      select: { githubTokenEncrypted: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      connected: !!user.githubTokenEncrypted,
    });
  } catch (error) {
    console.error("GitHub status error:", error);
    return NextResponse.json(
      { error: "Failed to check GitHub status" },
      { status: 500 },
    );
  }
}
