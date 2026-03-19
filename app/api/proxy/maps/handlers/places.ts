import { MapsPlacesRequestSchema } from "@/types/proxy";
import {
  deductCredits,
  logProxyUsage,
  proxyError,
  proxySuccess,
} from "@/lib/proxy";
import type { MapsHandlerContext } from "./types";

const PLACES_API_NEW_URL = "https://places.googleapis.com/v1/places:searchText";

export async function handlePlaces(
  params: Record<string, unknown>,
  ctx: MapsHandlerContext,
) {
  const parsed = MapsPlacesRequestSchema.safeParse(params);
  if (!parsed.success) {
    return proxyError(
      `Validation error: ${parsed.error.errors[0]?.message}`,
      "VALIDATION_ERROR",
      400,
    );
  }
  const validatedParams = parsed.data;

  const placesBody: Record<string, unknown> = {
    textQuery: validatedParams.query || "",
  };

  if (validatedParams.location) {
    const [lat, lng] = validatedParams.location.split(",").map(Number);
    if (!isNaN(lat) && !isNaN(lng)) {
      placesBody.locationBias = {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: validatedParams.radius || 5000,
        },
      };
    }
  }

  if (validatedParams.type) {
    placesBody.includedType = validatedParams.type;
  }

  if (ctx.mapsConfig?.defaultRegion) {
    placesBody.regionCode = ctx.mapsConfig.defaultRegion;
  }

  const placesRes = await fetch(PLACES_API_NEW_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": ctx.googleMapsApiKey,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.id",
    },
    body: JSON.stringify(placesBody),
  });
  const placesData = await placesRes.json();

  if (placesData.error) {
    console.error(
      `[proxy/maps] Places API error — status: ${placesData.error.status}, message: ${placesData.error.message}`,
    );
    await logProxyUsage({
      apiKeyId: ctx.apiKeyId,
      projectId: ctx.projectId,
      userId: ctx.userId,
      service: "maps",
      operation: ctx.operation,
      creditsUsed: 0,
      success: false,
      errorCode: `PLACES_${placesData.error.status}`,
      metadata: { operation: ctx.operation, status: placesData.error.status },
      latencyMs: Date.now() - ctx.startTime,
    });
    return proxyError(
      placesData.error.message || "Places API error",
      "MAPS_ERROR",
      400,
    );
  }

  const normalizedResults = (placesData.places || []).map(
    (p: Record<string, unknown>) => ({
      name: (p.displayName as Record<string, unknown>)?.text || "",
      formatted_address: p.formattedAddress || "",
      geometry: {
        location: p.location || {},
      },
      types: p.types || [],
      rating: p.rating,
      place_id: p.id || "",
    }),
  );

  const deduction = await deductCredits(ctx.userId, "maps", 1);
  await logProxyUsage({
    apiKeyId: ctx.apiKeyId,
    projectId: ctx.projectId,
    userId: ctx.userId,
    service: "maps",
    operation: ctx.operation,
    creditsUsed: 1,
    success: true,
    metadata: { operation: ctx.operation, resultsCount: normalizedResults.length },
    latencyMs: Date.now() - ctx.startTime,
  });

  return proxySuccess({
    results: normalizedResults,
    status: "OK",
    creditsUsed: 1,
    creditsRemaining: deduction.newBalance,
  });
}
