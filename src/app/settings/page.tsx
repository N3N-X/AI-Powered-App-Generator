"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Settings() {
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
      } else {
        router.push("/auth/login");
      }
    };
    getUser();
  }, []);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      setMessage("Email update initiated. Please check your email for confirmation.");
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("New passwords don't match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <nav className="backdrop-blur-xl bg-black/20 border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              ← Back to Dashboard
            </Link>
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
              Settings
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Profile Settings */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-cyan-300">Profile Settings</h2>

          {/* Email Update */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-200">Update Email</h3>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/60 border border-white/20 rounded-xl p-4 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all duration-300"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update Email"}
              </button>
            </form>
          </div>

          {/* Password Update */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-200">Change Password</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-800/60 border border-white/20 rounded-xl p-4 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all duration-300"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-800/60 border border-white/20 rounded-xl p-4 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 transition-all duration-300"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Change Password"}
              </button>
            </form>
          </div>
        </div>

        {/* Account Information */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-green-300">Account Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-gray-300">Account Status</span>
              <span className="text-green-400 font-medium">Active</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-gray-300">Member Since</span>
              <span className="text-gray-400">January 2026</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-300">Apps Created</span>
              <span className="text-cyan-400 font-medium">0</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="backdrop-blur-xl bg-red-500/5 border border-red-500/20 rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-red-300">Danger Zone</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-200">Delete Account</h3>
                <p className="text-gray-400 text-sm">Permanently delete your account and all associated data</p>
              </div>
              <button
                onClick={() => alert("Account deletion is not implemented yet. Please contact support.")}
                className="px-6 py-3 bg-red-600/20 border border-red-500/30 text-red-300 rounded-xl hover:bg-red-600/30 transition-all duration-200"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-xl border ${message.includes("success") || message.includes("initiated")
              ? "bg-green-500/10 border-green-500/20 text-green-300"
              : "bg-red-500/10 border-red-500/20 text-red-300"
            }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}