/**
 * Helper functions for store guidelines checks.
 * Detects permissions, data collection, private APIs, and mature content.
 */

export interface PermissionInfo {
  name: string;
  iosKey: string;
  androidPermission?: string;
}

export function detectPermissionsUsed(
  files: Record<string, string>,
): PermissionInfo[] {
  const permissions: PermissionInfo[] = [];
  const allContent = Object.values(files).join("\n");

  // Camera
  if (
    allContent.includes("expo-camera") ||
    allContent.includes("launchCameraAsync")
  ) {
    permissions.push({
      name: "Camera",
      iosKey: "NSCameraUsageDescription",
      androidPermission: "android.permission.CAMERA",
    });
  }

  // Location
  if (
    allContent.includes("expo-location") ||
    allContent.includes("getCurrentPositionAsync") ||
    allContent.includes("watchPositionAsync")
  ) {
    permissions.push({
      name: "Location",
      iosKey: "NSLocationWhenInUseUsageDescription",
      androidPermission: "android.permission.ACCESS_FINE_LOCATION",
    });
  }

  // Photos
  if (
    allContent.includes("launchImageLibraryAsync") ||
    allContent.includes("MediaLibrary")
  ) {
    permissions.push({
      name: "Photo Library",
      iosKey: "NSPhotoLibraryUsageDescription",
      androidPermission: "android.permission.READ_EXTERNAL_STORAGE",
    });
  }

  // Microphone
  if (
    allContent.includes("expo-av") ||
    allContent.includes("Audio.Recording")
  ) {
    permissions.push({
      name: "Microphone",
      iosKey: "NSMicrophoneUsageDescription",
      androidPermission: "android.permission.RECORD_AUDIO",
    });
  }

  // Contacts
  if (allContent.includes("expo-contacts")) {
    permissions.push({
      name: "Contacts",
      iosKey: "NSContactsUsageDescription",
      androidPermission: "android.permission.READ_CONTACTS",
    });
  }

  // Calendar
  if (allContent.includes("expo-calendar")) {
    permissions.push({
      name: "Calendar",
      iosKey: "NSCalendarsUsageDescription",
      androidPermission: "android.permission.READ_CALENDAR",
    });
  }

  // Notifications
  if (allContent.includes("expo-notifications")) {
    permissions.push({
      name: "Notifications",
      iosKey: "NSUserNotificationUsageDescription",
    });
  }

  return permissions;
}

export function checkIfCollectsData(files: Record<string, string>): boolean {
  const allContent = Object.values(files).join("\n");

  const patterns = [
    "auth.",
    "login",
    "signup",
    "register",
    "email",
    "password",
    "user.create",
    "analytics",
    "tracking",
    "localStorage",
    "AsyncStorage",
    "SecureStore",
    "db.from(",
    "supabase",
    "firebase",
  ];

  return patterns.some((p) =>
    allContent.toLowerCase().includes(p.toLowerCase()),
  );
}

export function checkForPrivateAPIs(files: Record<string, string>): string[] {
  const allContent = Object.values(files).join("\n");
  const privateAPIs: string[] = [];

  const patterns = [
    { pattern: /UIApplication\._/, name: "UIApplication private" },
    { pattern: /NSURLConnection\._/, name: "NSURLConnection private" },
    { pattern: /_UIAlert/, name: "Private UIAlert" },
  ];

  for (const { pattern, name } of patterns) {
    if (pattern.test(allContent)) {
      privateAPIs.push(name);
    }
  }

  return privateAPIs;
}

export function checkForMatureContent(files: Record<string, string>): boolean {
  const allContent = Object.values(files).join("\n").toLowerCase();

  const matureKeywords = [
    "gambling",
    "casino",
    "alcohol",
    "tobacco",
    "violence",
    "adult",
    "18+",
    "nsfw",
  ];

  return matureKeywords.some((k) => allContent.includes(k));
}
