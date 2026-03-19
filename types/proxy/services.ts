import { z } from "zod";

// ============================================
// Proxy Service Types
// ============================================

export const ProxyServiceEnum = z.enum([
  // AI Models
  "xai", // Grok - Primary AI
  "openai", // GPT-4, GPT-4o
  "anthropic", // Claude
  "google_ai", // Gemini
  "groq", // Fast inference
  "cohere", // Command models
  "mistral", // Mistral models
  "perplexity", // Search-augmented AI

  // Image Generation
  "dall_e", // OpenAI DALL-E 3
  "stable_diffusion", // Stability AI
  "midjourney", // Midjourney API
  "flux", // Flux models

  // Search & Data
  "google_search", // Web search
  "image_search", // Image search
  "places", // Google Places
  "maps", // Maps & directions
  "serp", // SERP API

  // Media Processing
  "transcribe", // Audio transcription (Whisper)
  "tts", // Text-to-speech
  "video", // Video processing
  "pdf", // PDF generation
  "ocr", // Optical character recognition

  // Communication
  "email", // Resend/SendGrid
  "sms", // Twilio
  "push", // Push notifications
  "whatsapp", // WhatsApp Business

  // Data & Utilities
  "storage", // File storage (R2/S3)
  "database", // Generic database proxy for any data
  "auth", // User authentication for generated apps
  "analytics", // Event tracking
  "qr_code", // QR generation
  "weather", // Weather data
  "translate", // Translation
  "currency", // Currency conversion

  // Validation & Verification
  "email_validate", // Email verification
  "phone_validate", // Phone validation
  "domain_whois", // Domain lookup

  // Content APIs
  "news", // News API
  "stocks", // Stock market data
  "crypto", // Cryptocurrency data
  "movies", // Movies/TV data (TMDB)
  "books", // Book search
  "sports", // Sports data
]);
export type ProxyService = z.infer<typeof ProxyServiceEnum>;

// Service categories for UI grouping
export const SERVICE_CATEGORIES = {
  ai_models: {
    name: "AI Models",
    services: [
      "xai",
      "openai",
      "anthropic",
      "google_ai",
      "groq",
      "cohere",
      "mistral",
      "perplexity",
    ],
  },
  image_generation: {
    name: "Image Generation",
    services: ["dall_e", "stable_diffusion", "midjourney", "flux"],
  },
  search_data: {
    name: "Search & Data",
    services: ["google_search", "image_search", "places", "maps", "serp"],
  },
  media_processing: {
    name: "Media Processing",
    services: ["transcribe", "tts", "video", "pdf", "ocr"],
  },
  communication: {
    name: "Communication",
    services: ["email", "sms", "push", "whatsapp"],
  },
  utilities: {
    name: "Data & Utilities",
    services: [
      "storage",
      "database",
      "auth",
      "analytics",
      "qr_code",
      "weather",
      "translate",
      "currency",
    ],
  },
  validation: {
    name: "Validation",
    services: ["email_validate", "phone_validate", "domain_whois"],
  },
  content_apis: {
    name: "Content APIs",
    services: ["news", "stocks", "crypto", "movies", "books", "sports"],
  },
} as const;
