/**
 * RUX Proxy Services - Available Third-Party APIs
 *
 * This file documents all available proxy services that can be used
 * in generated apps without requiring users' own API keys.
 *
 * All proxies are accessed via POST requests to /api/proxy/{service}
 * with X-RUX-API-Key header for authentication.
 */

export const PROXY_SERVICES = {
  // ============================================
  // AI MODELS
  // ============================================
  XAI: {
    endpoint: "/api/proxy/xai",
    description: "xAI Grok - Primary/Default AI for chat completions",
    credits: "8 per 1K tokens",
    example: {
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Hello!" },
      ],
      model: "grok-3-fast-beta",
      temperature: 0.7,
    },
  },

  OPENAI: {
    endpoint: "/api/proxy/openai",
    description: "OpenAI GPT-4, GPT-4o, GPT-3.5 chat completions",
    credits: "10 per 1K tokens",
    example: {
      messages: [{ role: "user", content: "Hello!" }],
      model: "gpt-4o-mini",
    },
  },

  // ============================================
  // IMAGE GENERATION
  // ============================================
  IMAGE_GENERATE: {
    endpoint: "/api/proxy/images/generate",
    description: "Generate images using DALL-E or Stable Diffusion",
    credits: "50 per image",
    example: {
      prompt: "A beautiful sunset over mountains",
      model: "dall-e-3",
      size: "1024x1024",
    },
  },

  // ============================================
  // SEARCH & DATA
  // ============================================
  GOOGLE_SEARCH: {
    endpoint: "/api/proxy/search",
    description: "Web search results",
    credits: "5 per search",
    example: {
      query: "React hooks tutorial",
      num: 10,
    },
  },

  MAPS: {
    endpoint: "/api/proxy/maps",
    description: "Geocoding, reverse geocoding, places, and directions",
    credits: "3 per request",
    operations: ["geocode", "reverseGeocode", "directions", "placeSearch"],
    examples: {
      geocode: {
        operation: "geocode",
        address: "1600 Amphitheatre Parkway, Mountain View, CA",
      },
      reverseGeocode: {
        operation: "reverseGeocode",
        lat: 37.4224764,
        lng: -122.0842499,
      },
      placeSearch: {
        operation: "placeSearch",
        query: "restaurants near me",
        location: "37.7749,-122.4194",
        radius: 5000,
      },
      directions: {
        operation: "directions",
        origin: "San Francisco, CA",
        destination: "Los Angeles, CA",
        mode: "driving",
      },
    },
  },

  // ============================================
  // MEDIA PROCESSING
  // ============================================
  TRANSCRIBE: {
    endpoint: "/api/proxy/audio/transcribe",
    description: "Audio transcription using Whisper",
    credits: "15 per minute",
    example: {
      audio: "base64_encoded_audio_data",
      language: "en",
    },
  },

  TEXT_TO_SPEECH: {
    endpoint: "/api/proxy/audio/tts",
    description: "Convert text to speech",
    credits: "10 per request",
    example: {
      text: "Hello, this is a test.",
      voice: "alloy",
    },
  },

  // ============================================
  // COMMUNICATION
  // ============================================
  EMAIL: {
    endpoint: "/api/proxy/email",
    description: "Send emails via SendGrid",
    credits: "2 per email",
    example: {
      to: "user@example.com",
      subject: "Hello from RUX",
      html: "<p>This is a test email</p>",
      from: "noreply@yourdomain.com",
    },
  },

  SMS: {
    endpoint: "/api/proxy/sms",
    description: "Send SMS via Twilio",
    credits: "5 per SMS",
    example: {
      to: "+1234567890",
      message: "Your verification code is: 123456",
    },
  },

  // ============================================
  // DATA & UTILITIES
  // ============================================
  WEATHER: {
    endpoint: "/api/proxy/weather",
    description: "Weather data - current, forecast, and hourly",
    credits: "2 per request",
    operations: ["current", "forecast", "hourly"],
    examples: {
      current: {
        operation: "current",
        location: "San Francisco",
        units: "metric",
      },
      forecast: {
        operation: "forecast",
        lat: 37.7749,
        lon: -122.4194,
        units: "imperial",
      },
      hourly: {
        operation: "hourly",
        location: "New York,US",
        units: "metric",
      },
    },
  },

  QR_CODE: {
    endpoint: "/api/proxy/qr",
    description: "Generate QR codes",
    credits: "1 per QR code",
    example: {
      content: "https://example.com",
      size: 200,
    },
  },

  TRANSLATE: {
    endpoint: "/api/proxy/translate",
    description: "Translate text between languages",
    credits: "3 per request",
    example: {
      text: "Hello world",
      target: "es",
      source: "en",
    },
  },

  CURRENCY: {
    endpoint: "/api/proxy/currency",
    description: "Currency exchange rates",
    credits: "1 per request",
    example: {
      from: "USD",
      to: "EUR",
      amount: 100,
    },
  },

  STORAGE: {
    endpoint: "/api/proxy/storage",
    description: "Upload and store files",
    credits: "5 per MB",
    operations: ["upload", "download", "delete"],
  },

  // ============================================
  // CONTENT APIS
  // ============================================
  NEWS: {
    endpoint: "/api/proxy/news",
    description: "Latest news articles",
    credits: "3 per request",
    example: {
      country: "us",
      category: "technology",
      q: "artificial intelligence",
    },
  },

  STOCKS: {
    endpoint: "/api/proxy/stocks",
    description: "Stock market data",
    credits: "2 per request",
    example: {
      symbol: "AAPL",
    },
  },

  CRYPTO: {
    endpoint: "/api/proxy/crypto",
    description: "Cryptocurrency prices",
    credits: "2 per request",
    example: {
      ids: "bitcoin,ethereum",
      vs_currencies: "usd",
      include_24hr_change: true,
    },
  },

  MOVIES: {
    endpoint: "/api/proxy/movies",
    description: "Movie and TV show data",
    credits: "2 per request",
    operations: ["search", "popular", "details"],
    examples: {
      search: {
        operation: "search",
        query: "Inception",
      },
      popular: {
        operation: "popular",
      },
      details: {
        operation: "details",
        id: "27205",
      },
    },
  },
};

