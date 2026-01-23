/**
 * Secure API client with automatic authentication
 * Handles both session cookies and Authorization headers
 */

import { auth } from '@/lib/firebase';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Make an authenticated API request
 * Automatically adds Authorization header with Firebase ID token
 */
export async function apiClient(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { skipAuth = false, headers = {}, ...restOptions } = options;

  // Prepare headers
  const requestHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add Authorization header if user is authenticated (unless explicitly skipped)
  if (!skipAuth && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      requestHeaders['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('Failed to get ID token:', error);
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
    apiClient(url, { ...options, method: 'GET' }),

  post: (url: string, data?: any, options?: FetchOptions) =>
    apiClient(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: (url: string, data?: any, options?: FetchOptions) =>
    apiClient(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: (url: string, data?: any, options?: FetchOptions) =>
    apiClient(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (url: string, options?: FetchOptions) =>
    apiClient(url, { ...options, method: 'DELETE' }),
};
