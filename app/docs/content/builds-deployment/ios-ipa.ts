export const iosIpaSection = {
  title: "iOS IPA Generation",
  content: `
# iOS IPA Generation

Build iOS IPA files for testing and App Store submission.

## IPA Files

IPA files are iOS app packages used for:
- TestFlight distribution
- App Store submission
- Enterprise deployment

## Building IPA

### Prerequisites
- iOS project in Rulxy
- Available credits (500 per build)
- Apple credentials connected (for store submission)

### Build Steps
1. Go to Builds → iOS
2. Select build type
3. Choose distribution:
   - Development (testing)
   - Ad Hoc (limited devices)
   - App Store (submission)
4. Click "Start Build"
5. Wait for completion (10-20 min)

## Build Configuration

### app.json Settings
\`\`\`json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourapp.name",
      "buildNumber": "1.0.0"
    }
  }
}
\`\`\`

## Distribution Options

### TestFlight
- Upload to App Store Connect
- Invite testers
- Get feedback

### Ad Hoc
- Install on specific devices
- Requires device UDIDs
- Good for internal teams
    `,
};
