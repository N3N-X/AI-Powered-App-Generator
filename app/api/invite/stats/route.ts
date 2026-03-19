import { NextResponse } from "next/server";
import { getUserInviteStats } from "@/lib/invite";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const stats = await getUserInviteStats(user.id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Invite stats error:", error);
    return NextResponse.json(
      { error: "Failed to get invite stats" },
      { status: 500 }
    );
  }
}
