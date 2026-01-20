"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Code2,
  Smartphone,
  Github,
  Cloud,
  Shield,
  Zap,
  RefreshCw,
  Eye,
  Globe,
  Database,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Generation",
    description:
      "Chat with AI to build your app. Describe features in plain English and watch them come to life instantly.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Globe,
    title: "Multi-Platform Support",
    description:
      "Create web apps with live subdomains, or build native iOS and Android apps with React Native—all from one platform.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Eye,
    title: "Instant Live Preview",
    description:
      "See changes in real-time as you build. Web apps get instant subdomains, mobile apps preview in Expo Go.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Code2,
    title: "Full Code Access",
    description:
      "View and edit all generated code. Built-in file explorer, code editor, and direct file management for complete control.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Database,
    title: "Managed API Proxies",
    description:
      "Access 40+ APIs without your own keys. AI models, search, maps, images, email, SMS, and more—all managed for you.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: RefreshCw,
    title: "Iterative Development",
    description:
      "Refine and improve through conversation. Add features, fix bugs, or redesign—just describe what you want changed.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Github,
    title: "GitHub Integration",
    description:
      "Push your code directly to GitHub repos. Version control and collaboration built-in for professional workflows.",
    color: "from-slate-400 to-slate-600",
  },
  {
    icon: Cloud,
    title: "Professional Builds",
    description:
      "Build production-ready APKs and IPAs with EAS Build. Deploy to app stores with enterprise-grade infrastructure.",
    color: "from-indigo-500 to-violet-500",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function LandingFeatures() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
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
            Complete Platform for AI App Development
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            From idea to production. Generate code with AI, preview instantly,
            access managed APIs, and deploy to web or app stores—everything you
            need in one powerful platform.
          </motion.p>
        </div>

        {/* Features grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              className="group relative"
            >
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl p-6 h-full hover:bg-white/80 dark:hover:bg-white/[0.08] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/10">
                {/* Icon */}
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg mb-4`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
