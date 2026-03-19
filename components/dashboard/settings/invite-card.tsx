"use client";

import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Copy, Check, Users, Gift, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface InviteStats {
  code: string;
  totalInvites: number;
  creditsEarned: number;
  shareUrl: string;
}

export function InviteCard() {
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/invite/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch invite stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast({
        title: "Copied!",
        description:
          type === "code" ? "Invite code copied" : "Share link copied",
      });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const shareOnTwitter = () => {
    if (!stats) return;
    const text = `Join me on Rulxy and get 500 bonus credits! Use my invite code: ${stats.code}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(stats.shareUrl)}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-violet-500" />
            Invite Friends
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-violet-500" />
          Invite Friends
        </CardTitle>
        <CardDescription>
          Share Rulxy and earn 500 credits for each friend who joins
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Your Invite Code</Label>
          <div className="flex gap-2">
            <Input
              value={stats.code}
              readOnly
              className="bg-white/5 font-mono text-lg tracking-wider"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(stats.code, "code")}
            >
              {copied === "code" ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Share Link</Label>
          <div className="flex gap-2">
            <Input
              value={stats.shareUrl}
              readOnly
              className="bg-white/5 text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(stats.shareUrl, "link")}
            >
              {copied === "link" ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Separator className="bg-white/10" />

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Invited</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalInvites}</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Gift className="h-4 w-4" />
              <span className="text-sm">Earned</span>
            </div>
            <p className="text-2xl font-bold">{stats.creditsEarned}</p>
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={shareOnTwitter}>
          <Share2 className="h-4 w-4 mr-2" />
          Share on Twitter
        </Button>
      </CardContent>
    </Card>
  );
}
