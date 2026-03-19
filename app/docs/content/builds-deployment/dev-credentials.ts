export const devCredentialsSection = {
  title: "Developer Credentials",
  content: `
# Developer Credentials

Connect store credentials to enable submissions.

## Apple Credentials

### Required
- Apple Developer Program membership
- App Store Connect API Key
- Issuer ID and Key ID
- Private key (.p8)

### Steps
1. Go to Settings → Integrations
2. Select Apple credentials
3. Paste API key details
4. Save credentials

## Google Credentials

### Required
- Google Play Developer account
- Service account JSON key
- Play Console access

### Steps
1. Go to Settings → Integrations
2. Select Google Play credentials
3. Upload JSON key
4. Save credentials

## Security

- Credentials are encrypted at rest
- Only used for builds/submissions
- You can revoke anytime
    `,
};
