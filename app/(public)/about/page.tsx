import { Metadata } from "next";
import {
  AboutHeader,
  MissionSection,
  WhatIsRuxSection,
  CoreValuesSection,
} from "./about-sections";
import {
  HowItWorksSection,
  TechStackSection,
  StoryAndTeamSection,
  JoinUsCta,
} from "./about-content-sections";

export const metadata: Metadata = {
  title: "About Us - AI-Powered App Development Platform",
  description:
    "Learn about Rulxy, our mission to democratize app development with AI, our core values, and the team building the future of software creation.",
  alternates: { canonical: "https://rulxy.com/about" },
  other: {
    "script:ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Rulxy?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Rulxy is an AI-powered platform that generates production-ready mobile and web apps from natural language descriptions. Describe your idea and get fully functional React Native, Expo, and web code instantly.",
          },
        },
        {
          "@type": "Question",
          name: "What platforms does Rulxy support?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Rulxy supports web apps with live subdomains, and native iOS and Android apps built with React Native and Expo. You can deploy to the App Store, Google Play, or the web from one platform.",
          },
        },
        {
          "@type": "Question",
          name: "Is Rulxy free to use?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, Rulxy offers a free plan with 3,000 credits per month, up to 3 projects, live preview, and web app deployment. Paid plans unlock more credits, projects, and advanced features like cloud builds and GitHub integration.",
          },
        },
        {
          "@type": "Question",
          name: "How does AI app generation work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Simply describe the app you want to build in plain English. Rulxy's AI analyzes your description, generates production-ready code, and provides a live preview. You can iterate by chatting with the AI to add features, fix bugs, or redesign.",
          },
        },
      ],
    }),
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-32 pb-16">
      <AboutHeader />
      <MissionSection />
      <WhatIsRuxSection />
      <CoreValuesSection />
      <HowItWorksSection />
      <TechStackSection />
      <StoryAndTeamSection />
      <JoinUsCta />
    </div>
  );
}
