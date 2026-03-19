import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { encryptJson } from "@/lib/encrypt";
import { GoogleCredentialSchema } from "@/types";

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 10, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
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

    // Encrypt sensitive data
    const sensitiveData = {
      serviceAccountJson: data.serviceAccountJson,
    };
    const encryptedData = await encryptJson(sensitiveData);

    // Check if credential already exists
    const { data: existingCred } = await supabase
      .from("developer_credentials")
      .select("id")
      .eq("user_id", user.id)
      .eq("platform", "google")
      .eq("name", data.name)
      .single();

    if (existingCred) {
      // Update existing credential
      const { error: updateError } = await supabase
        .from("developer_credentials")
        .update({
          encrypted_data: encryptedData,
          metadata: {
            packageName: data.packageName,
          },
          verified: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingCred.id);

      if (updateError) {
        console.error("Failed to update Google credentials:", updateError);
        return NextResponse.json(
          { error: "Failed to save Google credentials" },
          { status: 500 },
        );
      }
    } else {
      // Create new credential
      const { error: insertError } = await supabase
        .from("developer_credentials")
        .insert({
          platform: "google",
          name: data.name,
          encrypted_data: encryptedData,
          metadata: {
            packageName: data.packageName,
          },
          user_id: user.id,
        });

      if (insertError) {
        console.error("Failed to create Google credentials:", insertError);
        return NextResponse.json(
          { error: "Failed to save Google credentials" },
          { status: 500 },
        );
      }
    }

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

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 10, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get user's Google credentials
    const { data: credentials, error } = await supabase
      .from("developer_credentials")
      .select("id, name, verified, metadata, created_at")
      .eq("platform", "google");

    if (error) {
      console.error("Failed to fetch Google credentials:", error);
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
        packageName: (c.metadata as Record<string, unknown>)?.packageName,
        createdAt: c.created_at,
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
      .eq("platform", "google");

    if (error) {
      console.error("Failed to delete Google credentials:", error);
      return NextResponse.json(
        { error: "Failed to delete credentials" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Google creds delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete credentials" },
      { status: 500 },
    );
  }
}