/**
 * Get all available proxy endpoints
 */
export function getAllProxyEndpoints(): string[] {
  return Object.values(PROXY_SERVICES).map((service) => service.endpoint);
}

/**
 * Get proxy service by endpoint
 */
export function getProxyService(endpoint: string) {
  return Object.values(PROXY_SERVICES).find((s) => s.endpoint === endpoint);
}

/**
 * Generate usage documentation for AI
 */
export function generateProxyDocs(): string {
  return `# RUX Proxy Services

All API calls in generated apps MUST use RUX proxy endpoints. This ensures:
- No need for users to have their own API keys
- Usage tracking and credit billing
- Rate limiting and abuse prevention
- CORS compliance

## Authentication
All proxy requests require the X-RUX-API-Key header:

\`\`\`typescript
fetch('/api/proxy/xai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-RUX-API-Key': apiKey  // Get from app config or user input
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});
\`\`\`

## Available Services

${Object.entries(PROXY_SERVICES)
  .map(([key, service]) => {
    const hasExample = "example" in service;
    const hasExamples = "examples" in service;

    return `
### ${key}
**Endpoint:** ${service.endpoint}
**Description:** ${service.description}
**Credits:** ${service.credits}

${
  hasExample
    ? `**Example:**
\`\`\`json
${JSON.stringify(service.example, null, 2)}
\`\`\``
    : ""
}

${
  hasExamples
    ? `**Examples:**
\`\`\`json
${JSON.stringify(service.examples, null, 2)}
\`\`\``
    : ""
}
`;
  })
  .join("\n")}

## Best Practices

1. **Always handle errors gracefully**
\`\`\`typescript
try {
  const response = await fetch('/api/proxy/xai', { ... });
  if (!response.ok) {
    const error = await response.json();
    console.error('Proxy error:', error);
    return;
  }
  const data = await response.json();
} catch (error) {
  console.error('Network error:', error);
}
\`\`\`

2. **Show loading states**
3. **Display credit costs to users**
4. **Cache responses when appropriate**
5. **Implement retry logic for failed requests**
`;
}
