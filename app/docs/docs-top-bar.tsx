"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Book, ArrowLeft, LayoutDashboard } from "lucide-react";
import { AuthModal } from "@/components/auth/auth-modal";

export function DocsTopBar() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <>
      <div className="border-b border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-black/30 backdrop-blur-xl p-4 shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            {!loading && !user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Home</span>
              </Button>
            )}
            {!loading && user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Book className="h-5 w-5 text-violet-500" />
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Documentation
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!loading && user && (
              <Badge variant="secondary" className="hidden md:flex">
                Welcome,{" "}
                {user.user_metadata?.display_name ||
                  user.user_metadata?.full_name ||
                  user.email?.split("@")[0]}
              </Badge>
            )}
            {!loading && !user && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAuth("signin")}
                  className="hidden sm:flex"
                >
                  Sign In
                </Button>
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => openAuth("signup")}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultMode={authMode}
      />
    </>
  );
}
