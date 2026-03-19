import { Metadata } from "next";
import { LandingHero } from "@/components/landing/hero";

export const metadata: Metadata = {
  title: {
    absolute:
      "Rulxy - AI-Powered App Builder | Create Mobile & Web Apps Instantly",
  },
  description:
    "Build production-ready iOS, Android, and web apps with AI. Describe your idea in natural language and Rulxy generates fully functional code. Deploy in minutes, not months.",
  alternates: { canonical: "https://rulxy.com" },
  keywords: [
    "AI app builder",
    "build app with AI",
    "mobile app generator",
    "React Native AI",
    "Expo app builder",
    "no-code app builder",
    "AI code generator",
    "web app builder",
    "iOS app generator",
    "Android app generator",
    "AI development platform",
    "natural language to app",
    "instant app deployment",
  ],
  other: {
    "script:ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Rulxy",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web, iOS, Android",
      description:
        "AI-powered platform that generates production-ready mobile and web apps from natural language descriptions.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    }),
  },
};

export default function HomePage() {
  return (
    <div data-hide-footer>
      <LandingHero />
    </div>
  );
}
