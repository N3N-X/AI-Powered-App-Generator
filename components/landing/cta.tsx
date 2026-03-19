"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, Globe, Star } from "lucide-react";
import { AuthModal } from "@/components/auth/auth-modal";

const testimonials = [
  {
    name: "Alex R.",
    role: "Indie Developer",
    text: "Shipped my first app in under an hour. Unreal.",
  },
  {
    name: "Sarah K.",
    role: "Startup Founder",
    text: "Rulxy replaced our entire prototyping workflow.",
  },
  {
    name: "Mike T.",
    role: "Full-Stack Dev",
    text: "The AI understands exactly what I need. Every time.",
  },
  {
    name: "Priya D.",
    role: "Product Manager",
    text: "From idea to App Store in a single afternoon.",
  },
  {
    name: "James L.",
    role: "Freelancer",
    text: "I build client apps 10x faster now. Game changer.",
  },
  {
    name: "Nina W.",
    role: "Design Lead",
    text: "Beautiful code output. Production-ready from day one.",
  },
];

const trustBadges = [
  { icon: Shield, label: "AES-256 Encrypted" },
  { icon: Zap, label: "99.9% Uptime" },
  { icon: Globe, label: "Web, iOS & Android" },
];

function MarqueeRow({
  items,
  direction = "left",
}: {
  items: typeof testimonials;
  direction?: "left" | "right";
}) {
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden">
      <div
        className={`flex gap-3 sm:gap-4 ${direction === "left" ? "animate-marquee" : "animate-marquee-reverse"}`}
        style={{ width: "max-content" }}
      >
        {doubled.map((t, i) => (
          <div
            key={`${t.name}-${i}`}
            className="flex-shrink-0 w-60 sm:w-72 rounded-2xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl border border-gray-200/60 dark:border-white/[0.08] p-4 sm:p-5 shadow-sm"
          >
            <div className="flex items-center gap-1 mb-2 sm:mb-3">
              {[...Array(5)].map((_, j) => (
                <Star
                  key={j}
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400"
                />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 mb-2 sm:mb-3 leading-relaxed">
              &ldquo;{t.text}&rdquo;
            </p>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                {t.name}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-500">
                {t.role}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LandingCTA() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <section className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-violet-600/15 rounded-full blur-[128px] animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-600/15 rounded-full blur-[128px] animate-float"
          style={{ animationDelay: "-3s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-purple-600/10 rounded-full blur-[160px]" />
      </div>

      <div className="mx-auto max-w-6xl w-full flex flex-col items-center justify-center flex-1 gap-8 sm:gap-12">
        {/* Testimonial marquee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full space-y-3 sm:space-y-4"
        >
          <MarqueeRow items={testimonials.slice(0, 3)} direction="left" />
          <MarqueeRow items={testimonials.slice(3)} direction="right" />
        </motion.div>

        {/* CTA content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-5">
            Ready to{" "}
            <span className="gradient-text">build something amazing</span>?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 dark:text-slate-400 max-w-xl mx-auto mb-8 sm:mb-10">
            Join thousands of developers turning ideas into production apps.
            Start free, no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-12">
            <Button
              size="xl"
              variant="gradient"
              className="group relative w-full sm:w-auto"
              onClick={() => setAuthModalOpen(true)}
            >
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
              <span className="relative flex items-center justify-center">
                Start Building Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
            <Button
              size="xl"
              variant="glass"
              asChild
              className="w-full sm:w-auto"
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            {trustBadges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-slate-500"
              >
                <badge.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-500 dark:text-violet-400" />
                <span>{badge.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultMode="signup"
      />
    </section>
  );
}
