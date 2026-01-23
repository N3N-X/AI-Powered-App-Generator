import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/proxy";
import type { ProxyService } from "@/lib/supabase/types";

const CreateKeySchema = z.object({
  projectId: z.string(),
  name: z.string().min(1).max(100).default("Default"),
  services: z
    .array(z.nativeEnum(ProxyService))
    .default(Object.values(ProxyService)),
  expiresInDays: z.number().min(1).max(365).optional(),
});

const RevokeKeySchema = z.object({
  keyId: z.string(),
});

/**
 * @swagger
 * /api/proxy/keys:
 *   post:
 *     summary: Create a new API key for a project
 *     description: |
 *       Generate a new API key for accessing proxy services. The raw key is only
 *       returned once and cannot be retrieved again - make sure to save it securely.
 *
 *       **Authentication:** Requires Clerk authentication (user must own the project).
 *     tags:
 *       - API Keys
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - projectId
 *             properties:
 *               projectId:
 *                 type: string
 *                 description: ID of the project to create the key for
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 default: Default
 *                 description: Display name for the key
 *               services:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [OPENAI, MAPS, EMAIL, SMS, STORAGE, DATABASE, PUSH, ANALYTICS]
 *                 description: Services this key can access (defaults to all)
 *               expiresInDays:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *                 description: Optional expiration in days
 *     responses:
 *       201:
 *         description: API key created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 key:
 *                   type: string
 *                   description: The raw API key (only shown once!)
 *                 keyId:
 *                   type: string
 *                 keyPrefix:
 *                   type: string
 *                   description: First 12 characters for identification
 *                 services:
 *                   type: array
 *                   items:
 *                     type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Project not found
 *   get:
 *     summary: List API keys for a project
 *     description: |
 *       Get all API keys for a project. Note that the full key is never returned,
 *       only the prefix for identification.
 *     tags:
 *       - API Keys
 *     security:
 *       - ClerkAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       keyPrefix:
 *                         type: string
 *                       services:
 *                         type: array
 *                       active:
 *                         type: boolean
 *                       lastUsedAt:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       expiresAt:
 *                         type: string
 *   delete:
 *     summary: Revoke an API key
 *     description: |
 *       Permanently revoke an API key. This action cannot be undone.
 *     tags:
 *       - API Keys
 *     security:
 *       - ClerkAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - keyId
 *             properties:
 *               keyId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Key revoked successfully
 *       404:
 *         description: Key not found
 */
export async function POST(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const { projectId, name, services, expiresInDays } = parsed.data;

    // Verify user owns the project
    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: {
        projects: {
          where: { id: projectId },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.projects.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Calculate expiration date
    let expiresAt: Date | undefined;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Generate the API key
    const { rawKey, keyId, keyPrefix } = await generateApiKey(
      projectId,
      name,
      services,
    );

    // Update expiration if set
    if (expiresAt) {
      await prisma.projectApiKey.update({
        where: { id: keyId },
        data: { expiresAt },
      });
    }

    return NextResponse.json(
      {
        success: true,
        key: rawKey, // Only returned once!
        keyId,
        keyPrefix,
        services,
        expiresAt: expiresAt?.toISOString(),
        warning: "Save this key securely - it will not be shown again!",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create API key error:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    // Verify user owns the project
    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: {
        projects: {
          where: { id: projectId },
        },
      },
    });

    if (!user || user.projects.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get all keys for the project
    const keys = await prisma.projectApiKey.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        services: true,
        active: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ keys });
  } catch (error) {
    console.error("List API keys error:", error);
    return NextResponse.json(
      { error: "Failed to list API keys" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = RevokeKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.errors },
        { status: 400 },
      );
    }

    const { keyId } = parsed.data;

    // Get the key and verify ownership
    const key = await prisma.projectApiKey.findUnique({
      where: { id: keyId },
      include: {
        project: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    // Verify ownership using Firebase UID
    const ownerMatches = key.project.user.id === uid;
    if (!ownerMatches) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the key
    await prisma.projectApiKey.delete({
      where: { id: keyId },
    });

    return NextResponse.json({
      success: true,
      deleted: keyId,
    });
  } catch (error) {
    console.error("Revoke API key error:", error);
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 },
    );
  }
}
