import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { encryptJson } from "@/lib/encrypt";
import { AppleCredentialSchema } from "@/types";

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 10, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = AppleCredentialSchema.parse(body);

    const supabase = await createClient();

    // Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, plan")
      .eq("id", uid)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Encrypt sensitive credential data
    const sensitiveData = {
      keyId: data.keyId,
      issuerId: data.issuerId,
      p8Key: data.p8Key,
      teamId: data.teamId,
    };
    const encryptedData = await encryptJson(sensitiveData);

    // Check if credential already exists
    const { data: existingCred } = await supabase
      .from("developer_credentials")
      .select("id")
      .eq("user_id", user.id)
      .eq("platform", "apple")
      .eq("name", data.name)
      .single();

    if (existingCred) {
      // Update existing credential
      const { error: updateError } = await supabase
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

      if (updateError) {
        console.error("Failed to update Apple credentials:", updateError);
        return NextResponse.json(
          { error: "Failed to save Apple credentials" },
          { status: 500 },
        );
      }
    } else {
      // Create new credential
      const { error: insertError } = await supabase
        .from("developer_credentials")
        .insert({
          platform: "apple",
          name: data.name,
          encrypted_data: encryptedData,
          metadata: {
            teamId: data.teamId,
            bundleId: data.bundleId,
          },
          user_id: user.id,
        });

      if (insertError) {
        console.error("Failed to create Apple credentials:", insertError);
        return NextResponse.json(
          { error: "Failed to save Apple credentials" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "App Store Connect API Key saved securely",
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

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 10, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's Apple credentials
    const { data: credentials, error } = await supabase
      .from("developer_credentials")
      .select("id, name, verified, metadata, created_at")
      .eq("platform", "apple");

    if (error) {
      console.error("Failed to fetch Apple credentials:", error);
      return NextResponse.json(
        { error: "Failed to check credentials" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      connected: (credentials || []).length > 0,
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

export async function DELETE(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 10, window: 60_000 });
  if (limited) return limited;

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

    // Delete credential (only if belongs to user)
    const { error } = await supabase
      .from("developer_credentials")
      .delete()
      .eq("id", credentialId)
      .eq("platform", "apple");

    if (error) {
      console.error("Failed to delete Apple credentials:", error);
      return NextResponse.json(
        { error: "Failed to delete credentials" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Apple creds delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete credentials" },
      { status: 500 },
    );
  }
}
