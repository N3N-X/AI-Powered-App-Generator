import { NextRequest } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import {
  extractProxyAuth,
  checkProxyRateLimit,
  checkCredits,
  logProxyUsage,
  hasServiceAccess,
  proxyError,
  proxyCorsOptions,
} from "@/lib/proxy";
import { getMapsConfig } from "@/lib/proxy-config";
import { handleGeocode } from "./handlers/geocode";
import { handleDirections } from "./handlers/directions";
import { handlePlaces } from "./handlers/places";
import type { MapsHandlerContext } from "./handlers/types";

// Handle CORS preflight requests
export async function OPTIONS() {
  return proxyCorsOptions();
}

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 60, window: 60_000 });
  if (limited) return limited;

  const startTime = Date.now();

  // Authenticate
  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { apiKeyId, projectId, userId, plan, services } = auth.context;

  // Check service access
  if (!hasServiceAccess(services, "maps")) {
    return proxyError(
      "This API key does not have access to the Maps service",
      "FORBIDDEN",
      403,
    );
  }

  // Check rate limit
  const rateLimit = await checkProxyRateLimit(projectId, "maps");
  if (!rateLimit.success) {
    return proxyError(
      `Rate limit exceeded. Try again in ${Math.ceil((rateLimit.reset - Date.now()) / 1000)}s`,
      "RATE_LIMITED",
      429,
    );
  }

  // Parse request
  let body;
  try {
    body = await request.json();
  } catch {
    return proxyError("Invalid JSON body", "INVALID_REQUEST", 400);
  }

  const { operation, ...params } = body;

  if (!operation || !["geocode", "directions", "places"].includes(operation)) {
    return proxyError(
      "Invalid operation. Must be one of: geocode, directions, places",
      "VALIDATION_ERROR",
      400,
    );
  }

  // Check credits (1 credit per request)
  const creditCheck = await checkCredits(userId, plan, "maps", 1);
  if (!creditCheck.hasCredits) {
    return proxyError(
      `Insufficient credits. Required: 1, Available: ${creditCheck.available}`,
      "INSUFFICIENT_CREDITS",
      402,
    );
  }

  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!googleMapsApiKey) {
    return proxyError(
      "Google Maps service not configured",
      "SERVICE_UNAVAILABLE",
      503,
    );
  }

  // Apply proxy config defaults
  const mapsConfig = await getMapsConfig(projectId);

  const ctx: MapsHandlerContext = {
    apiKeyId,
    projectId,
    userId,
    operation,
    googleMapsApiKey,
    startTime,
    mapsConfig,
  };

  try {
    switch (operation) {
      case "geocode":
        return await handleGeocode(params, ctx);
      case "directions":
        return await handleDirections(params, ctx);
      case "places":
        return await handlePlaces(params, ctx);
      default:
        return proxyError("Invalid operation", "VALIDATION_ERROR", 400);
    }
  } catch (error) {
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: "maps",
      operation,
      creditsUsed: 0,
      success: false,
      errorCode: "NETWORK_ERROR",
      metadata: { error: error instanceof Error ? error.message : "Unknown" },
      latencyMs: Date.now() - startTime,
    });

    return proxyError(
      "Failed to connect to Google Maps",
      "SERVICE_UNAVAILABLE",
      503,
    );
  }
}
