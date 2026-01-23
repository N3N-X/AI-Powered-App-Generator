import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * Get Firebase UID from request headers (set by middleware)
 * This is the simplest approach - middleware already verified the session
 */
export function getFirebaseUid(request: NextRequest): string | null {
  return request.headers.get('x-firebase-uid');
}

/**
 * Get Firebase UID from Authorization header (Bearer token)
 * Use this for endpoints that need to verify the token directly
 */
export async function verifyFirebaseToken(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
}

/**
 * Combined auth helper - tries headers first, then Bearer token
 * Returns Firebase UID if authenticated, null otherwise
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<{
  uid: string | null;
  email?: string | null;
}> {
  // First try to get from headers (set by middleware)
  const uid = getFirebaseUid(request);
  const email = request.headers.get('x-user-email');

  if (uid) {
    return { uid, email };
  }

  // Fallback to verifying Bearer token
  const tokenUid = await verifyFirebaseToken(request);
  if (tokenUid) {
    return { uid: tokenUid };
  }

  return { uid: null };
}
