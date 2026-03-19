import { NextRequest, NextResponse } from "next/server";
import { redeemInviteCode } from "@/lib/invite";
import { getAuthenticatedUser } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const { uid } = await getAuthenticatedUser(request);
    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: "Missing invite code" },
        { status: 400 },
      );
    }

    const result = await redeemInviteCode(code, uid);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Invite redemption error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to redeem invite code" },
      { status: 500 },
    );
  }
}
