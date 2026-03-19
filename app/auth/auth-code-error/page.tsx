"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { RuxLogo } from "@/components/shared/rux-logo";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Liquid Glass Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-radial from-blue-400/15 via-blue-300/8 to-transparent rounded-full blur-[140px] animate-pulse" />
        <div
          className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-gradient-radial from-purple-400/12 via-purple-300/6 to-transparent rounded-full blur-[160px] animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-radial from-cyan-300/5 via-transparent to-transparent rounded-full blur-[100px]" />
      </div>

      {/* Back to Home */}
      <div className="absolute top-6 left-6 z-10">
        <Link href="/">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Button>
        </Link>
      </div>

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <RuxLogo className="h-16 w-16" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Authentication error
            </h1>
            <p className="text-muted-foreground">
              Something went wrong during authentication
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
            <div className="space-y-6 text-center">
              <p className="text-sm text-slate-400">
                The authentication link may have expired or is invalid. This can
                happen if:
              </p>
              <ul className="text-sm text-slate-400 space-y-2 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-slate-500 mt-0.5">-</span>
                  The verification link has expired
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-500 mt-0.5">-</span>
                  The link was already used
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-500 mt-0.5">-</span>
                  The link was modified or incomplete
                </li>
              </ul>

              <div className="space-y-3 pt-2">
                <Link href="/" className="block">
                  <Button variant="gradient" className="w-full">
                    Go to home
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
