import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { encryptJson } from "@/lib/encrypt";
import { GoogleCredentialSchema, PLAN_LIMITS, Plan } from "@/types";

/**
 * @swagger
 * /api/creds/connect-google:
 *   post:
 *     summary: Connect Google Play credentials
 *     description: Saves encrypted Google Play service account credentials for EAS builds. Requires authentication and a Pro or Elite plan. Overwrites existing credentials with the same name.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name for the credential
 *               serviceAccountJson:
 *                 type: string
 *                 description: Google service account JSON as string
 *               packageName:
 *                 type: string
 *                 description: Android package name
 *             required:
 *               - name
 *               - serviceAccountJson
 *               - packageName
 *     responses:
 *       200:
 *         description: Credentials saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error or invalid JSON
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Plan does not allow credentials
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to save credentials
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = GoogleCredentialSchema.parse(body);

    // Validate JSON format
    try {
      JSON.parse(data.serviceAccountJson);
    } catch {
      return NextResponse.json(
        { error: "Invalid service account JSON format" },
        { status: 400 },
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check plan
    if (!PLAN_LIMITS[user.plan as Plan].buildAccess) {
      return NextResponse.json(
        { error: "Developer credentials require Pro or Elite plan" },
        { status: 403 },
      );
    }

    // Encrypt sensitive data
    const sensitiveData = {
      serviceAccountJson: data.serviceAccountJson,
    };
    const encryptedData = await encryptJson(sensitiveData);

    // Upsert credential
    await prisma.developerCredential.upsert({
      where: {
        userId_platform_name: {
          userId: user.id,
          platform: "google",
          name: data.name,
        },
      },
      create: {
        platform: "google",
        name: data.name,
        encryptedData,
        metadata: {
          packageName: data.packageName,
        },
        userId: user.id,
      },
      update: {
        encryptedData,
        metadata: {
          packageName: data.packageName,
        },
        verified: false,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Google Play credentials saved securely",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Google creds error:", error);
    return NextResponse.json(
      { error: "Failed to save Google credentials" },
      { status: 500 },
    );
  }
}

/**
 * @swagger
 * /api/creds/connect-google:
 *   get:
 *     summary: Check Google credentials status
 *     description: Retrieves the list of connected Google Play credentials for the authenticated user.
 *     responses:
 *       200:
 *         description: Credentials retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connected:
 *                   type: boolean
 *                 credentials:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       verified:
 *                         type: boolean
 *                       packageName:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to check credentials
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        credentials: {
          where: { platform: "google" },
          select: {
            id: true,
            name: true,
            verified: true,
            metadata: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      connected: user.credentials.length > 0,
      credentials: user.credentials.map((c) => ({
        id: c.id,
        name: c.name,
        verified: c.verified,
        packageName: (c.metadata as any)?.packageName,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error("Google creds check error:", error);
    return NextResponse.json(
      { error: "Failed to check credentials" },
      { status: 500 },
    );
  }
}

/**
 * @swagger
 * /api/creds/connect-google:
 *   delete:
 *     summary: Remove Google credentials
 *     description: Deletes a specific Google Play credential by ID. Requires the credential to belong to the authenticated user.
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the credential to delete
 *     responses:
 *       200:
 *         description: Credential deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Credential ID required
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to delete credentials
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get("id");

    if (!credentialId) {
      return NextResponse.json(
        { error: "Credential ID required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.developerCredential.deleteMany({
      where: {
        id: credentialId,
        userId: user.id,
        platform: "google",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Google creds delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete credentials" },
      { status: 500 },
    );
  }
}
