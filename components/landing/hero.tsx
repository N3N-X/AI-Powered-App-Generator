"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Sparkles, Smartphone, Zap } from "lucide-react";
import { motion } from "framer-motion";

export function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="premium" className="mb-6 px-4 py-1.5">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Powered by Advanced AI
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight"
          >
            <span className="text-gray-900 dark:text-white">
              Build Apps with AI.
            </span>
            <br />
            <span className="gradient-text">Ship in Minutes.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            AI-powered platform to create web, iOS, and Android apps through
            natural language. Live preview, instant deployment, managed APIs,
            and professional builds—all in one place.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="xl" variant="gradient" asChild className="group">
              <Link href="/signup">
                Start Building Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="#demo">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Link>
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-gray-500 dark:text-slate-500"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>AI code generation</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-400" />
              <span>Web, iOS & Android</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <span>Live preview & deployment</span>
            </div>
          </motion.div>
        </div>

        {/* Hero Image/Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-16 relative"
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-indigo-600/20 rounded-2xl blur-3xl" />

            {/* Main preview window */}
            <div className="relative glass rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              {/* Window header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-black/20 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-lg bg-white/5 text-xs text-slate-400">
                    rux.sh/dashboard
                  </div>
                </div>
              </div>

              {/* Preview content */}
              <div className="p-6 bg-gradient-to-br from-slate-900/50 to-slate-800/50">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Sidebar preview */}
                  <div className="glass rounded-xl p-4 space-y-3">
                    <div className="h-4 w-24 bg-white/10 rounded" />
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-8 bg-white/5 rounded-lg" />
                      ))}
                    </div>
                  </div>

                  {/* Chat preview */}
                  <div className="glass rounded-xl p-4 space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-end">
                        <div className="h-12 w-48 bg-violet-500/20 rounded-xl" />
                      </div>
                      <div className="flex justify-start">
                        <div className="h-20 w-56 bg-white/5 rounded-xl" />
                      </div>
                    </div>
                    <div className="h-10 bg-white/5 rounded-xl mt-auto" />
                  </div>

                  {/* Code preview */}
                  <div className="glass rounded-xl p-4 font-mono text-xs">
                    <div className="space-y-1">
                      <div className="text-violet-400">
                        {"import React from 'react';"}
                      </div>
                      <div className="text-slate-500">
                        {"// Generated by RUX"}
                      </div>
                      <div className="text-emerald-400">
                        {"export function App() {"}
                      </div>
                      <div className="text-slate-300 pl-4">
                        {"return <View>...</View>"}
                      </div>
                      <div className="text-emerald-400">{"}"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
