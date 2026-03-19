import { NextRequest } from "next/server";
import { withRateLimit } from "@/lib/rate-limit";
import { proxyCorsOptions } from "@/lib/proxy";
import {
  handleStorageUpload,
  handleStorageList,
  handleStorageDelete,
} from "./storage-handlers";

// Handle CORS preflight requests
export async function OPTIONS() {
  return proxyCorsOptions();
}

export async function POST(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 60, window: 60_000 });
  if (limited) return limited;
  return handleStorageUpload(request);
}

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 60, window: 60_000 });
  if (limited) return limited;
  return handleStorageList(request);
}

export async function DELETE(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 60, window: 60_000 });
  if (limited) return limited;
  return handleStorageDelete(request);
}
