"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
    } else {
      alert("Account created! Please log in.");
      router.push("/auth/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black flex items-center justify-center p-4">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl max-w-md w-full p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Sign Up</h1>
        <form onSubmit={handleSignup}>
          <div className="mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-white/20 rounded-lg p-3 text-white placeholder-gray-400"
              placeholder="Email"
              required
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-white/20 rounded-lg p-3 text-white placeholder-gray-400"
              placeholder="Password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Sign Up
          </button>
        </form>
        <p className="text-center mt-4 text-gray-400">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-cyan-400 hover:text-cyan-300"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
