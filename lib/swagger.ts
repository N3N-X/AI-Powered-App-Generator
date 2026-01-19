import swaggerJSDoc from "swagger-jsdoc";
import path from "path";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "RUX API",
      version: "1.0.0",
      description: `
# RUX - AI-Powered Mobile App Generator API

RUX provides a comprehensive API for generating, building, and deploying mobile applications.

## Authentication

RUX uses two authentication methods:

### Clerk Authentication (ClerkAuth)
Used for dashboard and management endpoints. Requires a valid Clerk session.

### API Key Authentication (ApiKeyAuth)
Used for proxy services in generated apps. Include the key in the \`x-rux-api-key\` header
or as a Bearer token in the \`Authorization\` header.

## Proxy Services

The Proxy Services allow generated apps to access third-party APIs without needing their own API keys.
All proxy calls are rate-limited and use a credit-based billing system.

| Service | Credits per Request | Rate Limit |
|---------|--------------------| -----------|
| OpenAI | 10 per 1K tokens | 60/min |
| Maps | 1 per request | 100/min |
| Email | 2 per recipient | 30/min |
| SMS | 5 per segment | 20/min |
| Storage | Varies | 100/min |

## Credits

Each plan includes monthly credits:
- **FREE**: 1,000 credits/month
- **PRO**: 10,000 credits/month
- **ELITE**: 100,000 credits/month
      `,
    },
    servers: [
      {
        url:
          process.env.NODE_ENV === "production"
            ? "https://yourdomain.com"
            : "http://localhost:3000",
        description:
          process.env.NODE_ENV === "production"
            ? "Production server"
            : "Development server",
      },
    ],
    tags: [
      {
        name: "Proxy Services",
        description:
          "Managed API access for generated apps (OpenAI, Maps, Email, SMS, Storage)",
      },
      {
        name: "API Keys",
        description: "Manage API keys for proxy service authentication",
      },
      {
        name: "Projects",
        description: "Project management endpoints",
      },
      {
        name: "Code Generation",
        description: "AI-powered code generation endpoints",
      },
      {
        name: "Builds",
        description: "Mobile app build management",
      },
      {
        name: "GitHub",
        description: "GitHub integration endpoints",
      },
      {
        name: "Credentials",
        description: "Developer credential management (Apple, Google, Expo)",
      },
      {
        name: "Payments",
        description: "Stripe payment and subscription endpoints",
      },
    ],
    components: {
      securitySchemes: {
        ClerkAuth: {
          type: "apiKey",
          in: "cookie",
          name: "__session",
          description: "Clerk session cookie for authenticated users",
        },
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-rux-api-key",
          description: "RUX API key for proxy services (format: rux_xxxxx)",
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Alternative: Pass RUX API key as Bearer token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: {
                message: { type: "string" },
                code: { type: "string" },
              },
            },
          },
        },
        Credits: {
          type: "object",
          properties: {
            creditsUsed: { type: "integer" },
            creditsRemaining: { type: "integer" },
          },
        },
        ProxyService: {
          type: "string",
          enum: [
            "OPENAI",
            "MAPS",
            "EMAIL",
            "SMS",
            "STORAGE",
            "DATABASE",
            "PUSH",
            "ANALYTICS",
          ],
        },
      },
    },
  },
  apis: [path.join(process.cwd(), "app/api/**/*.ts")],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
