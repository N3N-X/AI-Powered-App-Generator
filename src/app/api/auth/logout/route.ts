import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() { },
        remove() { },
      },
    },
  );

  try {
    await supabase.auth.signOut();

    const response = NextResponse.json({ message: "Logged out" });

    // Clear cookies
    response.cookies.set("sb-access-token", "", { maxAge: 0 });
    response.cookies.set("sb-refresh-token", "", { maxAge: 0 });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 },
    );
  }
}
