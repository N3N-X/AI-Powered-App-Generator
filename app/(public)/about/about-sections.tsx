import { Sparkles, Zap, Users, Globe, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function AboutHeader() {
  return (
    <div className="text-center mb-16">
      <div className="flex justify-center mb-6">
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/30">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
        About Rulxy
      </h1>
      <p className="text-xl text-gray-600 dark:text-slate-400 max-w-3xl mx-auto">
        Empowering everyone to turn ideas into real apps with the power of AI
      </p>
    </div>
  );
}

export function MissionSection() {
  return (
    <Card className="rounded-3xl mb-8">
      <CardContent className="p-8 md:p-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Our Mission
        </h2>
        <p className="text-lg text-gray-600 dark:text-slate-400 leading-relaxed text-center max-w-3xl mx-auto">
          Rulxy is on a mission to democratize app development by making it
          accessible to everyone, regardless of technical background. We believe
          great ideas shouldn't be limited by coding skills — whether you're an
          entrepreneur, creator, or developer, you should be able to bring your
          vision to life.
        </p>
      </CardContent>
    </Card>
  );
}

export function WhatIsRuxSection() {
  return (
    <Card className="rounded-3xl mb-8">
      <CardContent className="p-8 md:p-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          What is Rulxy?
        </h2>
        <div className="space-y-6">
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
            Rulxy is an AI-powered platform that transforms how mobile and web
            apps are built. Simply describe what you want to create, and Rulxy
            generates fully functional iOS, Android, and web applications
            through natural conversation.
          </p>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
            No coding experience required. Just describe your idea in plain
            English, and our AI handles the rest — from understanding your
            requirements to generating production-ready code that follows best
            practices.
          </p>
          <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
            Whether you&apos;re a startup founder validating an idea, a small
            business owner needing a custom app, a creator building for your
            audience, or a developer accelerating your workflow — Rulxy gives
            you the power to build real apps in minutes, not months.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CoreValuesSection() {
  const values = [
    {
      icon: Zap,
      title: "Innovation First",
      description:
        "We constantly push the boundaries of what's possible with AI, staying at the forefront of technology to deliver cutting-edge solutions.",
      gradient: "from-violet-500 to-purple-600",
    },
    {
      icon: Users,
      title: "User-Centric Design",
      description:
        "Every feature we build is designed with our users in mind, ensuring an intuitive and delightful experience at every touchpoint.",
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      icon: Shield,
      title: "Security & Privacy",
      description:
        "We take data security seriously, implementing industry-leading practices to protect your code, data, and intellectual property.",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      icon: Globe,
      title: "Global Accessibility",
      description:
        "We believe technology should be accessible to everyone, everywhere, breaking down barriers to entry in software development.",
      gradient: "from-orange-500 to-red-600",
    },
  ];

  return (
    <Card className="rounded-3xl mb-8">
      <CardContent className="p-8 md:p-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
          Our Core Values
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {values.map((value) => (
            <div
              key={value.title}
              className="bg-white/40 dark:bg-white/[0.02] rounded-2xl p-6 border border-gray-200/30 dark:border-white/5"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${value.gradient} flex-shrink-0`}
                >
                  <value.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-slate-400 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
