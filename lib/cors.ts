import { NextResponse } from "next/server";

/**
 * Add CORS headers for cross-origin requests.
 * In development: allows all origins.
 * In production: restricts to the configured app URL.
 */
export function corsHeaders(): Record<string, string> {
  const isDev = process.env.NODE_ENV === "development";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  const origin = isDev ? "*" : appUrl;

  if (!origin) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Handle OPTIONS preflight request
 */
export function handleCorsOptions() {
  const headers = new Headers();
  const corsHdrs = corsHeaders();
  Object.entries(corsHdrs).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return new NextResponse(null, {
    status: 200,
    headers,
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
