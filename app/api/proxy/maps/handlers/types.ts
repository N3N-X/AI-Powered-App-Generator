import type { NextResponse } from "next/server";

export interface MapsHandlerContext {
  apiKeyId: string;
  projectId: string;
  userId: string;
  operation: string;
  googleMapsApiKey: string;
  startTime: number;
  mapsConfig: { defaultRegion?: string; defaultUnits?: string } | null;
}

export type MapsHandlerResult = NextResponse;
