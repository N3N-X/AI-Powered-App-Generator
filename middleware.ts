import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Admin emails that can bypass maintenance mode
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "nick@rux.sh")
  .split(",")
  .map((e) => e.trim().toLowerCase());

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
  "/docs",
  "/privacy",
  "/terms",
  "/cookies",
  "/about",
  "/contact",
  "/maintenance",
];

// Define protected routes that require specific plans
const proRoutes = ["/api/github", "/api/build"];
const eliteRoutes: string[] = [];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route));
}

function isProRoute(pathname: string): boolean {
  return proRoutes.some((route) => pathname.startsWith(route));
}

function isEliteRoute(pathname: string): boolean {
  return eliteRoutes.some((route) => pathname.startsWith(route));
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
      req.nextUrl.pathname.startsWith("/api/webhooks")
    ) {
      return NextResponse.next();
    }

    // Check if user is admin - for Firebase we'll check the session cookie
    const sessionCookie = req.cookies.get("__session")?.value;
    let isAdmin = false;

    if (sessionCookie) {
      try {
        // We'll verify admin status in the API routes
        // For now, just check if they have a session
        // The API routes will handle the actual Firebase token verification
        const { adminAuth } = await import("@/lib/firebase-admin");
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);

        // Check if user email is in admin list
        const userEmail = decodedToken.email?.toLowerCase() || "";
        isAdmin = ADMIN_EMAILS.includes(userEmail);
      } catch (error) {
        console.error("[Maintenance] Error verifying session:", error);
      }
    }

    // Redirect non-admin users to maintenance page
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }
  }

  // Allow public routes
  if (isPublicRoute(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // For protected routes, check for session cookie
  const sessionCookie = req.cookies.get("__session")?.value;

  // If no session cookie, handle unauthorized
  if (!sessionCookie) {
    // For API routes, return 401
    if (isApiRoute(req.nextUrl.pathname)) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    // For pages, redirect to sign-in
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // For API routes, verify the Firebase token and add user info to headers
  if (isApiRoute(req.nextUrl.pathname)) {
    try {
      const { adminAuth } = await import("@/lib/firebase-admin");
      const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
      const userId = decodedToken.uid;

      // Get user's plan from Firestore or database
      // For now, we'll fetch from the database in the API route
      // This middleware just passes the Firebase UID
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set("x-user-id", userId);
      requestHeaders.set("x-firebase-uid", userId);

      // If we have the email, add it too
      if (decodedToken.email) {
        requestHeaders.set("x-user-email", decodedToken.email);
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error("[Middleware] Error verifying Firebase token:", error);
      return NextResponse.json(
        { error: "Invalid session", code: "INVALID_SESSION" },
        { status: 401 },
      );
    }
  }

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
