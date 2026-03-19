import type { ArticleContent } from "../types";

export const apiProxiesContent: ArticleContent = {
  "proxy-intro": {
    title: "What are API Proxies?",
    content: `
# What are API Proxies?

Rulxy Proxies let your apps access powerful APIs without managing keys.

## The Problem

When building apps, you often need:
- AI for chat or content
- Maps for location
- Payment processing
- Email sending
- And many more...

Each requires:
- Signing up for accounts
- Managing API keys
- Handling billing
- Dealing with rate limits

## The Solution

Rulxy Proxies handle all of this:

### One Integration
Add services with simple calls - no API key management needed.

### Unified Billing
- Pay through Rulxy credits
- No separate accounts
- Simple cost tracking

## How It Works

1. Your app calls Rulxy proxy endpoint
2. Rulxy authenticates the request
3. Rulxy calls the actual API
4. Response returns to your app
5. Credits deducted from your balance

## Benefits

1. **Fast setup**: Add AI in minutes
2. **No accounts**: Skip the signup maze
3. **Secure**: Keys never in your code
4. **Cost-effective**: Pay only for usage
    `,
  },

  "available-services": {
    title: "Available Services",
    content: `
# Available Services

APIs available through Rulxy Proxies.

## AI Models

| Service | Description |
|---------|-------------|
| xAI (Grok) | Fast, capable AI |
| OpenAI | GPT-4, GPT-4o |
| Anthropic | Claude models |
| Google AI | Gemini models |

## Image Generation

| Service | Description |
|---------|-------------|
| DALL-E 3 | OpenAI images |
| Stable Diffusion | Open-source |

## Search & Maps

| Service | Description |
|---------|-------------|
| Google Search | Web search |
| Google Places | Business data |
| Maps | Directions, geocoding |

## Communication

| Service | Description |
|---------|-------------|
| Email | Send emails |
| SMS | Text messages |
| Push | Notifications |

## Data & Utilities

| Service | Description |
|---------|-------------|
| Storage | File storage |
| Weather | Weather data |
| Translate | Language translation |

## Using Services

Tell the AI what you need:
\`\`\`
"Add a feature to translate text using the translation API"
"Integrate weather data for the user's location"
"Add AI-powered chat using the proxy"
\`\`\`
    `,
  },

  "using-proxies": {
    title: "Using Proxies in Your App",
    content: `
# Using Proxies in Your App

Integrate Rulxy Proxy services into your applications.

## Basic Usage

### Making Requests
All proxies follow a consistent pattern:

\`\`\`javascript
const response = await fetch('/api/proxy/[service]', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    // Service-specific parameters
  })
});

const data = await response.json();
\`\`\`

## Example: AI Chat

\`\`\`javascript
const response = await fetch('/api/proxy/xai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'Hello!' }
    ]
  })
});

const { reply } = await response.json();
\`\`\`

## Example: Send Email

\`\`\`javascript
const response = await fetch('/api/proxy/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: 'Welcome!',
    body: 'Thanks for signing up.'
  })
});
\`\`\`

## Authentication

Requests are automatically authenticated:
- User must be logged in
- Project must be active
- Credits must be available

## Error Handling

\`\`\`javascript
try {
  const response = await fetch('/api/proxy/xai', {...});

  if (!response.ok) {
    const error = await response.json();
    console.error(error.message);
    return;
  }

  const data = await response.json();
} catch (err) {
  console.error('Network error:', err);
}
\`\`\`

## Best Practices

1. **Handle errors**: Always check response status
2. **Show loading**: Indicate when requests are pending
3. **Cache when possible**: Reduce redundant calls
4. **Monitor usage**: Track credit consumption
    `,
  },

  "rate-limits": {
    title: "Rate Limits & Credits",
    content: `
# Rate Limits & Credits

Understand usage limits and costs for proxy services.

## Rate Limits

### Per-Minute Limits
Requests are limited to prevent abuse:

| Plan | Requests/min |
|------|--------------|
| Free | 10 |
| Pro | 60 |
| Elite | 120 |

### Handling Limits
When rate limited:
- Response includes 429 status
- Retry-After header indicates wait time
- Implement exponential backoff

## Credit Costs

Proxy calls consume credits based on service:

| Service | Cost |
|---------|------|
| AI Chat | 10-50 credits |
| Image Gen | 50-100 credits |
| Email | 5 credits |
| SMS | 10 credits |
| Search | 5 credits |

## Monitoring Usage

### Dashboard
View usage in Settings → Billing:
- Total credits used
- Usage by service
- Cost breakdown

### API Response
Each response includes:
\`\`\`json
{
  "data": {...},
  "credits_used": 25,
  "credits_remaining": 2975
}
\`\`\`

## Optimizing Costs

1. **Cache responses**: Store results when appropriate
2. **Batch requests**: Combine multiple operations
3. **Use appropriate tiers**: Don't over-request
4. **Monitor patterns**: Identify expensive operations
    `,
  },
};
