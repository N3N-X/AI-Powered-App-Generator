import { Metadata } from "next";
import { TermsContent } from "./terms-content";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Read the Rulxy Terms of Service. Understand your rights and responsibilities when using our AI-powered app builder, including subscriptions, IP ownership, and data policies.",
  alternates: { canonical: "https://rulxy.com/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-32 pb-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Terms of Service
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400">
          Last updated: January 20, 2026
        </p>
      </div>

      {/* Content Card */}
      <TermsContent />
    </div>
  );
}
