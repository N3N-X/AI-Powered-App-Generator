import { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/navbar";
import { LandingFooter } from "@/components/landing/footer";
import { SubscriptionPlans } from "@/components/billing/subscription-plans";
import { PricingFAQ } from "@/components/landing/pricing-faq";
import { TokenPackages } from "@/components/billing/token-packages";

export const metadata: Metadata = {
  title: "Pricing - RUX",
  description:
    "Simple, transparent pricing for RUX. Start free and upgrade as you grow.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[128px]" />
      </div>

      <LandingNavbar />

      <main className="pt-24">
        <div className="text-center px-4 mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Start free and scale as you need. All plans include our core
            AI-powered code generation.
          </p>
        </div>

        <SubscriptionPlans />

        {/* Token Packages Section */}
        <div className="mt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <TokenPackages />
        </div>

        <PricingFAQ />
      </main>

      <LandingFooter />
    </div>
  );
}
