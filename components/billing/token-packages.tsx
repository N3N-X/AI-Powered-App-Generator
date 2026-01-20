"use client";

import { useState } from "react";
import { Coins, Zap, Sparkles, Rocket } from "lucide-react";
import { TOKEN_PACKAGES, TokenPackageType } from "@/lib/billing";

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
          Purchase additional credits anytime, regardless of your plan. Credits
          never expire and can be used for any operation.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(Object.keys(TOKEN_PACKAGES) as TokenPackageType[]).map(
          (packageType) => {
            const pkg = TOKEN_PACKAGES[packageType];
            const Icon = PACKAGE_ICONS[packageType];
            const creditsPerDollar = pkg.credits / pkg.price;
            const bonusPercent =
              ((creditsPerDollar - 2000) / 2000) * 100; // 2000 is base rate

            return (
              <div
                key={packageType}
                className={`relative bg-white/60 dark:bg-white/5 backdrop-blur-xl border rounded-2xl p-6 transition-all hover:scale-105 ${
                  pkg.popular
                    ? "border-violet-500 dark:border-violet-400 shadow-lg shadow-violet-500/20"
                    : "border-gray-200/50 dark:border-white/10"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold rounded-full">
                    Best Value
                  </div>
                )}

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
                      <div className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                        +{bonusPercent.toFixed(0)}% bonus
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handlePurchase(packageType)}
                    disabled={loading === packageType}
                    className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                      pkg.popular
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
                        : "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading === packageType ? "Loading..." : "Purchase"}
                  </button>

                  <div className="text-xs text-gray-500 dark:text-slate-500">
                    {(creditsPerDollar / 1000).toFixed(1)}k credits per $1
                  </div>
                </div>
              </div>
            );
          },
        )}
      </div>

      <div className="text-center text-sm text-gray-600 dark:text-slate-400 space-y-1">
        <p>
          Credits are added instantly and never expire. Use them across all
          features.
        </p>
        <p>One-time purchases work independently from your subscription plan.</p>
      </div>
    </div>
  );
}
