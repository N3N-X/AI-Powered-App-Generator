import { NextRequest, NextResponse } from "next/server";
import { validateInviteCode } from "@/lib/invite";
import { withRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 10, window: 60_000 });
  if (limited) return limited;

  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    const result = await validateInviteCode(code);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Invite validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate invite code" },
      { status: 500 },
    );
  }
}
