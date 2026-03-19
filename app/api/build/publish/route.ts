import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { submitToStore, validateSubmitCredentials } from "@/lib/eas";
import { decryptJson } from "@/lib/encrypt";
import { BuildPlatform } from "@/types";

const PublishRequestSchema = z.object({
  buildId: z.string().min(1),
  platform: z.enum(["ANDROID", "IOS"]),
});

/**
 * POST /api/build/publish
 * Submit a completed build to the App Store or Play Store
 */
export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 5, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = PublishRequestSchema.parse(body);

    const supabase = await createClient();

    // Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the build record
    const { data: build, error: buildError } = await supabase
      .from("builds")
      .select("*")
      .eq("id", data.buildId)
      .eq("user_id", uid)
      .single();

    if (buildError || !build) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    if (build.status !== "success") {
      return NextResponse.json(
        { error: "Only successful builds can be published to stores" },
        { status: 400 },
      );
    }

    if (!build.eas_build_id) {
      return NextResponse.json(
        { error: "Build does not have a valid EAS build ID" },
        { status: 400 },
      );
    }

    // Get credentials based on platform (only Apple/Google developer accounts)
    const platformToFetch = data.platform === "IOS" ? "apple" : "google";

    const { data: credentials, error: credentialsError } = await supabase
      .from("developer_credentials")
      .select("*")
      .eq("user_id", uid)
      .eq("platform", platformToFetch);

    if (credentialsError) {
      console.error("Failed to fetch credentials:", credentialsError);
      return NextResponse.json(
        { error: "Failed to fetch credentials" },
        { status: 500 },
      );
    }

    // Decrypt submission credentials (ASC API Key for iOS, Google SA for Android)
    const decryptedCredentials: {
      apple?: { keyId: string; issuerId: string; p8Key: string };
      google?: { serviceAccountJson: string };
    } = {};

    if (credentials) {
      const appleCred = credentials.find((c) => c.platform === "apple");
      const googleCred = credentials.find((c) => c.platform === "google");

      if (appleCred) {
        try {
          const decrypted = await decryptJson<{
            keyId: string;
            issuerId: string;
            p8Key: string;
          }>(appleCred.encrypted_data);
          decryptedCredentials.apple = decrypted;
        } catch (error) {
          console.error("Failed to decrypt Apple credentials:", error);
        }
      }

      if (googleCred) {
        try {
          const decrypted = await decryptJson<{
            serviceAccountJson: string;
          }>(googleCred.encrypted_data);
          decryptedCredentials.google = decrypted;
        } catch (error) {
          console.error("Failed to decrypt Google credentials:", error);
        }
      }
    }

    // Validate credentials for submission
    const validation = validateSubmitCredentials(
      data.platform as BuildPlatform,
      decryptedCredentials,
    );
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Missing credentials for store submission",
          details: validation.errors,
          hint:
            data.platform === "IOS"
              ? "Connect your App Store Connect API Key in Settings > Integrations to publish to the App Store"
              : "Connect your Google Play Service Account in Settings > Integrations to publish to the Play Store",
        },
        { status: 400 },
      );
    }

    // Submit to store via EAS Submit
    const { submissionId, status } = await submitToStore(
      build.eas_build_id,
      data.platform as BuildPlatform,
      decryptedCredentials,
    );

    // Update build record with submission info
    await supabase
      .from("builds")
      .update({
        submission_id: submissionId,
        submission_status: status,
        submitted_at: new Date().toISOString(),
      })
      .eq("id", data.buildId);

    return NextResponse.json({
      success: true,
      submissionId,
      status,
      message: `Build submitted to ${data.platform === "IOS" ? "App Store" : "Play Store"} successfully`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 },
      );
    }

    console.error("Publish error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Publish failed",
      },
      { status: 500 },
    );
  }
}
