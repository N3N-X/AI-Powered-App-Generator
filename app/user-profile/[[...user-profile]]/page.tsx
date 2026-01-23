"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Mail, KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function UserProfilePage() {
  const router = useRouter();
  const { user, loading, updateUserProfile, logout } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const name =
      user?.user_metadata?.display_name || user?.user_metadata?.full_name || "";
    if (name) {
      setDisplayName(name);
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateUserProfile(displayName);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f] p-4">
      <Card className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10">
        <CardHeader>
          <CardTitle className="text-2xl text-white">User Profile</CardTitle>
          <CardDescription className="text-slate-400">
            Manage your account settings and profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Profile"
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                user.user_metadata?.display_name?.[0] ||
                user.user_metadata?.full_name?.[0] ||
                user.email?.[0]?.toUpperCase()
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {user.user_metadata?.display_name ||
                  user.user_metadata?.full_name ||
                  "User"}
              </h3>
              <p className="text-sm text-slate-400">{user.email}</p>
            </div>
          </div>

          {/* Update Display Name Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-white">
                Display Name
              </Label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={
                isSaving ||
                displayName ===
                  (user.user_metadata?.display_name ||
                    user.user_metadata?.full_name ||
                    "")
              }
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </form>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              Email Address
            </Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-slate-400" />
              <Input
                id="email"
                value={user.email || ""}
                disabled
                className="bg-white/5 border-white/10 text-slate-400"
              />
            </div>
            <p className="text-xs text-slate-500">
              Email cannot be changed at this time
            </p>
          </div>

          {/* Account Actions */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/dashboard/settings")}
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Account Settings
            </Button>
            <Button
              variant="outline"
              className="w-full text-red-400 hover:text-red-300 border-red-400/30 hover:border-red-400/50"
              onClick={async () => {
                await logout();
                router.push("/");
              }}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
