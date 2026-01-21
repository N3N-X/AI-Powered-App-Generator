import { NextRequest } from "next/server";
import {
  extractProxyAuth,
  checkProxyRateLimit,
  checkCredits,
  deductCredits,
  logProxyUsage,
  hasServiceAccess,
  proxyError,
  proxySuccess,
  proxyCorsOptions,
} from "@/lib/proxy";

// Handle CORS preflight requests
export async function OPTIONS() {
  return proxyCorsOptions();
}
import {
  MapsGeocodeRequestSchema,
  MapsDirectionsRequestSchema,
  MapsPlacesRequestSchema,
} from "@/types/proxy";
import { ProxyService } from "@prisma/client";

const GOOGLE_MAPS_BASE_URL = "https://maps.googleapis.com/maps/api";

/**
 * @swagger
 * /api/proxy/maps:
 *   post:
 *     summary: Google Maps API Proxy
 *     description: |
 *       Proxied access to Google Maps APIs including Geocoding, Directions, and Places.
 *       Generated apps can use this endpoint without needing their own Google Maps API key.
 *
 *       **Authentication:** Requires a valid RUX API key.
 *
 *       **Rate Limits:** 100 requests per minute per project.
 *
 *       **Credits:** 1 credit per request.
 *     tags:
 *       - Proxy Services
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation
 *             properties:
 *               operation:
 *                 type: string
 *                 enum: [geocode, directions, places]
 *                 description: The Maps API operation to perform
 *               address:
 *                 type: string
 *                 description: Address to geocode (for geocode operation)
 *               latlng:
 *                 type: string
 *                 description: Lat,lng for reverse geocoding (for geocode operation)
 *               placeId:
 *                 type: string
 *                 description: Place ID to lookup (for geocode operation)
 *               origin:
 *                 type: string
 *                 description: Starting point (for directions operation)
 *               destination:
 *                 type: string
 *                 description: End point (for directions operation)
 *               mode:
 *                 type: string
 *                 enum: [driving, walking, bicycling, transit]
 *                 default: driving
 *                 description: Travel mode (for directions operation)
 *               waypoints:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Waypoints for route (for directions operation)
 *               query:
 *                 type: string
 *                 description: Search query (for places operation)
 *               location:
 *                 type: string
 *                 description: Lat,lng center point (for places operation)
 *               radius:
 *                 type: number
 *                 maximum: 50000
 *                 description: Search radius in meters (for places operation)
 *               type:
 *                 type: string
 *                 description: Place type filter (for places operation)
 *     responses:
 *       200:
 *         description: Successful response from Google Maps API
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   description: Results from the Maps API
 *                 status:
 *                   type: string
 *                 creditsUsed:
 *                   type: integer
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid or missing API key
 *       402:
 *         description: Insufficient credits
 *       429:
 *         description: Rate limit exceeded
 *       500:
 *         description: Google Maps API error
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Authenticate
  const auth = await extractProxyAuth(request.headers);
  if (!auth.valid || !auth.context) {
    return proxyError(auth.error || "Unauthorized", "UNAUTHORIZED", 401);
  }

  const { apiKeyId, projectId, userId, plan, services } = auth.context;

  // Check service access
  if (!hasServiceAccess(services, ProxyService.MAPS)) {
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

  try {
    let url: string;
    let validatedParams;

    switch (operation) {
      case "geocode": {
        const parsed = MapsGeocodeRequestSchema.safeParse(params);
        if (!parsed.success) {
          return proxyError(
            `Validation error: ${parsed.error.errors[0]?.message}`,
            "VALIDATION_ERROR",
            400,
          );
        }
        validatedParams = parsed.data;

        const geocodeParams = new URLSearchParams({ key: googleMapsApiKey });
        if (validatedParams.address)
          geocodeParams.set("address", validatedParams.address);
        if (validatedParams.latlng)
          geocodeParams.set("latlng", validatedParams.latlng);
        if (validatedParams.placeId)
          geocodeParams.set("place_id", validatedParams.placeId);

        url = `${GOOGLE_MAPS_BASE_URL}/geocode/json?${geocodeParams}`;
        break;
      }

      case "directions": {
        const parsed = MapsDirectionsRequestSchema.safeParse(params);
        if (!parsed.success) {
          return proxyError(
            `Validation error: ${parsed.error.errors[0]?.message}`,
            "VALIDATION_ERROR",
            400,
          );
        }
        validatedParams = parsed.data;

        const dirParams = new URLSearchParams({
          key: googleMapsApiKey,
          origin: validatedParams.origin,
          destination: validatedParams.destination,
          mode: validatedParams.mode,
        });
        if (validatedParams.waypoints) {
          dirParams.set("waypoints", validatedParams.waypoints.join("|"));
        }
        if (validatedParams.alternatives) {
          dirParams.set("alternatives", "true");
        }

        url = `${GOOGLE_MAPS_BASE_URL}/directions/json?${dirParams}`;
        break;
      }

      case "places": {
        const parsed = MapsPlacesRequestSchema.safeParse(params);
        if (!parsed.success) {
          return proxyError(
            `Validation error: ${parsed.error.errors[0]?.message}`,
            "VALIDATION_ERROR",
            400,
          );
        }
        validatedParams = parsed.data;

        const placesParams = new URLSearchParams({ key: googleMapsApiKey });
        if (validatedParams.query)
          placesParams.set("query", validatedParams.query);
        if (validatedParams.location)
          placesParams.set("location", validatedParams.location);
        if (validatedParams.radius)
          placesParams.set("radius", String(validatedParams.radius));
        if (validatedParams.type)
          placesParams.set("type", validatedParams.type);

        url = `${GOOGLE_MAPS_BASE_URL}/place/textsearch/json?${placesParams}`;
        break;
      }

      default:
        return proxyError("Invalid operation", "VALIDATION_ERROR", 400);
    }

    const mapsResponse = await fetch(url);
    const data = await mapsResponse.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      await logProxyUsage({
        apiKeyId,
        projectId,
        userId,
        service: ProxyService.MAPS,
        operation,
        creditsUsed: 0,
        success: false,
        errorCode: `MAPS_${data.status}`,
        metadata: { operation, status: data.status },
        latencyMs: Date.now() - startTime,
      });

      return proxyError(
        data.error_message || `Maps API error: ${data.status}`,
        "MAPS_ERROR",
        400,
      );
    }

    // Deduct credits
    const deduction = await deductCredits(userId, "maps", 1);

    // Log usage
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: ProxyService.MAPS,
      operation,
      creditsUsed: 1,
      success: true,
      metadata: {
        operation,
        resultsCount: data.results?.length || 0,
      },
      latencyMs: Date.now() - startTime,
    });

    return proxySuccess({
      ...data,
      creditsUsed: 1,
      creditsRemaining: deduction.newBalance,
    });
  } catch (error) {
    await logProxyUsage({
      apiKeyId,
      projectId,
      userId,
      service: ProxyService.MAPS,
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
