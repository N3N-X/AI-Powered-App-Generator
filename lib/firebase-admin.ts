import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App;
let adminAuth: Auth;

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

  if (!privateKey || !clientEmail || !projectId) {
    console.error("Firebase Admin SDK credentials not found!", {
      hasPrivateKey: !!privateKey,
      hasClientEmail: !!clientEmail,
      hasProjectId: !!projectId,
    });
    throw new Error("Firebase Admin SDK credentials are required");
  } else {
    console.log(
      "Initializing Firebase Admin SDK with credentials for project:",
      projectId,
    );
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
    console.log("Firebase Admin SDK initialized successfully");
  }

  adminAuth = getAuth(app);
} else {
  app = getApps()[0];
  adminAuth = getAuth(app);
}

export { adminAuth, app };
