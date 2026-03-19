import { MapsDirectionsRequestSchema } from "@/types/proxy";
import {
  deductCredits,
  logProxyUsage,
  proxyError,
  proxySuccess,
} from "@/lib/proxy";
import type { MapsHandlerContext } from "./types";

const ROUTES_API_URL =
  "https://routes.googleapis.com/directions/v2:computeRoutes";

export async function handleDirections(
  params: Record<string, unknown>,
  ctx: MapsHandlerContext,
) {
  const parsed = MapsDirectionsRequestSchema.safeParse(params);
  if (!parsed.success) {
    return proxyError(
      `Validation error: ${parsed.error.errors[0]?.message}`,
      "VALIDATION_ERROR",
      400,
    );
  }
  const validatedParams = parsed.data;

  const travelModeMap: Record<string, string> = {
    driving: "DRIVE",
    walking: "WALK",
    bicycling: "BICYCLE",
    transit: "TRANSIT",
  };

  const routesBody: Record<string, unknown> = {
    origin: { address: validatedParams.origin },
    destination: { address: validatedParams.destination },
    travelMode: travelModeMap[validatedParams.mode] || "DRIVE",
    computeAlternativeRoutes: validatedParams.alternatives || false,
    units:
      ctx.mapsConfig?.defaultUnits === "imperial" ? "IMPERIAL" : "METRIC",
  };

  if (validatedParams.waypoints?.length) {
    routesBody.intermediates = validatedParams.waypoints.map(
      (wp: string) => ({
        address: wp,
      }),
    );
  }

  const routesRes = await fetch(ROUTES_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": ctx.googleMapsApiKey,
      "X-Goog-FieldMask":
        "routes.duration,routes.distanceMeters,routes.polyline,routes.legs",
    },
    body: JSON.stringify(routesBody),
  });
  const routesData = await routesRes.json();

  if (routesData.error) {
    console.error(
      `[proxy/maps] Routes API error — status: ${routesData.error.status}, message: ${routesData.error.message}`,
    );
    await logProxyUsage({
      apiKeyId: ctx.apiKeyId,
      projectId: ctx.projectId,
      userId: ctx.userId,
      service: "maps",
      operation: ctx.operation,
      creditsUsed: 0,
      success: false,
      errorCode: `ROUTES_${routesData.error.status}`,
      metadata: { operation: ctx.operation, status: routesData.error.status },
      latencyMs: Date.now() - ctx.startTime,
    });
    return proxyError(
      routesData.error.message || "Routes API error",
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
      routesCount: routesData.routes?.length || 0,
    },
    latencyMs: Date.now() - ctx.startTime,
  });

  return proxySuccess({
    routes: routesData.routes || [],
    status: "OK",
    creditsUsed: 1,
    creditsRemaining: deduction.newBalance,
  });
}
