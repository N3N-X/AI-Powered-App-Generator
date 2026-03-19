export const androidApkSection = {
  title: "Android APK Generation",
  content: `
# Android APK Generation

Build Android APK files for testing and distribution.

## APK vs AAB

### APK (Android Package)
- Direct installation
- Universal compatibility
- Larger file size
- Good for testing and internal distribution

### AAB (Android App Bundle)
- Required for Play Store
- Smaller downloads
- Device-optimized
- Google handles optimization

## Building APK

### Prerequisites
- Android project in Rulxy
- Available credits (500 per build)
- Configured app settings

### Build Steps
1. Go to Builds → Android
2. Select "APK" format
3. Choose build type:
   - Debug: For testing
   - Release: For distribution
4. Click "Start Build"
5. Wait for completion (5-10 min)

## Build Configuration

### app.json Settings
\`\`\`json
{
  "expo": {
    "android": {
      "package": "com.yourapp.name",
      "versionCode": 1
    }
  }
}
\`\`\`

## Distribution

### Internal Testing
- Share APK directly
- Install on devices
- Test functionality

### External Testing
- Use Firebase App Distribution
- Email APK to testers
- Use beta testing platforms
    `,
};
