import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App;
let adminAuth: Auth;

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    console.warn(
      'Firebase Admin SDK credentials not found. Please set FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PROJECT_ID in .env.local'
    );
    // Initialize with minimal config for development
    app = initializeApp({
      projectId: projectId || 'rux-sh-d4cf3',
    });
  } else {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  }

  adminAuth = getAuth(app);
} else {
  app = getApps()[0];
  adminAuth = getAuth(app);
}

export { adminAuth, app };
