"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserStore } from "@/stores/user-store";
import { toast } from "@/hooks/use-toast";
import { User, Loader2, Save } from "lucide-react";

export function ProfileCard() {
  const { user: authUser, updateUserProfile, updateEmail } = useAuth();
  const { user, updateUser } = useUserStore();

  const [name, setName] = useState(user?.name || "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [email, setEmail] = useState(authUser?.email || "");
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  useEffect(() => {
    if (user?.name && !name) setName(user.name);
  }, [user?.name]);

  useEffect(() => {
    if (authUser?.email && !email) setEmail(authUser.email);
  }, [authUser?.email]);

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Please enter your name", variant: "destructive" });
      return;
    }
    setIsSavingName(true);
    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!response.ok) throw new Error("Failed to update name");
      updateUser({ name: name.trim() });
      await updateUserProfile(name.trim());
      toast({ title: "Name updated", description: "Your display name has been saved" });
    } catch (error) {
      toast({ title: "Update failed", description: error instanceof Error ? error.message : "Please try again", variant: "destructive" });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!email.trim() || email === authUser?.email) return;
    setIsSavingEmail(true);
    try {
      await updateEmail(email.trim());
      toast({ title: "Confirmation email sent", description: "Check both your current and new email for confirmation links" });
    } catch (error) {
      toast({ title: "Email update failed", description: error instanceof Error ? error.message : "Please try again", variant: "destructive" });
    } finally {
      setIsSavingEmail(false);
    }
  };

  return (
    <Card className="liquid-glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <User className="h-5 w-5" />
          Profile
        </CardTitle>
        <CardDescription className="text-slate-400">
          Your personal information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {authUser?.user_metadata?.avatar_url ? (
              <img
                src={authUser.user_metadata.avatar_url}
                alt="Profile"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              user?.name?.[0] ||
              authUser?.user_metadata?.display_name?.[0] ||
              authUser?.email?.[0]?.toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              {user?.name ||
                authUser?.user_metadata?.display_name ||
                authUser?.user_metadata?.full_name ||
                "User"}
            </h3>
            <p className="text-sm text-slate-400">{authUser?.email}</p>
            <Badge
              variant={
                user?.plan === "ELITE" ? "premium" : user?.plan === "PRO" ? "success" : "secondary"
              }
              className="mt-2"
            >
              {user?.plan || "FREE"} Plan
            </Badge>
          </div>
        </div>

        <Separator className="bg-white/10" />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <div className="flex gap-2">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" className="bg-white/5" />
              <Button onClick={handleSaveName} disabled={isSavingName || name === user?.name} variant="outline">
                {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex gap-2">
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-white/5" />
              <Button onClick={handleSaveEmail} disabled={isSavingEmail || email === authUser?.email || !email.trim()} variant="outline">
                {isSavingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-slate-500">A confirmation link will be sent to both your current and new email</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
