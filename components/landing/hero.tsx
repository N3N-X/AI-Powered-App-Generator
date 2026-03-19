"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Smartphone, Zap, ArrowUp, Bot, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AuthModal } from "@/components/auth/auth-modal";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [initialInviteCode, setInitialInviteCode] = useState<string>();
  const [input, setInput] = useState("");
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [agentTyping, setAgentTyping] = useState(false);
  const [agentReady, setAgentReady] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check for invite code in URL and auto-open signup
  useEffect(() => {
    const inviteCode = searchParams.get("invite");
    if (inviteCode && !user && !authLoading) {
      setInitialInviteCode(inviteCode.toUpperCase());
      setAuthMode("signup");
      setAuthModalOpen(true);
    }
  }, [searchParams, user, authLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSubmit = () => {
    const prompt = input.trim();
    if (!prompt) return;

    if (!authLoading && user) {
      router.push(`/dashboard?prompt=${encodeURIComponent(prompt)}`);
      return;
    }

    setPendingPrompt(prompt);
    setInput("");
    setAgentTyping(true);
    setAgentReady(false);
    try {
      sessionStorage.setItem("rux_pending_prompt", prompt);
    } catch {
      // sessionStorage unavailable
    }

    // Simulate agent "thinking" then "typing" before showing response
    setTimeout(() => {
      setAgentTyping(false);
      setAgentReady(true);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const suggestions = [
    "A recipe book with favorites and categories",
    "Fitness tracker with progress charts",
    "Task manager with due dates and tags",
    "Weather app with 5-day forecast",
  ];

  return (
    <section className="relative h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="mx-auto max-w-7xl w-full">
        <div className="flex flex-col items-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="premium"
              className="mb-6 px-5 py-2 rounded-full liquid-glow liquid-shimmer"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Powered by Rulxy Agent
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-center"
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
            className="mt-4 sm:mt-6 text-base sm:text-xl text-gray-600 dark:text-slate-400 max-w-2xl text-center px-2"
          >
            Describe what you want to build. Get a fully functional app.
          </motion.p>

          {/* Chat Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 sm:mt-10 w-full max-w-2xl"
          >
            <div className="relative">
              {/* Glow effect behind the card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-purple-600/20 rounded-3xl blur-xl opacity-70" />

              <div className="relative rounded-2xl border border-black/[0.08] dark:border-white/[0.12] bg-white/80 dark:bg-background/75 backdrop-blur-3xl shadow-2xl shadow-violet-500/10 overflow-hidden ring-1 ring-black/[0.03] dark:ring-white/[0.05] ring-inset">
                {/* Simulated response — shown after unauthenticated submit */}
                <AnimatePresence>
                  {pendingPrompt && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 pt-5 space-y-4"
                    >
                      {/* User message */}
                      <div className="flex justify-end">
                        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-violet-500/15 border border-violet-500/20 px-4 py-2.5">
                          <p className="text-sm text-gray-900 dark:text-white text-left">
                            {pendingPrompt}
                          </p>
                        </div>
                      </div>

                      {/* Agent response */}
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shrink-0 shadow-lg shadow-violet-500/30 relative">
                          <Bot className="h-4 w-4 text-white" />
                          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-background animate-pulse" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <span className="text-[10px] font-semibold text-violet-400 tracking-wide uppercase">
                            Rulxy Agent
                          </span>

                          {agentTyping && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
                              <span>Analyzing your request...</span>
                            </div>
                          )}

                          {agentReady && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-3"
                            >
                              <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                                I can build that for you. I&apos;ll set up the
                                screens, connect the backend, and generate
                                production-ready code. Create a free account so
                                I can start working on your app.
                              </p>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="gradient"
                                  onClick={() => openAuth("signup")}
                                  className="text-xs h-8 px-4"
                                >
                                  Create Free Account
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openAuth("signin")}
                                  className="text-xs h-8 px-3 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                                >
                                  Sign In
                                </Button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input area */}
                <div className="p-4">
                  <div className="flex items-end gap-3">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Describe the app you want to build..."
                      rows={1}
                      className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 text-base resize-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 border-none min-h-[44px] max-h-[120px] py-2.5 leading-relaxed"
                    />
                    <Button
                      onClick={handleSubmit}
                      disabled={!input.trim()}
                      size="icon"
                      variant="gradient"
                      className="h-10 w-10 rounded-xl shrink-0 transition-all hover:shadow-lg hover:shadow-violet-500/30 hover:scale-105 disabled:hover:scale-100 disabled:hover:shadow-none"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Suggestion chips — hidden after submit */}
                {!pendingPrompt && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((s, i) => (
                        <Button
                          key={s}
                          variant="outline"
                          size="sm"
                          onClick={() => setInput(s)}
                          className={`text-xs px-3 py-1.5 rounded-full border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20 ${i >= 2 ? "hidden sm:inline-flex" : ""}`}
                        >
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-6 sm:mt-10 flex flex-wrap items-center justify-center gap-x-5 sm:gap-x-8 gap-y-3 text-xs sm:text-sm text-gray-500 dark:text-slate-500"
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
      </div>

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultMode={authMode}
        initialInviteCode={initialInviteCode}
      />
    </section>
  );
}
