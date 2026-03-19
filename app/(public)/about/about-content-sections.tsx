import Link from "next/link";
import { Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function HowItWorksSection() {
  const steps = [
    {
      step: "1",
      title: "Describe Your Idea",
      description:
        "Start by describing your application in natural language. Tell Rulxy what you want to build, what features you need, and who your target users are.",
    },
    {
      step: "2",
      title: "AI-Powered Generation",
      description:
        "Our advanced AI analyzes your requirements and generates a complete project structure with clean, maintainable code following industry best practices.",
    },
    {
      step: "3",
      title: "Iterate and Refine",
      description:
        "Review the generated code in real-time, make changes through conversation, and see instant previews. Iterate until your application is exactly what you envisioned.",
    },
    {
      step: "4",
      title: "Deploy with Confidence",
      description:
        "Deploy web apps instantly with live subdomains, or build native iOS and Android apps with EAS cloud builds. All code is production-ready and deployment-configured.",
    },
  ];

  return (
    <Card className="rounded-3xl mb-8">
      <CardContent className="p-8 md:p-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          How Rulxy Works
        </h2>
        <div className="space-y-6">
          {steps.map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold flex-shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TechStackSection() {
  const items = [
    "Advanced AI Code Generation",
    "Real-Time Preview & Testing",
    "Context-Aware Development",
    "Automatic Error Detection & Fixes",
    "Production-Ready Output",
    "Web, iOS & Android Support",
  ];

  return (
    <Card className="rounded-3xl mb-8">
      <CardContent className="p-8 md:p-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Powered by Rulxy Agent
        </h2>
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
            Rulxy uses cutting-edge AI to understand your requirements and
            generate high-quality, production-ready code:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 p-4 bg-white/40 dark:bg-white/[0.02] rounded-xl border border-gray-200/30 dark:border-white/5"
              >
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-gray-600 dark:text-slate-400">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StoryAndTeamSection() {
  return (
    <>
      <Card className="rounded-3xl mb-8">
        <CardContent className="p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Our Story
          </h2>
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              Rulxy was founded in 2026 with a simple belief: building an app
              shouldn't require years of coding experience. We saw too many
              great ideas never get built because the technical barriers were
              too high.
            </p>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              We envisioned a world where anyone with an idea could bring it to
              life without spending months learning programming languages and
              frameworks. So we built Rulxy — a platform that makes app
              development accessible, efficient, and even enjoyable.
            </p>
            <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
              Today, Rulxy helps entrepreneurs, creators, and businesses turn
              their ideas into real apps. We&apos;re just getting started, and
              we&apos;re excited to keep pushing what&apos;s possible with
              AI-powered app creation.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl mb-8">
        <CardContent className="p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Built for Builders
          </h2>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed text-center max-w-3xl mx-auto">
            Our team combines experience in software engineering, artificial
            intelligence, and product design. We&apos;re passionate about
            removing barriers and making app creation accessible to everyone
            with an idea worth building.
          </p>
        </CardContent>
      </Card>
    </>
  );
}

export function JoinUsCta() {
  return (
    <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-center">
      <Rocket className="h-16 w-16 text-white mx-auto mb-6" />
      <h2 className="text-3xl font-bold text-white mb-4">
        Join the Future of Development
      </h2>
      <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
        Be part of a growing community of developers and creators building the
        next generation of applications with AI.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          asChild
          size="lg"
          className="bg-white text-violet-600 hover:bg-gray-100 font-semibold"
        >
          <Link href="/">Get Started Free</Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="bg-white/10 text-white border-white/20 hover:bg-white/20 font-semibold"
        >
          <Link href="/contact">Contact Us</Link>
        </Button>
      </div>
    </div>
  );
}
