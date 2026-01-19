import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/features",
  "/login(.*)",
  "/signup(.*)",
  "/api/webhooks(.*)",
  "/api/health",
  "/api/docs",
  "/api/proxy/(.*)", // Proxy endpoints use their own API key auth
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
    // For pages, redirect to login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Get user's plan from session claims (set via Clerk metadata)
  const userPlan =
    (sessionClaims?.metadata as { plan?: string })?.plan || "FREE";

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
