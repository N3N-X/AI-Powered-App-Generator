import { Metadata } from "next";
import {
  IntroductionSection,
  DataCollectionSection,
  DataUsageSection,
  DataSharingSection,
} from "./privacy-sections";
import {
  SecurityAndRetentionSection,
  RightsAndCookiesSection,
  LegalSection,
} from "./privacy-legal-sections";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Rulxy collects, uses, and protects your personal data. Read our full privacy policy covering data security, your rights, and GDPR compliance.",
  alternates: { canonical: "https://rulxy.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-32 pb-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Privacy Policy
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400">
          Last updated: January 20, 2026
        </p>
      </div>

      {/* Content Card */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl p-8 md:p-12 space-y-8">
        <IntroductionSection />
        <DataCollectionSection />
        <DataUsageSection />
        <DataSharingSection />
        <SecurityAndRetentionSection />
        <RightsAndCookiesSection />
        <LegalSection />
      </div>
    </div>
  );
}
