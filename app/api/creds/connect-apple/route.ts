import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { encryptJson } from "@/lib/encrypt";
import { AppleCredentialSchema, PLAN_LIMITS, Plan } from "@/types";

/**
 * @swagger
 * /api/creds/connect-apple:
 *   post:
 *     summary: Connect Apple Developer credentials
 *     description: Saves encrypted Apple Developer credentials for EAS builds. Requires authentication and a Pro or Elite plan. Overwrites existing credentials with the same name.
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
 *               keyId:
 *                 type: string
 *               issuerId:
 *                 type: string
 *               p8Key:
 *                 type: string
 *               teamId:
 *                 type: string
 *               bundleId:
 *                 type: string
 *             required:
 *               - name
 *               - keyId
 *               - issuerId
 *               - p8Key
 *               - teamId
 *               - bundleId
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
 *         description: Validation error
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
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = AppleCredentialSchema.parse(body);

    // Get user
    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check plan
    if (!PLAN_LIMITS[user.plan as Plan].buildAccess) {
      return NextResponse.json(
        { error: "Developer credentials require Pro or Elite plan" },
        { status: 403 },
      );
    }

    // Encrypt sensitive credential data
    const sensitiveData = {
      keyId: data.keyId,
      issuerId: data.issuerId,
      p8Key: data.p8Key,
      teamId: data.teamId,
    };
    const encryptedData = await encryptJson(sensitiveData);

    // Check if credential exists
    const { data: existingCred } = await supabase
      .from("developer_credentials")
      .select("id")
      .eq("user_id", user.id)
      .eq("platform", "apple")
      .eq("name", data.name)
      .single();

    if (existingCred) {
      // Update existing credential
      await supabase
        .from("developer_credentials")
        .update({
          encrypted_data: encryptedData,
          metadata: {
            teamId: data.teamId,
            bundleId: data.bundleId,
          },
          verified: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingCred.id);
    } else {
      // Create new credential
      await supabase.from("developer_credentials").insert({
        platform: "apple",
        name: data.name,
        encrypted_data: encryptedData,
        metadata: {
          teamId: data.teamId,
          bundleId: data.bundleId,
        },
        user_id: user.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Apple Developer credentials saved securely",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Apple creds error:", error);
    return NextResponse.json(
      { error: "Failed to save Apple credentials" },
      { status: 500 },
    );
  }
}

/**
 * @swagger
 * /api/creds/connect-apple:
 *   get:
 *     summary: Check Apple credentials status
 *     description: Retrieves the list of connected Apple Developer credentials for the authenticated user.
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
 *                       teamId:
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
export async function GET(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", uid)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: credentials } = await supabase
      .from("developer_credentials")
      .select("id, name, verified, metadata, created_at")
      .eq("user_id", uid)
      .eq("platform", "apple");

    return NextResponse.json({
      connected: (credentials?.length || 0) > 0,
      credentials: (credentials || []).map((c) => ({
        id: c.id,
        name: c.name,
        verified: c.verified,
        teamId: (c.metadata as Record<string, unknown>)?.teamId,
        createdAt: c.created_at,
      })),
    });
  } catch (error) {
    console.error("Apple creds check error:", error);
    return NextResponse.json(
      { error: "Failed to check credentials" },
      { status: 500 },
    );
  }
}

/**
 * @swagger
 * /api/creds/connect-apple:
 *   delete:
 *     summary: Remove Apple credentials
 *     description: Deletes a specific Apple Developer credential by ID. Requires the credential to belong to the authenticated user.
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
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
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

    const supabase = await createClient();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", uid)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete credential (only if belongs to user)
    await supabase
      .from("developer_credentials")
      .delete()
      .eq("id", credentialId)
      .eq("user_id", user.id)
      .eq("platform", "apple");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Apple creds delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete credentials" },
      { status: 500 },
    );
  }
}
