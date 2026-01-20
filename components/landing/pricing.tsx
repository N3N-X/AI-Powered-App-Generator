"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    description: "Perfect for trying out RUX",
    price: "$0",
    period: "forever",
    features: [
      "20 prompts per day",
      "3 projects",
      "xAI Grok model",
      "Basic code generation",
      "Live preview",
      "Export to ZIP",
    ],
    cta: "Get Started",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    description: "For serious app builders",
    price: "$29",
    period: "per month",
    features: [
      "100 prompts per day",
      "20 projects",
      "xAI Grok model",
      "Priority queue",
      "GitHub integration",
      "Cloud builds (APK/IPA)",
      "Connect dev accounts",
      "Email support",
    ],
    cta: "Start Pro Trial",
    href: "/signup?plan=pro",
    highlighted: true,
    badge: "Most Popular",
  },
  {
    name: "Elite",
    description: "Maximum power and flexibility",
    price: "$99",
    period: "per month",
    features: [
      "500 prompts per day",
      "Unlimited projects",
      "Claude AI (fastest)",
      "Use your own Claude key",
      "Priority support",
      "All Pro features",
      "Early access to features",
      "Custom integrations",
    ],
    cta: "Go Elite",
    href: "/signup?plan=elite",
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
              className={cn(
                "relative rounded-2xl",
                plan.highlighted && "lg:-mt-4 lg:mb-4",
              )}
            >
              {/* Highlight glow */}
              {plan.highlighted && (
                <div className="absolute -inset-[1px] bg-gradient-to-b from-violet-500 to-indigo-500 rounded-2xl blur-sm" />
              )}

              <div
                className={cn(
                  "relative h-full rounded-2xl p-8 transition-all duration-300",
                  plan.highlighted
                    ? "bg-white/80 dark:bg-slate-900 border border-violet-500/50 shadow-xl shadow-violet-500/10 dark:shadow-violet-500/20"
                    : "bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:bg-white/80 dark:hover:bg-white/[0.08]",
                )}
              >
                {/* Badge */}
                {plan.badge && (
                  <Badge
                    variant="premium"
                    className="absolute -top-3 left-1/2 -translate-x-1/2"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {plan.badge}
                  </Badge>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
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
                  variant={plan.highlighted ? "gradient" : "outline"}
                  className="w-full mb-6"
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
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
          <Link
            href="/pricing#faq"
            className="text-violet-600 dark:text-violet-400 hover:underline"
          >
            Check our FAQ
          </Link>
        </motion.p>
      </div>
    </section>
  );
}
