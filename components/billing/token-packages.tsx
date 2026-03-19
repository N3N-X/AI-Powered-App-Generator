"use client";

import { useState } from "react";
import { Coins, Zap, Sparkles, Rocket } from "lucide-react";
import { TOKEN_PACKAGES, TokenPackageType } from "@/lib/billing";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PACKAGE_ICONS = {
  SMALL: Coins,
  MEDIUM: Zap,
  LARGE: Sparkles,
  MEGA: Rocket,
};

export function TokenPackages() {
  const [loading, setLoading] = useState<string | null>(null);

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
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error) {
      console.error("Token purchase error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to start checkout. Please try again.",
      );
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Need More Credits?
        </h2>
        <p className="text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
          Credit refills are available on Pro and Elite plans. Credits never
          expire and can be used for any operation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(Object.keys(TOKEN_PACKAGES) as TokenPackageType[]).map(
          (packageType) => {
            const pkg = TOKEN_PACKAGES[packageType];
            const Icon = PACKAGE_ICONS[packageType];
            const creditsPerDollar = pkg.credits / pkg.price;
            const bonusPercent = ((creditsPerDollar - 2000) / 2000) * 100;

            return (
              <Card
                key={packageType}
                className={`relative rounded-2xl transition-all hover:scale-105 ${
                  pkg.popular
                    ? "border-violet-500 dark:border-violet-400 shadow-lg shadow-violet-500/20"
                    : ""
                }`}
              >
                {pkg.popular && (
                  <Badge
                    variant="premium"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1"
                  >
                    Best Value
                  </Badge>
                )}

                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${
                          pkg.popular
                            ? "from-violet-500 to-purple-600"
                            : "from-gray-500 to-gray-600"
                        }`}
                      >
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {pkg.name}
                      </h3>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          ${pkg.price}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-2xl font-semibold text-violet-600 dark:text-violet-400">
                        {pkg.credits.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-slate-400">
                        credits
                      </div>
                      {bonusPercent > 0 && (
                        <Badge
                          variant="success"
                          className="rounded-full text-xs"
                        >
                          +{bonusPercent.toFixed(0)}% bonus
                        </Badge>
                      )}
                    </div>

                    <Button
                      onClick={() => handlePurchase(packageType)}
                      disabled={loading === packageType}
                      variant={pkg.popular ? "gradient" : "glass"}
                      className="w-full"
                    >
                      {loading === packageType ? "Loading..." : "Purchase"}
                    </Button>

                    <div className="text-xs text-gray-500 dark:text-slate-500">
                      {(creditsPerDollar / 1000).toFixed(1)}k credits per $1
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          },
        )}
      </div>

      <div className="text-center text-sm text-gray-600 dark:text-slate-400 space-y-1">
        <p>
          Credits are added instantly and never expire. Use them across all
          features.
        </p>
        <p>Refills are available for Pro and Elite plans.</p>
      </div>
    </div>
  );
}
