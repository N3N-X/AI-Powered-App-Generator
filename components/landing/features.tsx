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
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Natural Language Input",
    description:
      "Describe your app in plain English. Our AI understands your vision and translates it into working code.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Code2,
    title: "Production-Ready Code",
    description:
      "Generate clean, type-safe TypeScript code with React Native best practices built-in.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Eye,
    title: "Live Preview",
    description:
      "See your app come to life in real-time. Preview on iOS and Android simulators instantly.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: RefreshCw,
    title: "Iterative Refinement",
    description:
      "Refine and improve your app through conversation. Just describe what you want to change.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Github,
    title: "GitHub Integration",
    description:
      "Push your generated code directly to GitHub. Create repos and manage versions seamlessly.",
    color: "from-slate-400 to-slate-600",
  },
  {
    icon: Cloud,
    title: "Cloud Builds",
    description:
      "Build production APKs and IPAs with EAS. Deploy to app stores with one click.",
    color: "from-indigo-500 to-violet-500",
  },
  {
    icon: Zap,
    title: "Powered by Top AI",
    description:
      "Leverage Claude and Grok for intelligent code generation. Choose your preferred AI model.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    description:
      "End-to-end encryption for your credentials. Your API keys and dev accounts are always protected.",
    color: "from-red-500 to-orange-500",
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
            className="text-3xl sm:text-4xl font-bold text-white"
          >
            Everything You Need to Build Apps
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto"
          >
            From idea to app store, RUX provides all the tools you need to bring
            your mobile app vision to life.
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
              <div className="glass rounded-2xl p-6 h-full hover:bg-white/[0.08] transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/5">
                {/* Icon */}
                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg mb-4`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
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
