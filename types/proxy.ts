import { z } from "zod";
import { Plan } from "./index";

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
  "database", // Managed Postgres
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

// Service metadata for display
export const SERVICE_INFO: Record<
  ProxyService,
  { name: string; description: string; icon: string }
> = {
  // AI Models
  xai: {
    name: "Grok (XAI)",
    description: "xAI's Grok models for chat and reasoning",
    icon: "🤖",
  },
  openai: {
    name: "OpenAI",
    description: "GPT-4, GPT-4o, and other OpenAI models",
    icon: "🧠",
  },
  anthropic: {
    name: "Claude",
    description: "Anthropic's Claude models",
    icon: "🎭",
  },
  google_ai: {
    name: "Gemini",
    description: "Google's Gemini AI models",
    icon: "✨",
  },
  groq: {
    name: "Groq",
    description: "Ultra-fast inference with Groq",
    icon: "⚡",
  },
  cohere: {
    name: "Cohere",
    description: "Command and embed models",
    icon: "🔗",
  },
  mistral: { name: "Mistral", description: "Mistral AI models", icon: "🌬️" },
  perplexity: {
    name: "Perplexity",
    description: "Search-augmented AI responses",
    icon: "🔍",
  },

  // Image Generation
  dall_e: {
    name: "DALL-E 3",
    description: "OpenAI's image generation",
    icon: "🎨",
  },
  stable_diffusion: {
    name: "Stable Diffusion",
    description: "Stability AI image generation",
    icon: "🖼️",
  },
  midjourney: {
    name: "Midjourney",
    description: "High-quality image generation",
    icon: "🌅",
  },
  flux: {
    name: "Flux",
    description: "Fast image generation models",
    icon: "💫",
  },

  // Search & Data
  google_search: {
    name: "Google Search",
    description: "Web search results",
    icon: "🔎",
  },
  image_search: {
    name: "Image Search",
    description: "Search for images",
    icon: "🖼️",
  },
  places: {
    name: "Google Places",
    description: "Place details and autocomplete",
    icon: "📍",
  },
  maps: { name: "Maps", description: "Directions and geocoding", icon: "🗺️" },
  serp: {
    name: "SERP",
    description: "Search engine results pages",
    icon: "📊",
  },

  // Media Processing
  transcribe: {
    name: "Transcription",
    description: "Audio to text (Whisper)",
    icon: "🎤",
  },
  tts: {
    name: "Text-to-Speech",
    description: "Convert text to audio",
    icon: "🔊",
  },
  video: {
    name: "Video",
    description: "Video processing and conversion",
    icon: "🎬",
  },
  pdf: { name: "PDF", description: "PDF generation and parsing", icon: "📄" },
  ocr: { name: "OCR", description: "Extract text from images", icon: "👁️" },

  // Communication
  email: {
    name: "Email",
    description: "Send transactional emails",
    icon: "📧",
  },
  sms: { name: "SMS", description: "Send text messages", icon: "💬" },
  push: {
    name: "Push Notifications",
    description: "Mobile push notifications",
    icon: "🔔",
  },
  whatsapp: {
    name: "WhatsApp",
    description: "WhatsApp Business messaging",
    icon: "💚",
  },

  // Data & Utilities
  storage: {
    name: "Storage",
    description: "File upload and storage",
    icon: "📦",
  },
  database: {
    name: "Database",
    description: "Managed PostgreSQL queries",
    icon: "🗄️",
  },
  analytics: {
    name: "Analytics",
    description: "Event tracking and metrics",
    icon: "📈",
  },
  qr_code: { name: "QR Code", description: "Generate QR codes", icon: "📱" },
  weather: {
    name: "Weather",
    description: "Weather forecasts and data",
    icon: "🌤️",
  },
  translate: {
    name: "Translate",
    description: "Language translation",
    icon: "🌐",
  },
  currency: {
    name: "Currency",
    description: "Currency conversion rates",
    icon: "💱",
  },

  // Validation
  email_validate: {
    name: "Email Validation",
    description: "Verify email addresses",
    icon: "✅",
  },
  phone_validate: {
    name: "Phone Validation",
    description: "Verify phone numbers",
    icon: "📞",
  },
  domain_whois: {
    name: "Domain WHOIS",
    description: "Domain registration lookup",
    icon: "🌐",
  },

  // Content APIs
  news: { name: "News", description: "Latest news articles", icon: "📰" },
  stocks: { name: "Stocks", description: "Stock market data", icon: "📉" },
  crypto: { name: "Crypto", description: "Cryptocurrency prices", icon: "₿" },
  movies: {
    name: "Movies & TV",
    description: "Movie and TV show data",
    icon: "🎬",
  },
  books: { name: "Books", description: "Book search and data", icon: "📚" },
  sports: { name: "Sports", description: "Sports scores and data", icon: "⚽" },
};

