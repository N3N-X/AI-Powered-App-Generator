# Firebase Setup for RUX

## 1. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Create new project: "rux-platform"
3. Enable Google Analytics (optional)
4. Enable Authentication → Email/Password

## 2. Get Configuration

**Web/Mobile Config:**
```
Project Settings → General → Your apps → Add app
- Add Web app: "RUX Web"
- Add iOS app: "sh.rux.runtime"
- Add Android app: "sh.rux.runtime"
```

Copy the config (you'll need this):
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "rux-platform.firebaseapp.com",
  projectId: "rux-platform",
  storageBucket: "rux-platform.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```

## 3. Enable Auth Providers

Authentication → Sign-in method:
- ✅ Email/Password
- ✅ Google
- ✅ GitHub (optional)
- ✅ Anonymous (for previews without login)

## 4. Set up Firestore (for user data sync)

Firestore Database → Create database
- Start in production mode
- Choose region: us-central1

## 5. Firebase Admin SDK (for backend)

Project Settings → Service Accounts → Generate new private key

Save as: `/Users/cryp3x/Projects/RUX/firebase-admin-key.json`

**Add to .gitignore:**
```
firebase-admin-key.json
```

## 6. Environment Variables

Add to RUX web app `.env.local`:
```bash
# Firebase Web Config
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rux-platform.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rux-platform
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=rux-platform.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin SDK (server-side)
FIREBASE_ADMIN_PROJECT_ID=rux-platform
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-...@rux-platform.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Add to mobile app `.env`:
```bash
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=rux-platform.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=rux-platform
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=rux-platform.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

## Next Steps

Once you have the config:
1. I'll update the web app to use Firebase Auth
2. Update mobile app to use Firebase Auth (works in Expo Go!)
3. Build the auth proxy for user-generated apps
