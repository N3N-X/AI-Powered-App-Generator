import Stripe from "stripe";

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    })
  : null;

export const isStripeConfigured = (): boolean => {
  return !!process.env.STRIPE_SECRET_KEY;
};

// ============================================
// Subscription Plans (via Clerk Billing)
// ============================================

export const PLANS = {
  FREE: {
    name: "Free",
    description: "Get started with basic features",
    price: 0,
    interval: null,
    features: [
      "3,000 credits/month",
      "3 projects",
      "Basic code generation",
      "Community support",
      "Web app deployment",
    ],
    limits: {
      monthlyCredits: 3000,
      maxProjects: 3,
      githubExport: false,
      mobileBuild: false,
      customClaudeKey: false,
    },
  },
  PRO: {
    name: "Pro",
    description: "For serious builders",
    price: 19,
    interval: "month",
    features: [
      "50,000 credits/month",
      "20 projects",
      "Advanced code generation",
      "GitHub integration",
      "Android APK builds",
      "Priority support",
    ],
    limits: {
      monthlyCredits: 50000,
      maxProjects: 20,
      githubExport: true,
      mobileBuild: true,
      customClaudeKey: false,
    },
  },
  ELITE: {
    name: "Elite",
    description: "Unlimited power for teams",
    price: 49,
    interval: "month",
    features: [
      "200,000 credits/month",
      "Unlimited projects",
      "Premium code generation",
      "GitHub + GitLab integration",
      "iOS & Android builds",
      "Custom Claude API key",
      "Dedicated support",
    ],
    limits: {
      monthlyCredits: 200000,
      maxProjects: -1, // unlimited
      githubExport: true,
      mobileBuild: true,
      customClaudeKey: true,
    },
  },
} as const;

export type PlanType = keyof typeof PLANS;

// ============================================
// Token Packages (One-time purchases)
// ============================================

export const TOKEN_PACKAGES = {
  SMALL: {
    id: "small",
    name: "Small Pack",
    credits: 10000,
    price: 5, // $5
    priceId: process.env.STRIPE_TOKEN_SMALL_PRICE_ID || null,
    popular: false,
  },
  MEDIUM: {
    id: "medium",
    name: "Medium Pack",
    credits: 25000,
    price: 10, // $10 - 20% bonus
    priceId: process.env.STRIPE_TOKEN_MEDIUM_PRICE_ID || null,
    popular: true,
  },
  LARGE: {
    id: "large",
    name: "Large Pack",
    credits: 60000,
    price: 20, // $20 - 50% bonus
    priceId: process.env.STRIPE_TOKEN_LARGE_PRICE_ID || null,
    popular: false,
  },
  MEGA: {
    id: "mega",
    name: "Mega Pack",
    credits: 150000,
    price: 40, // $40 - 87.5% bonus
    priceId: process.env.STRIPE_TOKEN_MEGA_PRICE_ID || null,
    popular: false,
  },
} as const;

export type TokenPackageType = keyof typeof TOKEN_PACKAGES;

// ============================================
// Credit Costs (operations)
// ============================================

export const CREDIT_COSTS = {
  // AI Generation
  PROMPT_SMALL: 10,      // Simple prompts (<500 chars)
  PROMPT_MEDIUM: 50,     // Medium prompts (500-2000 chars)
  PROMPT_LARGE: 200,     // Large prompts (>2000 chars)

  // Builds
  ANDROID_BUILD: 1000,   // Android APK build
  IOS_BUILD: 2000,       // iOS IPA build

  // Exports
  GITHUB_EXPORT: 100,    // Export to GitHub
  ZIP_EXPORT: 50,        // Download as ZIP

  // Proxy Services (per request)
  AI_CHAT: 5,           // AI chat request
  IMAGE_GEN: 100,       // Image generation
  TRANSCRIPTION: 50,    // Audio transcription
  TTS: 30,              // Text-to-speech
  SEARCH: 2,            // Search query
  EMAIL: 1,             // Send email
  SMS: 5,               // Send SMS
} as const;

// ============================================
// Helper Functions
// ============================================

export function getPlanLimits(plan: PlanType) {
  return PLANS[plan].limits;
}

export function getMonthlyCredits(plan: PlanType): number {
  return PLANS[plan].limits.monthlyCredits;
}

export function calculateCreditsForPrompt(promptLength: number): number {
  if (promptLength < 500) return CREDIT_COSTS.PROMPT_SMALL;
  if (promptLength < 2000) return CREDIT_COSTS.PROMPT_MEDIUM;
  return CREDIT_COSTS.PROMPT_LARGE;
}

// ============================================
// Clerk Billing Integration
// ============================================

/**
 * Updates user's Clerk metadata with plan info
 * This should be called when a subscription is created/updated via Clerk Billing
 */
export async function syncPlanToClerk(userId: string, plan: PlanType) {
  // Clerk Billing will handle this automatically via webhooks
  // This is a placeholder for any custom sync logic
  console.log(`[Billing] Plan synced for user ${userId}: ${plan}`);
}

/**
 * Get user's plan from Clerk session metadata
 */
export function getPlanFromMetadata(metadata: unknown): PlanType {
  const plan = (metadata as { plan?: string })?.plan;
  if (plan === "PRO" || plan === "ELITE") return plan;
  return "FREE";
}
