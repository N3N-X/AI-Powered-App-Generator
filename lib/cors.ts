import { NextResponse } from "next/server";

/**
 * Add CORS headers to allow mobile app development
 * Only enabled in development mode
 */
export function corsHeaders() {
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, x-clerk-auth-token",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Handle OPTIONS preflight request
 */
export function handleCorsOptions() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

/**
 * Add CORS headers to a response
 */
export function withCors(response: NextResponse) {
  const headers = corsHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
