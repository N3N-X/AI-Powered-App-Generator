import {
  clerkMiddleware,
  createRouteMatcher,
  clerkClient,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Admin emails that can bypass maintenance mode
// Add admin emails here (can also be set via ADMIN_EMAILS env var)
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "nick@rux.sh")
  .split(",")
  .map((e) => e.trim().toLowerCase());

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/features",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/health",
  "/api/proxy/(.*)", // Proxy endpoints use their own API key auth
  "/api/serve(.*)", // Public serving of deployed web apps
  "/docs(.*)", // Documentation pages
  "/privacy", // Privacy Policy
  "/terms", // Terms of Service
  "/cookies", // Cookie Policy
  "/about", // About page
  "/contact", // Contact page
  "/maintenance", // Maintenance page itself
]);

// Define API routes that need special handling
const isApiRoute = createRouteMatcher(["/api/(.*)"]);

// Define protected routes that require specific plans
const isProRoute = createRouteMatcher(["/api/github/(.*)", "/api/build/(.*)"]);

const isEliteRoute = createRouteMatcher([
  // Routes that require Elite plan
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Handle subdomain routing for user projects (*.rux.sh)
  const hostname = req.headers.get("host") || "";
  const subdomain = hostname.split(".")[0];

  // Check if it's a user subdomain (not www, not api, not staging, not the main domain)
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
      req.nextUrl.pathname.startsWith("/api/clerk")
    ) {
      return NextResponse.next();
    }

    // Check if user is admin by fetching email from Clerk
    let isAdmin = false;

    if (userId) {
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const userEmail =
          user.emailAddresses
            .find((e) => e.id === user.primaryEmailAddressId)
            ?.emailAddress?.toLowerCase() || "";

        isAdmin = userEmail ? ADMIN_EMAILS.includes(userEmail) : false;

        // Debug in development
        console.log("[Maintenance] userId:", userId);
        console.log("[Maintenance] userEmail:", userEmail);
        console.log("[Maintenance] isAdmin:", isAdmin);
      } catch (error) {
        console.error("[Maintenance] Error fetching user:", error);
      }
    }

    // Redirect non-admin users to maintenance page
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/maintenance", req.url));
    }
  }

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  if (!userId) {
    // For API routes, return 401
    if (isApiRoute(req)) {
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

  // Get user's plan from Clerk public metadata
  const userPlan =
    (sessionClaims?.public_metadata as { plan?: string })?.plan || "FREE";

  // Check Pro route access
  if (isProRoute(req) && userPlan === "FREE") {
    if (isApiRoute(req)) {
      return NextResponse.json(
        {
          error: "This feature requires a Pro or Elite plan",
          code: "PLAN_LIMIT_EXCEEDED",
        },
        { status: 403 },
      );
    }
    return NextResponse.redirect(new URL("/pricing", req.url));
  }

  // Check Elite route access
  if (isEliteRoute(req) && userPlan !== "ELITE") {
    if (isApiRoute(req)) {
      return NextResponse.json(
        {
          error: "This feature requires an Elite plan",
          code: "PLAN_LIMIT_EXCEEDED",
        },
        { status: 403 },
      );
    }
    return NextResponse.redirect(new URL("/pricing", req.url));
  }

  // Add user info to headers for API routes
  if (isApiRoute(req)) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", userId);
    requestHeaders.set("x-user-plan", userPlan);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
