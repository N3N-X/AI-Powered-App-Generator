"use client";

import { Wrench, Clock, AlertCircle, LogIn } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative h-24 w-24 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center">
              <Wrench className="h-12 w-12 text-violet-400" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Under Maintenance
        </h1>

        {/* Description */}
        <p className="text-lg text-slate-400 mb-8 max-w-lg mx-auto">
          We&apos;re currently performing scheduled maintenance to improve your
          experience. We&apos;ll be back shortly.
        </p>

        {/* Status Cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8 max-w-xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <Clock className="h-8 w-8 text-violet-400 mb-3 mx-auto" />
            <h3 className="text-white font-semibold mb-2">Expected Duration</h3>
            <p className="text-sm text-slate-400">1-2 hours</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <AlertCircle className="h-8 w-8 text-violet-400 mb-3 mx-auto" />
            <h3 className="text-white font-semibold mb-2">Status Updates</h3>
            <p className="text-sm text-slate-400">Check our status page</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <SignedOut>
            <Button variant="gradient" asChild>
              <Link href="/login">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          </SignedOut>
          <SignedIn>
            <Button
              variant="gradient"
              onClick={() => (window.location.href = "/dashboard")}
            >
              Go to Dashboard
            </Button>
          </SignedIn>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
          <SignedOut>
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </SignedOut>
        </div>

        {/* Footer */}
        <p className="text-sm text-slate-500 mt-12">
          Need urgent support? Contact us at{" "}
          <a
            href="mailto:support@rux.sh"
            className="text-violet-400 hover:text-violet-300 transition-colors"
          >
            support@rux.sh
          </a>
        </p>
      </div>
    </div>
  );
}
