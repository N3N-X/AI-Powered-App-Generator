import { ImageResponse } from "next/og";

// Image metadata
export const alt = "RUX - AI-Powered App Builder";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Reuse the same image as OG
export { default } from "./opengraph-image";
