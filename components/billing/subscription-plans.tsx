"use client";

import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    description: "Perfect for trying out RUX",
    price: "$0",
    period: "forever",
    features: [
      "3,000 credits/month",
      "3 projects",
      "xAI Grok model",
      "Basic code generation",
      "Live preview",
      "Web app deployment",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    description: "For serious app builders",
    price: "$39",
    period: "per month",
    features: [
      "50,000 credits/month",
      "20 projects",
      "xAI Grok model",
      "Priority queue",
      "GitHub integration",
      "Android APK builds",
      "Email support",
    ],
    highlighted: true,
    badge: "Most Popular",
    clerkPlanId: "PRO", // This should match your Clerk plan ID
  },
  {
    name: "Elite",
    description: "Maximum power and flexibility",
    price: "$89",
    period: "per month",
    features: [
      "200,000 credits/month",
      "Unlimited projects",
      "Claude AI (fastest)",
      "Use your own Claude key",
      "iOS & Android builds",
      "Priority support",
      "Early access to features",
      "Custom integrations",
    ],
    highlighted: false,
    clerkPlanId: "ELITE", // This should match your Clerk plan ID
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

export function SubscriptionPlans() {
  const { user, isLoaded, isSignedIn } = useUser();
  const currentPlan = user?.publicMetadata?.plan as string | undefined;

  const handleUpgrade = (planName: string) => {
    if (!isSignedIn) {
      // Redirect to sign up with plan query param
      window.location.href = `/sign-up?plan=${planName.toLowerCase()}`;
      return;
    }

    // For Clerk Billing, redirect to user profile where billing is managed
    // Clerk automatically shows available subscription plans in the billing section
    window.location.href = "/user-profile";
  };

  return (
    <section className="py-12">
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
            Subscription Plans
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Choose the plan that fits your needs. All plans include credits that
            reset monthly.
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
          {plans.map((plan) => {
            const isCurrentPlan =
              currentPlan === plan.clerkPlanId ||
              (plan.name === "Free" && !currentPlan);

            return (
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

                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <Badge
                      variant="outline"
                      className="absolute top-4 right-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
                    >
                      Current Plan
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
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan
                      ? "Current Plan"
                      : plan.name === "Free"
                        ? "Get Started"
                        : "Upgrade"}
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
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
