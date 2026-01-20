"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function LandingCTA() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="relative"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-indigo-600/20 rounded-3xl blur-3xl" />

          {/* Card */}
          <div className="relative bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl p-8 sm:p-12 text-center overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />

            {/* Content */}
            <div className="relative">
              <motion.div
                variants={item}
                className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 dark:shadow-violet-500/40 mb-6"
              >
                <Sparkles className="h-8 w-8 text-white" />
              </motion.div>

              <motion.h2
                variants={item}
                className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4"
              >
                Ready to Build Your App?
              </motion.h2>
              <motion.p
                variants={item}
                className="text-lg text-gray-600 dark:text-slate-400 max-w-xl mx-auto mb-8"
              >
                Join thousands of developers using RUX to turn their ideas into
                reality. Start for free, no credit card required.
              </motion.p>

              <motion.div
                variants={item}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Button size="xl" variant="gradient" asChild className="group">
                  <Link href="/sign-up">
                    Start Building Now
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="xl" variant="glass" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div
                variants={item}
                className="mt-12 grid grid-cols-3 gap-8"
              >
                {[
                  { value: "10K+", label: "Apps Generated" },
                  { value: "5K+", label: "Happy Developers" },
                  { value: "99.9%", label: "Uptime" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="text-2xl sm:text-3xl font-bold gradient-text">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
