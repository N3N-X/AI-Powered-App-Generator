"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthModal } from "@/components/auth/auth-modal";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

const plans = [
  {
    name: "Free",
    description: "Perfect for trying out Rulxy",
    price: "$0",
    period: "forever",
    features: [
      "3,000 credits (one-time)",
      "Unlimited projects",
      "Advanced code generation",
      "Live preview",
      "Web app deployment",
      "iOS & Android builds",
      "GitHub integration",
      "Email support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    description: "For serious app builders",
    price: "$39",
    period: "per month",
    features: [
      "50,000 credits/month",
      "Unlimited projects",
      "Advanced code generation",
      "Priority builds",
      "App Store & Play Store publishing",
      "Custom domains for web apps",
      "GitHub integration",
      "Email support",
    ],
    cta: "Start Pro",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Elite",
    description: "Maximum power and flexibility",
    price: "$89",
    period: "per month",
    features: [
      "200,000 credits/month",
      "Unlimited projects",
      "Advanced code generation",
      "Priority builds",
      "App Store & Play Store publishing",
      "Custom domains for web apps",
      "Early access to features",
      "Premium phone support",
    ],
    cta: "Go Elite",
    highlighted: false,
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function LandingPricing() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  const handlePlanClick = () => {
    if (!loading && user) {
      router.push("/dashboard/settings?tab=billing");
    } else {
      setAuthModalOpen(true);
    }
  };

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white"
          >
            Simple, Transparent Pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Start free and upgrade as you grow. No hidden fees, cancel anytime.
          </motion.p>
        </div>

        {/* Pricing cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={item}
              className={cn("relative", plan.highlighted && "lg:-mt-4 lg:mb-4")}
            >
              {/* Animated glow for highlighted plan */}
              {plan.highlighted && (
                <div className="absolute -inset-1 bg-gradient-to-b from-violet-500 via-purple-500 to-indigo-500 rounded-3xl blur-xl opacity-50 animate-gradient-flow" />
              )}

              {/* Badge - positioned outside the card */}
              {plan.badge && (
                <Badge
                  variant="premium"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 rounded-full px-4 py-1.5 liquid-glow liquid-shimmer"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {plan.badge}
                </Badge>
              )}

              <div
                className={cn(
                  "relative h-full rounded-3xl p-8 transition-all duration-500 group",
                  plan.highlighted
                    ? "liquid-glass-card liquid-shadow-xl liquid-border-animated liquid-glow-hover"
                    : "liquid-glass-card liquid-shadow liquid-glass-hover",
                )}
              >
                {/* Plan header */}
                <div className="mb-6">
                  <h3
                    className={cn(
                      "text-xl font-semibold text-gray-900 dark:text-white",
                      plan.highlighted && "gradient-text",
                    )}
                  >
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-slate-400 ml-2">
                    /{plan.period}
                  </span>
                </div>

                {/* CTA */}
                <Button
                  variant={plan.highlighted ? "gradient" : "glass"}
                  className={cn(
                    "w-full mb-6",
                    plan.highlighted && "liquid-glow-hover",
                  )}
                  onClick={handlePlanClick}
                >
                  {plan.cta}
                </Button>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="rounded-full p-0.5 bg-gradient-to-br from-emerald-500 to-teal-500 mt-0.5">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-slate-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ link */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12 text-gray-600 dark:text-slate-400"
        >
          Have questions?{" "}
          <a
            href="/pricing#faq"
            className="text-violet-600 dark:text-violet-400 hover:underline"
          >
            Check our FAQ
          </a>
        </motion.p>
      </div>

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultMode="signup"
      />
    </section>
  );
}
