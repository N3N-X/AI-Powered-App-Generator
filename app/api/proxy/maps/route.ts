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

/**
 * @swagger
 * /api/proxy/maps:
 *   post:
 *     summary: Maps & Geocoding Proxy (Google Maps API)
 *     description: |
 *       Proxied access to mapping services including geocoding, reverse geocoding,
 *       directions, and place search. Generated apps can use location features
 *       without needing their own Google Maps API key.
 *
 *       **Authentication:** Requires a valid RUX API key.
 *
 *       **Rate Limits:** 100 requests per minute per project.
 *
 *       **Credits:** 3 credits per request.
 *
 *       **Operations:**
 *       - `geocode`: Convert address to coordinates
 *       - `reverseGeocode`: Convert coordinates to address
 *       - `directions`: Get directions between two points
 *       - `placeSearch`: Search for places by query
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
 *                 enum: [geocode, reverseGeocode, directions, placeSearch]
 *                 description: Type of maps operation
 *               address:
 *                 type: string
 *                 description: Address to geocode (for geocode operation)
 *               lat:
 *                 type: number
 *                 description: Latitude (for reverseGeocode operation)
 *               lng:
 *                 type: number
 *                 description: Longitude (for reverseGeocode operation)
 *               origin:
 *                 type: string
 *                 description: Starting point (for directions operation)
 *               destination:
 *                 type: string
 *                 description: Ending point (for directions operation)
 *               mode:
 *                 type: string
 *                 enum: [driving, walking, bicycling, transit]
 *                 default: driving
 *                 description: Travel mode (for directions operation)
 *               query:
 *                 type: string
 *                 description: Search query (for placeSearch operation)
 *               location:
 *                 type: string
 *                 description: Center point for place search (lat,lng format)
 *               radius:
 *                 type: number
 *                 description: Search radius in meters (for placeSearch operation)
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Operation-specific response data
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
 *         description: Maps service error
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
  if (!hasServiceAccess(services, "maps")) {
    return proxyError(
      "This API key does not have access to the Maps service",
      "FORBIDDEN",
      403,
    );
  }

  // Check rate limit (100 requests per minute)
  const rateLimit = await checkProxyRateLimit(projectId, "maps");
  if (!rateLimit.success) {
    return proxyError(
      "Rate limit exceeded. Maximum 100 requests per minute.",
      "RATE_LIMIT",
      429,
    );
  }

  try {
    // Parse request body
    const body = await request.json();
    const { operation } = body;

    if (!operation) {
      return proxyError(
        "Missing required field: operation",
        "INVALID_REQUEST",
        400,
      );
    }

    // Validate operation type
    const validOperations = [
      "geocode",
      "reverseGeocode",
      "directions",
      "placeSearch",
    ];
    if (!validOperations.includes(operation)) {
      return proxyError(
        `Invalid operation. Must be one of: ${validOperations.join(", ")}`,
        "INVALID_REQUEST",
        400,
      );
    }

    // Calculate credits (3 per request)
    const creditsRequired = 3;

    // Check credits
    const creditsCheck = await checkCredits(
      userId,
      plan,
      "maps",
      creditsRequired,
    );
    if (!creditsCheck) {
      return proxyError(
        "Insufficient credits. Maps operations cost 3 credits per request.",
        "INSUFFICIENT_CREDITS",
        402,
      );
    }

    // Execute maps operation
    let result;
    switch (operation) {
      case "geocode":
        result = await geocodeAddress(body.address);
        break;
      case "reverseGeocode":
        result = await reverseGeocode(body.lat, body.lng);
        break;
      case "directions":
        result = await getDirections(
          body.origin,
          body.destination,
          body.mode || "driving",
        );
        break;
      case "placeSearch":
        result = await searchPlaces(body.query, body.location, body.radius);
        break;
      default:
        return proxyError("Invalid operation", "INVALID_REQUEST", 400);
    }

    // Deduct credits
    await deductCredits(userId, "maps", creditsRequired);

    // Log usage
    await logProxyUsage({
      service: "maps" as const,
      operation,
      creditsUsed: creditsRequired,
      requestSize: JSON.stringify(body).length,
      responseSize: JSON.stringify(result).length,
      latencyMs: Date.now() - startTime,
      metadata: { operation, platform: body.platform },
      success: true,
      apiKeyId,
      projectId,
      userId,
    });

    return proxySuccess(result, creditsRequired);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log failed request
    await logProxyUsage({
      service: "maps" as const,
      operation: "unknown",
      creditsUsed: 0,
      requestSize: 0,
      responseSize: 0,
      latencyMs: Date.now() - startTime,
      success: false,
      errorCode: "INTERNAL_ERROR",
      apiKeyId: auth.context!.apiKeyId,
      projectId: auth.context!.projectId,
      userId: auth.context!.userId,
    });

    console.error("[Maps Proxy] Error:", errorMessage, error);
    return proxyError(
      `Maps service error: ${errorMessage}`,
      "INTERNAL_ERROR",
      500,
    );
  }
}

/**
 * Geocode an address to coordinates
 */
