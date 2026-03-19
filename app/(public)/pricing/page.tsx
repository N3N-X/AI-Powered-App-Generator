import { Metadata } from "next";
import { SubscriptionPlans } from "@/components/billing/subscription-plans";
import { PricingFAQ } from "@/components/landing/pricing-faq";
import { TokenPackages } from "@/components/billing/token-packages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing & Plans - AI App Builder Starting Free",
  description:
    "Simple, transparent pricing for Rulxy AI app builder. Start free with 3,000 credits/month. Pro and Elite plans for serious developers. No credit card required.",
};

export default function PricingPage() {
  return (
    <div className="pt-24">
      <div className="text-center px-4 mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
          Choose Your Plan
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
          Start free and scale as you need. All plans include our core
          AI-powered code generation.
        </p>
      </div>

      <SubscriptionPlans />

      <div className="mt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <TokenPackages />
      </div>

      <PricingFAQ />
    </div>
  );
}
