import { Plan } from "../index";
import { ProxyService } from "./services";

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
  database: 1, // Per operation (create, read, update, delete)
  auth: 1, // Per auth operation (signup, login, etc.)
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