async function geocodeAddress(address: string) {
  if (!address) {
    throw new Error("Address is required for geocoding");
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    // Fallback to mock data if no API key is configured
    console.warn(
      "[Maps] GOOGLE_MAPS_API_KEY not configured, returning mock data",
    );
    return {
      address,
      location: {
        lat: 40.7128 + Math.random() * 0.01,
        lng: -74.006 + Math.random() * 0.01,
      },
      formattedAddress: `${address}, New York, NY, USA`,
      mock: true,
    };
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(`Geocoding failed: ${data.status}`);
  }

  const result = data.results[0];
  return {
    address,
    location: result.geometry.location,
    formattedAddress: result.formatted_address,
    placeId: result.place_id,
  };
}

/**
 * Reverse geocode coordinates to address
 */
async function reverseGeocode(lat: number, lng: number) {
  if (!lat || !lng) {
    throw new Error("Latitude and longitude are required");
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn(
      "[Maps] GOOGLE_MAPS_API_KEY not configured, returning mock data",
    );
    return {
      location: { lat, lng },
      formattedAddress: "123 Mock Street, New York, NY 10001, USA",
      mock: true,
    };
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(`Reverse geocoding failed: ${data.status}`);
  }

  const result = data.results[0];
  return {
    location: { lat, lng },
    formattedAddress: result.formatted_address,
    placeId: result.place_id,
    addressComponents: result.address_components,
  };
}

/**
 * Get directions between two points
 */
async function getDirections(
  origin: string,
  destination: string,
  mode: string = "driving",
) {
  if (!origin || !destination) {
    throw new Error("Origin and destination are required");
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn(
      "[Maps] GOOGLE_MAPS_API_KEY not configured, returning mock data",
    );
    return {
      origin,
      destination,
      mode,
      distance: { text: "5.2 mi", value: 8370 },
      duration: { text: "15 mins", value: 900 },
      mock: true,
    };
  }

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${mode}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK") {
    throw new Error(`Directions failed: ${data.status}`);
  }

  const route = data.routes[0];
  const leg = route.legs[0];

  return {
    origin,
    destination,
    mode,
    distance: leg.distance,
    duration: leg.duration,
    steps: leg.steps.map((step: any) => ({
      instruction: step.html_instructions.replace(/<[^>]*>/g, ""),
      distance: step.distance,
      duration: step.duration,
    })),
    polyline: route.overview_polyline.points,
  };
}

/**
 * Search for places
 */
async function searchPlaces(
  query: string,
  location?: string,
  radius: number = 5000,
) {
  if (!query) {
    throw new Error("Query is required for place search");
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn(
      "[Maps] GOOGLE_MAPS_API_KEY not configured, returning mock data",
    );
    return {
      query,
      results: [
        {
          name: `${query} - Mock Result`,
          address: "123 Mock Street, New York, NY 10001",
          location: { lat: 40.7128, lng: -74.006 },
          rating: 4.5,
          mock: true,
        },
      ],
    };
  }

  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;

  if (location) {
    url += `&location=${location}&radius=${radius}`;
  }

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Place search failed: ${data.status}`);
  }

  return {
    query,
    results: data.results.map((place: any) => ({
      name: place.name,
      address: place.formatted_address,
      location: place.geometry.location,
      placeId: place.place_id,
      rating: place.rating,
      types: place.types,
    })),
  };
}