// ============================================
// Usage Credits System
// ============================================

// Credits included per plan (per month) - aligned with createanything.com
export const PLAN_CREDITS: Record<Plan, number> = {
  FREE: 3000, // One-time, no monthly reset
  PRO: 20000, // Resets monthly
  ELITE: 50000, // Resets monthly
};

// Whether plan credits refresh monthly
export const PLAN_CREDITS_REFRESH: Record<Plan, boolean> = {
  FREE: false,
  PRO: true,
  ELITE: true,
};

// Credit cost per operation
export const SERVICE_CREDIT_COSTS: Record<ProxyService, number> = {
  // AI Models (per 1K tokens)
  xai: 8, // Grok - primary, slightly cheaper
  openai: 10, // GPT-4o
  anthropic: 12, // Claude
  google_ai: 10, // Gemini
  groq: 5, // Fast but cheaper
  cohere: 8, // Command
  mistral: 6, // Mistral
  perplexity: 15, // Includes search

  // Image Generation (per image)
  dall_e: 50, // DALL-E 3
  stable_diffusion: 30, // SD3
  midjourney: 60, // Premium
  flux: 25, // Fast

  // Search & Data (per request)
  google_search: 5, // Web search
  image_search: 5, // Image search
  places: 3, // Places API
  maps: 2, // Directions
  serp: 5, // SERP results

  // Media Processing
  transcribe: 20, // Per minute of audio
  tts: 10, // Per 1K characters
  video: 50, // Per minute
  pdf: 5, // Per document
  ocr: 10, // Per image

  // Communication
  email: 2, // Per email
  sms: 5, // Per SMS
  push: 1, // Per 1K notifications
  whatsapp: 8, // Per message

  // Data & Utilities
  storage: 1, // Per 10MB stored
  database: 1, // Per 100 queries
  analytics: 1, // Per 1K events
  qr_code: 1, // Per QR code
  weather: 2, // Per request
  translate: 3, // Per 1K characters
  currency: 1, // Per request

  // Validation
  email_validate: 2, // Per validation
  phone_validate: 3, // Per validation
  domain_whois: 5, // Per lookup

  // Content APIs
  news: 3, // Per request
  stocks: 2, // Per request
  crypto: 2, // Per request
  movies: 2, // Per request
  books: 2, // Per request
  sports: 2, // Per request
};

// ============================================
// AI Model Types (XAI Primary)
// ============================================

export const XAIModels = ["grok-beta", "grok-2", "grok-2-mini"] as const;
export const OpenAIModels = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "o1-preview",
  "o1-mini",
] as const;
export const AnthropicModels = [
  "claude-3-5-sonnet-20241022",
  "claude-3-5-haiku-20241022",
  "claude-3-opus-20240229",
] as const;
export const GoogleAIModels = [
  "gemini-2.0-flash",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
] as const;
export const GroqModels = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
] as const;
export const MistralModels = [
  "mistral-large-latest",
  "mistral-medium-latest",
  "mistral-small-latest",
] as const;

export const AIProxyRequestSchema = z.object({
  provider: z.enum([
    "xai",
    "openai",
    "anthropic",
    "google_ai",
    "groq",
    "cohere",
    "mistral",
    "perplexity",
  ]),
  model: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant"]),
      content: z.string(),
    }),
  ),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().min(1).max(16384).optional(),
  stream: z.boolean().optional().default(false),
});
export type AIProxyRequest = z.infer<typeof AIProxyRequestSchema>;

