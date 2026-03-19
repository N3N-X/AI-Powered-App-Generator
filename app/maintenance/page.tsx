import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Wrench, Mail, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scheduled Maintenance - We'll Be Right Back",
  description:
    "Rulxy is currently undergoing scheduled maintenance to improve our AI app builder. We'll be back shortly.",
  robots: { index: false, follow: false },
};

export default async function MaintenancePage() {
  // If maintenance mode is off, redirect to home
  if (process.env.MAINTENANCE_MODE !== "true") {
    redirect("/");
  }

  // If user is an admin, redirect to dashboard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email) {
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase());
    if (adminEmails.includes(user.email.toLowerCase())) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-gray-50 dark:bg-[#0a0a12]">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[160px] animate-float" />
        <div
          className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[140px] animate-float"
          style={{ animationDelay: "-4s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[180px]" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative w-full max-w-lg mx-auto text-center">
        {/* Floating icon */}
        <div className="mb-10 inline-flex items-center justify-center">
          <div className="relative">
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 blur-2xl opacity-30 animate-pulse" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-violet-500/30 animate-float">
              <Wrench className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          We&apos;ll be <span className="gradient-text">right back</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-slate-400 mb-3 leading-relaxed max-w-md mx-auto">
          We&apos;re performing scheduled maintenance to make Rulxy even better
          for you.
        </p>
        <p className="text-sm text-gray-500 dark:text-slate-500 mb-10">
          This usually takes just a few minutes. Thanks for your patience.
        </p>

        {/* Glass card with status */}
        <Card className="rounded-2xl mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                Maintenance in progress
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <a
          href="mailto:support@rulxy.com"
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors group"
        >
          <Mail className="w-4 h-4" />
          <span>Need help? Contact support@rulxy.com</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>
    </div>
  );
}
