import { MapsGeocodeRequestSchema } from "@/types/proxy";
import {
  deductCredits,
  logProxyUsage,
  proxyError,
  proxySuccess,
} from "@/lib/proxy";
import type { MapsHandlerContext } from "./types";

const GOOGLE_MAPS_BASE_URL = "https://maps.googleapis.com/maps/api";

export async function handleGeocode(
  params: Record<string, unknown>,
  ctx: MapsHandlerContext,
) {
  const parsed = MapsGeocodeRequestSchema.safeParse(params);
  if (!parsed.success) {
    return proxyError(
      `Validation error: ${parsed.error.errors[0]?.message}`,
      "VALIDATION_ERROR",
      400,
    );
  }
  const validatedParams = parsed.data;

  const geocodeParams = new URLSearchParams({ key: ctx.googleMapsApiKey });
  if (validatedParams.address)
    geocodeParams.set("address", validatedParams.address);
  if (validatedParams.latlng)
    geocodeParams.set("latlng", validatedParams.latlng);
  if (validatedParams.placeId)
    geocodeParams.set("place_id", validatedParams.placeId);
  if (ctx.mapsConfig?.defaultRegion)
    geocodeParams.set("region", ctx.mapsConfig.defaultRegion);

  const url = `${GOOGLE_MAPS_BASE_URL}/geocode/json?${geocodeParams}`;

  const mapsResponse = await fetch(url);
  const data = await mapsResponse.json();

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error(
      `[proxy/maps] Google Maps error — operation: ${ctx.operation}, status: ${data.status}, error: ${data.error_message || "none"}`,
    );

    await logProxyUsage({
      apiKeyId: ctx.apiKeyId,
      projectId: ctx.projectId,
      userId: ctx.userId,
      service: "maps",
      operation: ctx.operation,
      creditsUsed: 0,
      success: false,
      errorCode: `MAPS_${data.status}`,
      metadata: { operation: ctx.operation, status: data.status },
      latencyMs: Date.now() - ctx.startTime,
    });

    return proxyError(
      data.error_message || `Maps API error: ${data.status}`,
      "MAPS_ERROR",
      400,
    );
  }

  const deduction = await deductCredits(ctx.userId, "maps", 1);

  await logProxyUsage({
    apiKeyId: ctx.apiKeyId,
    projectId: ctx.projectId,
    userId: ctx.userId,
    service: "maps",
    operation: ctx.operation,
    creditsUsed: 1,
    success: true,
    metadata: {
      operation: ctx.operation,
      resultsCount: data.results?.length || 0,
    },
    latencyMs: Date.now() - ctx.startTime,
  });

  return proxySuccess({
    ...data,
    creditsUsed: 1,
    creditsRemaining: deduction.newBalance,
  });
}
