import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

// Create a session cookie from Firebase ID token
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Create session cookie (5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days in milliseconds
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // Set the cookie
    const cookieStore = await cookies();
    cookieStore.set('__session', sessionCookie, {
      maxAge: expiresIn / 1000, // Convert to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return NextResponse.json({
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
    });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 401 }
    );
  }
}

// Clear session cookie (logout)
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('__session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing session:', error);
    return NextResponse.json(
      { error: 'Failed to clear session' },
      { status: 500 }
    );
  }
}
