export const nativeFeaturesSection = {
  title: "Native Features",
  content: `
# Native Features

Access device capabilities in your Rulxy apps.

## Available Features

### Camera & Photos
\`\`\`
"Add a feature to:
- Take photos with camera
- Select from photo library
- Crop and edit images
- Upload to server"
\`\`\`

### Location
\`\`\`
"Implement location features:
- Get current location
- Show on map
- Track movement
- Geofencing alerts"
\`\`\`

### Notifications
\`\`\`
"Add push notifications:
- Permission request
- Local notifications
- Remote push (requires build)
- Notification actions"
\`\`\`

### Biometrics
\`\`\`
"Implement biometric auth:
- Face ID on iOS
- Fingerprint on Android
- Fallback to passcode"
\`\`\`

## Platform-Specific Features

### iOS Only
- Face ID
- Apple Pay
- Siri Shortcuts
- HealthKit

### Android Only
- Fingerprint (older devices)
- Google Pay
- App Widgets
- Android Auto

## Implementation

When requesting native features, be specific about:

1. **Platform**: iOS, Android, or both
2. **Permissions**: What access is needed
3. **Fallbacks**: Behavior when unavailable
4. **UI**: How the feature is presented

### Example
\`\`\`
"Add biometric login:
- Check if biometrics available
- Show Face ID prompt on iOS
- Show fingerprint on Android
- Fall back to password if unavailable
- Remember preference in settings"
\`\`\`
    `,
};
