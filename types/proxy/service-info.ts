import { ProxyService } from "./services";

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
    description:
      "Store any data in collections (bookings, todos, products, etc.)",
    icon: "🗄️",
  },
  auth: {
    name: "Auth",
    description: "User authentication for your generated apps",
    icon: "🔐",
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
