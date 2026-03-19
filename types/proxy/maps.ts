import { z } from "zod";

// ============================================
// Maps Proxy Types
// ============================================

export const MapsGeocodeRequestSchema = z.object({
  address: z.string().optional(),
  latlng: z.string().optional(), // "lat,lng" format for reverse geocoding
  placeId: z.string().optional(),
});
export type MapsGeocodeRequest = z.infer<typeof MapsGeocodeRequestSchema>;

export const MapsDirectionsRequestSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  mode: z
    .enum(["driving", "walking", "bicycling", "transit"])
    .default("driving"),
  waypoints: z.array(z.string()).optional(),
  alternatives: z.boolean().optional(),
});
export type MapsDirectionsRequest = z.infer<typeof MapsDirectionsRequestSchema>;

export const MapsPlacesRequestSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(), // "lat,lng"
  radius: z.number().max(50000).optional(),
  type: z.string().optional(),
});
export type MapsPlacesRequest = z.infer<typeof MapsPlacesRequestSchema>;