export const AIProxyResponseSchema = z.object({
  id: z.string(),
  provider: z.string(),
  model: z.string(),
  choices: z.array(
    z.object({
      message: z.object({
        role: z.string(),
        content: z.string(),
      }),
      finish_reason: z.string(),
    }),
  ),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
  creditsUsed: z.number(),
});
export type AIProxyResponse = z.infer<typeof AIProxyResponseSchema>;

// ============================================
// Image Generation Types
// ============================================

export const ImageGenerationRequestSchema = z.object({
  provider: z.enum(["dall_e", "stable_diffusion", "midjourney", "flux"]),
  prompt: z.string().min(1).max(4000),
  negative_prompt: z.string().optional(),
  size: z
    .enum(["256x256", "512x512", "1024x1024", "1024x1792", "1792x1024"])
    .default("1024x1024"),
  n: z.number().min(1).max(4).default(1),
  style: z.string().optional(),
  quality: z.enum(["standard", "hd"]).optional(),
});
export type ImageGenerationRequest = z.infer<
  typeof ImageGenerationRequestSchema
>;

export const ImageGenerationResponseSchema = z.object({
  images: z.array(
    z.object({
      url: z.string(),
      revised_prompt: z.string().optional(),
    }),
  ),
  creditsUsed: z.number(),
});
export type ImageGenerationResponse = z.infer<
  typeof ImageGenerationResponseSchema
>;

// ============================================
// Search Types
// ============================================

export const SearchRequestSchema = z.object({
  query: z.string().min(1).max(500),
  type: z.enum(["web", "image", "news"]).default("web"),
  num: z.number().min(1).max(20).default(10),
  start: z.number().optional(),
  dateRestrict: z.string().optional(), // e.g., "d7" for last 7 days
  gl: z.string().optional(), // Country code
  hl: z.string().optional(), // Language
});
export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export const SearchResponseSchema = z.object({
  results: z.array(
    z.object({
      title: z.string(),
      link: z.string(),
      snippet: z.string(),
      thumbnail: z.string().optional(),
    }),
  ),
  totalResults: z.number().optional(),
  creditsUsed: z.number(),
});
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

// ============================================
// Maps Proxy Types
// ============================================

export const MapsGeocodeRequestSchema = z.object({
  address: z.string().optional(),
  latlng: z.string().optional(), // "lat,lng" format for reverse geocoding
  placeId: z.string().optional(),
});
export type MapsGeocodeRequest = z.infer<typeof MapsGeocodeRequestSchema>;

export const MapsDirectionsRequestSchema = z.object({
  origin: z.string(),
  destination: z.string(),
  mode: z
    .enum(["driving", "walking", "bicycling", "transit"])
    .default("driving"),
  waypoints: z.array(z.string()).optional(),
  alternatives: z.boolean().optional(),
});
export type MapsDirectionsRequest = z.infer<typeof MapsDirectionsRequestSchema>;

export const MapsPlacesRequestSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(), // "lat,lng"
  radius: z.number().max(50000).optional(),
  type: z.string().optional(),
});
export type MapsPlacesRequest = z.infer<typeof MapsPlacesRequestSchema>;

// ============================================
// Media Processing Types
// ============================================

export const TranscribeRequestSchema = z.object({
  audio_url: z.string().url().optional(),
  audio_base64: z.string().optional(),
  language: z.string().optional(),
  response_format: z.enum(["json", "text", "srt", "vtt"]).default("json"),
});
export type TranscribeRequest = z.infer<typeof TranscribeRequestSchema>;

export const TTSRequestSchema = z.object({
  text: z.string().min(1).max(4096),
  voice: z.string().default("alloy"),
  model: z.string().default("tts-1"),
  speed: z.number().min(0.25).max(4).default(1),
  response_format: z.enum(["mp3", "opus", "aac", "flac"]).default("mp3"),
});
export type TTSRequest = z.infer<typeof TTSRequestSchema>;

