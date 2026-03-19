export const easBuildsSection = {
  title: "Cloud Builds with EAS",
  content: `
# Cloud Builds with EAS

Build production apps in the cloud with Expo Application Services.

## What is EAS?

EAS (Expo Application Services) provides:
- Cloud-based builds
- No local development environment needed
- iOS builds without a Mac
- Android builds without Android Studio

## Build Types

### Development Build
- For testing with Expo
- Includes developer tools
- Not for distribution

### Preview Build
- For internal testing
- Shareable with testers
- Not signed for stores

### Production Build
- For app store submission
- Properly signed
- Optimized for release

## Starting a Build

### From Dashboard
1. Go to Builds section
2. Select your project
3. Choose platform (iOS/Android)
4. Select build type
5. Click "Start Build"

### Build Progress
- Watch real-time logs
- See build stages
- Get notified on completion

## Build Times

Typical build durations:
- **Android APK**: 5-10 minutes
- **Android AAB**: 5-10 minutes
- **iOS IPA**: 10-20 minutes

Priority builds (Pro/Elite) are faster.

## After Build

### Download
- APK: Direct download for Android
- IPA: Download for manual distribution
- AAB: For Play Store submission

### Publish (Pro/Elite)
Publish directly to:
- Apple App Store
- Google Play Store

## Credits

Each build costs **500 credits** (iOS or Android).
    `,
};
