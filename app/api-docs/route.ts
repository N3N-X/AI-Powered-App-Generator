import { ApiReference } from "@scalar/nextjs-api-reference";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import openApiSpec from "@/lib/openapi.json";

const renderDocs = ApiReference({
  content: openApiSpec as Record<string, unknown>,
  pageTitle: "Rulxy API Documentation",
  theme: "kepler",
});

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!dbUser || dbUser.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return renderDocs();
}
