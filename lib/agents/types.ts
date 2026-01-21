/**
 * Multi-Agent System Types
 *
 * Architecture:
 * 1. Orchestrator (grok-4-1-fast-reasoning) - Plans and breaks down the app
 * 2. Workers (grok-code-fast-1) - Generate code in parallel
 * 3. Critic (claude-haiku) - Validates and catches errors
 */

export type Platform = "IOS" | "ANDROID" | "WEB";

export type AgentRole =
  | "orchestrator"
  | "frontend"
  | "backend"
  | "mobile"
  | "critic";

export type StreamPhase =
  | "planning"
  | "awaiting_confirmation"
  | "building"
  | "validating"
  | "fixing"
  | "complete"
  | "error";

export interface StreamUpdate {
  phase: StreamPhase;
  message: string;
  icon: string;
  progress?: number; // 0-100
  detail?: string;
  appSpec?: AppSpec; // Sent during awaiting_confirmation phase for user review
}

export interface AppSpec {
  name: string;
  description: string;
  platforms: Platform[];
  features: string[];
  screens: ScreenSpec[];
  api: ApiSpec;
  styling: StylingSpec;
}

export interface ScreenSpec {
  name: string;
  path: string;
  description: string;
  components: string[];
  dataNeeded: string[];
}

export interface ApiSpec {
  collections: CollectionSpec[];
  externalApis: string[];
  authRequired: boolean;
  paymentsRequired: boolean;
}

export interface CollectionSpec {
  name: string;
  fields: { name: string; type: string }[];
}

export interface StylingSpec {
  primaryColor: string;
  secondaryColor: string;
  style: "modern" | "minimal" | "vibrant" | "dark" | "light";
}

export interface WorkerTask {
  id: string;
  role: AgentRole;
  platform?: Platform;
  prompt: string;
  dependencies?: string[]; // task IDs this depends on
}

export interface WorkerResult {
  taskId: string;
  files: Record<string, string>;
  success: boolean;
  error?: string;
}

export interface CriticResult {
  valid: boolean;
  errors: CriticError[];
  suggestions: string[];
}

export interface CriticError {
  file: string;
  line?: number;
  message: string;
  severity: "error" | "warning";
  fix?: string;
}

export interface GenerationContext {
  userPrompt: string;
  platforms: Platform[];
  apiBaseUrl: string;
  apiKey?: string;
  existingCode?: Record<string, string>;
}

// Proxy services available to generated apps
export const PROXY_SERVICES = {
  DATABASE: {
    name: "Database",
    endpoint: "/api/proxy/db",
    description: "CRUD operations for app data",
  },
  AUTH: {
    name: "Authentication",
    endpoint: "/api/proxy/auth",
    description: "User login, signup, sessions",
  },
  EMAIL: {
    name: "Email",
    endpoint: "/api/proxy/email",
    description: "Send transactional emails",
  },
  SMS: {
    name: "SMS",
    endpoint: "/api/proxy/sms",
    description: "Send text messages",
  },
  MAPS: {
    name: "Maps",
    endpoint: "/api/proxy/maps",
    description: "Geocoding, directions, places",
  },
  STORAGE: {
    name: "Storage",
    endpoint: "/api/proxy/storage",
    description: "File uploads and downloads",
  },
  OPENAI: {
    name: "AI",
    endpoint: "/api/proxy/openai",
    description: "GPT, embeddings, image generation",
  },
  PAYMENTS: {
    name: "Payments",
    endpoint: "/api/proxy/payments",
    description: "Stripe payments, subscriptions, in-app purchases",
  },
} as const;

export type ProxyServiceKey = keyof typeof PROXY_SERVICES;
