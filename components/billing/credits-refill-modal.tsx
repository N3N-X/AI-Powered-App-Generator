"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Zap, Sparkles, Rocket } from "lucide-react";
import { TOKEN_PACKAGES, TokenPackageType } from "@/lib/billing";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import type { Plan } from "@/types";

const PACKAGE_ICONS = {
  SMALL: Coins,
  MEDIUM: Zap,
  LARGE: Sparkles,
  MEGA: Rocket,
};

interface CreditsRefillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: Plan | null;
}

export function CreditsRefillModal({
  open,
  onOpenChange,
  plan,
}: CreditsRefillModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<TokenPackageType | null>(null);
  const isFree = (plan ?? "FREE") === "FREE";

  const handlePurchase = async (packageType: TokenPackageType) => {
    setLoading(packageType);
    try {
      const response = await fetch("/api/billing/tokens/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: packageType }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error(data.error || "Failed to start checkout");
    } catch (error) {
      toast({
        title: "Refill failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Refill credits</DialogTitle>
          <DialogDescription>
            Credits never expire and can be used across all features.
          </DialogDescription>
        </DialogHeader>

        {isFree && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-4 text-sm text-amber-200 flex flex-col gap-3">
            <p>
              Credit refills are available on Pro and Elite plans. Upgrade to
              keep generating without interruptions.
            </p>
            <Button
              variant="gradient"
              onClick={() => router.push("/dashboard/settings?tab=billing")}
            >
              Upgrade plan
            </Button>
          </div>
        )}

        {!isFree && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(TOKEN_PACKAGES) as TokenPackageType[]).map(
              (packageType) => {
                const pkg = TOKEN_PACKAGES[packageType];
                const Icon = PACKAGE_ICONS[packageType];
                const creditsPerDollar = pkg.credits / pkg.price;
                const bonusPercent = ((creditsPerDollar - 2000) / 2000) * 100;

                return (
                  <Card
                    key={packageType}
                    className={`relative rounded-2xl transition-all ${
                      pkg.popular
                        ? "border-violet-500 dark:border-violet-400 shadow-lg shadow-violet-500/20"
                        : ""
                    }`}
                  >
                    {pkg.popular && (
                      <Badge
                        variant="premium"
                        className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs"
                      >
                        Best Value
                      </Badge>
                    )}

                    <CardContent className="p-5 text-center space-y-3">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
                        <Icon className="h-6 w-6 text-white" />
                      </div>

                      <div>
                        <div className="text-lg font-semibold text-white">
                          {pkg.name}
                        </div>
                        <div className="text-sm text-slate-400">
                          ${pkg.price}
                        </div>
                      </div>

                      <div className="text-2xl font-bold text-violet-300">
                        {pkg.credits.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">credits</div>

                      {bonusPercent > 0 && (
                        <Badge variant="success" className="text-xs">
                          +{bonusPercent.toFixed(0)}% bonus
                        </Badge>
                      )}

                      <Button
                        onClick={() => handlePurchase(packageType)}
                        disabled={loading === packageType}
                        variant={pkg.popular ? "gradient" : "outline"}
                        className="w-full"
                      >
                        {loading === packageType ? "Loading..." : "Purchase"}
                      </Button>

                      <div className="text-[10px] text-slate-500">
                        {(creditsPerDollar / 1000).toFixed(1)}k credits per $1
                      </div>
                    </CardContent>
                  </Card>
                );
              },
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
