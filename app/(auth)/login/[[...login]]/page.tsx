import { SignIn } from "@clerk/nextjs";
import { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In - RUX",
  description: "Sign in to your RUX account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-violet-500/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[128px]" />
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold text-white">RUX</span>
      </Link>

      {/* Clerk SignIn */}
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl",
          },
        }}
        redirectUrl="/dashboard"
        signUpUrl="/signup"
      />

      {/* Footer */}
      <p className="mt-8 text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-violet-400 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
