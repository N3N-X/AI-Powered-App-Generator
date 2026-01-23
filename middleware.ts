import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/pricing",
  "/features",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/api/webhooks",
  "/api/health",
  "/api/proxy",
  "/api/serve",
  "/api/auth", // Auth endpoints are public
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

export async function middleware(req: NextRequest) {
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
      req.nextUrl.pathname.startsWith("/api/auth")
    ) {
      return NextResponse.next();
    }

    // In maintenance mode, check if user has session cookie
    // Admin verification will be done in API routes using Firebase Admin SDK
    const sessionCookie = req.cookies.get("__session")?.value;

    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }

    // Let the request through - admin verification happens in API routes
    // This avoids using Firebase Admin SDK in Edge Runtime
  }

  // Allow public routes
  if (isPublicRoute(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // For protected routes, check for authentication
  const sessionCookie = req.cookies.get("__session")?.value;
  const authHeader = req.headers.get("Authorization");

  // Check if user has either session cookie OR Authorization header
  const hasAuth =
    sessionCookie || (authHeader && authHeader.startsWith("Bearer "));

  if (!hasAuth) {
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

  // For API routes, just pass the request through
  // The API routes will verify the session cookie or Bearer token using Firebase Admin SDK
  // We don't verify here to avoid Edge Runtime issues
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files, but include all other routes
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
    // Always run for API routes
    "/api/:path*",
  ],
};