export const PDFGenerateRequestSchema = z.object({
  html: z.string().optional(),
  url: z.string().url().optional(),
  options: z
    .object({
      format: z.enum(["A4", "Letter", "Legal"]).default("A4"),
      landscape: z.boolean().default(false),
      margin: z
        .object({
          top: z.string().optional(),
          right: z.string().optional(),
          bottom: z.string().optional(),
          left: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});
export type PDFGenerateRequest = z.infer<typeof PDFGenerateRequestSchema>;

export const OCRRequestSchema = z.object({
  image_url: z.string().url().optional(),
  image_base64: z.string().optional(),
  language: z.string().optional(),
});
export type OCRRequest = z.infer<typeof OCRRequestSchema>;

// ============================================
// Email Proxy Types
// ============================================

export const EmailProxyRequestSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1).max(500),
  text: z.string().optional(),
  html: z.string().optional(),
  from: z.string().optional(), // Will use platform default if not provided
  replyTo: z.string().email().optional(),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string(), // Base64 encoded
        contentType: z.string().optional(),
      }),
    )
    .optional(),
});
export type EmailProxyRequest = z.infer<typeof EmailProxyRequestSchema>;

export const EmailProxyResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
  creditsUsed: z.number(),
});
export type EmailProxyResponse = z.infer<typeof EmailProxyResponseSchema>;

// ============================================
// SMS Proxy Types
// ============================================

export const SMSProxyRequestSchema = z.object({
  to: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Phone number must be in E.164 format"),
  message: z.string().min(1).max(1600),
  from: z.string().optional(), // Will use platform default if not provided
});
export type SMSProxyRequest = z.infer<typeof SMSProxyRequestSchema>;

export const SMSProxyResponseSchema = z.object({
  success: z.boolean(),
  messageId: z.string().optional(),
  creditsUsed: z.number(),
});
export type SMSProxyResponse = z.infer<typeof SMSProxyResponseSchema>;

// ============================================
// Storage Proxy Types
// ============================================

export const StorageUploadRequestSchema = z.object({
  filename: z.string(),
  contentType: z.string(),
  size: z.number().max(50 * 1024 * 1024), // 50MB max
  isPublic: z.boolean().default(false),
});
export type StorageUploadRequest = z.infer<typeof StorageUploadRequestSchema>;

export const StorageUploadResponseSchema = z.object({
  success: z.boolean(),
  uploadUrl: z.string(), // Presigned URL for upload
  fileUrl: z.string(), // Final URL after upload
  fileId: z.string(),
  expiresAt: z.string(),
});
export type StorageUploadResponse = z.infer<typeof StorageUploadResponseSchema>;

export const StorageDeleteRequestSchema = z.object({
  fileId: z.string(),
});
export type StorageDeleteRequest = z.infer<typeof StorageDeleteRequestSchema>;

export const StorageListRequestSchema = z.object({
  prefix: z.string().optional(),
  limit: z.number().max(100).default(20),
  cursor: z.string().optional(),
});
export type StorageListRequest = z.infer<typeof StorageListRequestSchema>;

// ============================================
// Database Proxy Types (Managed Postgres)
// ============================================

export const DatabaseQueryRequestSchema = z.object({
  query: z.string().max(10000),
  params: z.array(z.unknown()).optional(),
  timeout: z.number().max(30000).default(5000), // 5s default, 30s max
});
export type DatabaseQueryRequest = z.infer<typeof DatabaseQueryRequestSchema>;

export const DatabaseQueryResponseSchema = z.object({
  success: z.boolean(),
  rows: z.array(z.record(z.unknown())),
  rowCount: z.number(),
  creditsUsed: z.number(),
});
export type DatabaseQueryResponse = z.infer<typeof DatabaseQueryResponseSchema>;

// ============================================
// Push Notification Proxy Types
// ============================================

export const PushNotificationRequestSchema = z.object({
  tokens: z.array(z.string()).max(500),
  title: z.string().max(100),
  body: z.string().max(500),
  data: z.record(z.string()).optional(),
  badge: z.number().optional(),
  sound: z.string().optional(),
  priority: z.enum(["default", "high"]).default("default"),
});
export type PushNotificationRequest = z.infer<
  typeof PushNotificationRequestSchema
