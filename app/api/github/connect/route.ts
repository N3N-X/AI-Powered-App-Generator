import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encrypt";
import { verifyGitHubToken } from "@/lib/github";

const connectSchema = z.object({
  accessToken: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 10, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = connectSchema.parse(body);

    // Verify the token is valid
    const githubUser = await verifyGitHubToken(data.accessToken);

    const supabase = await createClient();

    // Find user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Encrypt and store the token
    const encryptedToken = await encrypt(data.accessToken);

    const { error: updateError } = await supabase
      .from("users")
      .update({ github_token_encrypted: encryptedToken })
      .eq("id", user.id);

    if (updateError) {
      throw updateError;
    }

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

export async function DELETE(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 10, window: 60_000 });
  if (limited) return limited;

  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", uid)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ github_token_encrypted: null })
      .eq("id", user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("GitHub disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect GitHub account" },
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

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("github_token_encrypted")
      .eq("id", uid)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      connected: !!user.github_token_encrypted,
    });
  } catch (error) {
    console.error("GitHub status error:", error);
    return NextResponse.json(
      { error: "Failed to check GitHub status" },
      { status: 500 },
    );
  }
}
