import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/pricing",
  "/features",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/auth/callback",
  "/auth/reset-password",
  "/api/webhooks",
  "/api/health",
  "/api/proxy",
  "/api/serve",
  "/docs",
  "/privacy",
  "/terms",
  "/cookies",
  "/about",
  "/contact",
  "/maintenance",
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route));
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api/");
}

export async function proxy(req: NextRequest) {
  // Handle CORS preflight requests in development
  if (req.method === "OPTIONS" && process.env.NODE_ENV === "development") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, DELETE, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Handle subdomain routing for user projects (*.rux.sh)
  const hostname = req.headers.get("host") || "";
  const subdomain = hostname.split(".")[0];

  // Check if it's a user subdomain
  const isSubdomain =
    hostname.includes(".rux.sh") &&
    subdomain !== "www" &&
    subdomain !== "api" &&
    subdomain !== "staging" &&
    subdomain !== "rux";

  // If it's a subdomain, serve the project via /api/serve
  if (isSubdomain) {
    const url = req.nextUrl.clone();
    url.pathname = `/api/serve`;
    return NextResponse.rewrite(url);
  }

  // Check maintenance mode
  const maintenanceMode = process.env.MAINTENANCE_MODE === "true";

  if (maintenanceMode) {
    // Allow maintenance page itself
    if (req.nextUrl.pathname === "/maintenance") {
      return NextResponse.next();
    }

    // Allow auth pages and webhooks
    if (
      req.nextUrl.pathname.startsWith("/sign-in") ||
      req.nextUrl.pathname.startsWith("/sign-up") ||
      req.nextUrl.pathname.startsWith("/api/webhooks") ||
      req.nextUrl.pathname.startsWith("/auth/")
    ) {
      return NextResponse.next();
    }

    // In maintenance mode, check if user is authenticated
    const { supabaseResponse, user } = await updateSession(req);

    if (!user) {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }

    // Check if user is admin (you can add admin check logic here)
    // For now, let authenticated users through during maintenance
  }

  // Allow public routes
  if (isPublicRoute(req.nextUrl.pathname)) {
    // Still update session for public routes to maintain auth state
    const { supabaseResponse } = await updateSession(req);
    return supabaseResponse;
  }

  // For protected routes, check authentication
  const { supabaseResponse, user } = await updateSession(req);

  if (!user) {
    // For API routes, return 401
    if (isApiRoute(req.nextUrl.pathname)) {
      return NextResponse.json(
        { error: "Unauthorized", code: "NO_AUTH" },
        { status: 401 },
      );
    }
    // For pages, redirect to sign-in
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
    // Always run for API routes
    "/api/:path*",
  ],
};
