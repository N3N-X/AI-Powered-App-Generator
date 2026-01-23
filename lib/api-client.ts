/**
 * Secure API client with automatic authentication
 * Handles Supabase auth tokens automatically
 */

import { createClient } from "@/lib/supabase/client";

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Make an authenticated API request
 * Automatically adds Authorization header with Supabase session token
 */
export async function apiClient(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const { skipAuth = false, headers = {}, ...restOptions } = options;

  // Prepare headers
  const requestHeaders = new Headers();
  requestHeaders.set("Content-Type", "application/json");

  // Add existing headers
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      if (value) requestHeaders.set(key, value as string);
    });
  }

  // Add Authorization header if user is authenticated (unless explicitly skipped)
  if (!skipAuth) {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        requestHeaders.set("Authorization", `Bearer ${session.access_token}`);
      }
    } catch (error) {
      console.error("Failed to get session:", error);
    }
  }

  // Make the request
  return fetch(url, {
    ...restOptions,
    headers: requestHeaders,
  });
}

/**
 * Typed API client methods
 */
export const api = {
  get: (url: string, options?: FetchOptions) =>
    apiClient(url, { ...options, method: "GET" }),

  post: (url: string, data?: unknown, options?: FetchOptions) =>
    apiClient(url, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: (url: string, data?: unknown, options?: FetchOptions) =>
    apiClient(url, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: (url: string, data?: unknown, options?: FetchOptions) =>
    apiClient(url, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (url: string, options?: FetchOptions) =>
    apiClient(url, { ...options, method: "DELETE" }),
};
