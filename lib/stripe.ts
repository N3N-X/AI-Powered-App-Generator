import Stripe from "stripe";

// Initialize Stripe only if the secret key is available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    })
  : null;

export const isStripeConfigured = (): boolean => {
  return !!(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PRO_PRICE_ID &&
    process.env.STRIPE_ELITE_PRICE_ID
  );
};

export const PLANS = {
  FREE: {
    name: "Free",
    description: "Get started with basic features",
    price: 0,
    priceId: null,
    features: [
      "20 prompts per day",
      "3 projects",
      "Basic code generation",
      "Community support",
    ],
    limits: {
      dailyPrompts: 20,
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
    priceId: process.env.STRIPE_PRO_PRICE_ID || null,
    features: [
      "100 prompts per day",
      "20 projects",
      "Advanced code generation",
      "GitHub integration",
      "Android APK builds",
      "Priority support",
    ],
    limits: {
      dailyPrompts: 100,
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
    priceId: process.env.STRIPE_ELITE_PRICE_ID || null,
    features: [
      "500 prompts per day",
      "Unlimited projects",
      "Premium code generation",
      "GitHub + GitLab integration",
      "iOS & Android builds",
      "Custom Claude API key",
      "Dedicated support",
    ],
    limits: {
      dailyPrompts: 500,
      maxProjects: -1, // unlimited
      githubExport: true,
      mobileBuild: true,
      customClaudeKey: true,
    },
  },
} as const;

export type PlanType = keyof typeof PLANS;
