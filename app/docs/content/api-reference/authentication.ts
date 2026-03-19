export const authSection = {
  title: "Authentication",
  content: `
# Authentication

All API requests require authentication via API keys or session tokens.

## API Keys

Generate API keys in your project settings.

### Headers
\`\`\`
Authorization: Bearer <API_KEY>
Content-Type: application/json
\`\`\`

## Session Tokens

Use session tokens for user-authenticated requests.

### Headers
\`\`\`
Authorization: Bearer <SESSION_TOKEN>
Content-Type: application/json
\`\`\`
    `,
};