>;

export const PushNotificationResponseSchema = z.object({
  success: z.boolean(),
  successCount: z.number(),
  failureCount: z.number(),
  creditsUsed: z.number(),
});
export type PushNotificationResponse = z.infer<
  typeof PushNotificationResponseSchema
>;

// ============================================
// Analytics Proxy Types
// ============================================

export const AnalyticsEventRequestSchema = z.object({
  events: z
    .array(
      z.object({
        name: z.string().max(100),
        properties: z.record(z.unknown()).optional(),
        timestamp: z.string().optional(),
        userId: z.string().optional(),
        deviceId: z.string().optional(),
      }),
    )
    .max(100),
});
export type AnalyticsEventRequest = z.infer<typeof AnalyticsEventRequestSchema>;

export const AnalyticsEventResponseSchema = z.object({
  success: z.boolean(),
  eventsProcessed: z.number(),
  creditsUsed: z.number(),
});
export type AnalyticsEventResponse = z.infer<
  typeof AnalyticsEventResponseSchema
>;

// ============================================
// Utility Types
// ============================================

export const QRCodeRequestSchema = z.object({
  data: z.string().min(1).max(2000),
  size: z.number().min(100).max(1000).default(300),
  format: z.enum(["png", "svg"]).default("png"),
  errorCorrection: z.enum(["L", "M", "Q", "H"]).default("M"),
});
export type QRCodeRequest = z.infer<typeof QRCodeRequestSchema>;

export const WeatherRequestSchema = z.object({
  location: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  units: z.enum(["metric", "imperial"]).default("metric"),
});
export type WeatherRequest = z.infer<typeof WeatherRequestSchema>;

export const TranslateRequestSchema = z.object({
  text: z.string().min(1).max(5000),
  source: z.string().optional(), // Auto-detect if not provided
  target: z.string(),
});
export type TranslateRequest = z.infer<typeof TranslateRequestSchema>;

export const CurrencyRequestSchema = z.object({
  from: z.string().length(3),
  to: z.string().length(3),
  amount: z.number().positive().default(1),
});
export type CurrencyRequest = z.infer<typeof CurrencyRequestSchema>;

// ============================================
// Content API Types
// ============================================

export const NewsRequestSchema = z.object({
  query: z.string().optional(),
  category: z
    .enum([
      "general",
      "business",
      "technology",
      "sports",
      "entertainment",
      "health",
      "science",
    ])
    .optional(),
  country: z.string().optional(),
  pageSize: z.number().min(1).max(100).default(10),
});
export type NewsRequest = z.infer<typeof NewsRequestSchema>;

export const StocksRequestSchema = z.object({
  symbol: z.string(),
  interval: z
    .enum([
      "1min",
      "5min",
      "15min",
      "30min",
      "60min",
      "daily",
      "weekly",
      "monthly",
    ])
    .default("daily"),
});
export type StocksRequest = z.infer<typeof StocksRequestSchema>;

export const CryptoRequestSchema = z.object({
  symbols: z.array(z.string()).max(10),
  convert: z.string().default("USD"),
});
export type CryptoRequest = z.infer<typeof CryptoRequestSchema>;

export const MoviesRequestSchema = z.object({
  query: z.string().optional(),
  id: z.number().optional(),
  type: z.enum(["movie", "tv"]).default("movie"),
  category: z
    .enum(["popular", "top_rated", "upcoming", "now_playing"])
    .optional(),
});
export type MoviesRequest = z.infer<typeof MoviesRequestSchema>;

// ============================================
// Proxy Authentication
// ============================================

export const ProxyAuthHeaderSchema = z.object({
  "x-rux-project-id": z.string(),
  "x-rux-api-key": z.string(),
});
export type ProxyAuthHeader = z.infer<typeof ProxyAuthHeaderSchema>;

// ============================================
// Usage Tracking
// ============================================

export interface ProxyUsageRecord {
  id: string;
  projectId: string;
  userId: string;
  service: ProxyService;
  operation: string;
  creditsUsed: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
