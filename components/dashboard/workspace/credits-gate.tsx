"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import type { Plan } from "@/types";

interface CreditsGateProps {
  plan?: Plan | null;
  compact?: boolean;
  className?: string;
}

export function CreditsGate({
  plan,
  compact = false,
  className,
}: CreditsGateProps) {
  const router = useRouter();
  const openModal = useUIStore((state) => state.openModal);
  const resolvedPlan: Plan = plan ?? "FREE";
  const isFree = resolvedPlan === "FREE";
  const isElite = resolvedPlan === "ELITE";
  const showUpgrade = !isElite;
  const showRefill = !isFree;

  const description = isFree
    ? "Upgrade your plan to keep generating."
    : showUpgrade
      ? "Refill credits or upgrade your plan to keep generating."
      : "Refill credits to keep generating.";

  return (
    <div
      className={cn(
        compact
          ? "mt-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] text-amber-200"
          : "mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200",
        className,
      )}
    >
      <div className={compact ? "font-semibold" : "font-semibold"}>
        You&apos;re out of credits.
      </div>
      <div className="text-amber-100/80">{description}</div>
      <div className={compact ? "mt-2 flex gap-2" : "mt-2 flex gap-2"}>
        {showUpgrade && (
          <Button
            size="sm"
            variant="gradient"
            className={compact ? "h-7 px-2 text-[10px]" : "h-8 px-3 text-xs"}
            onClick={() => router.push("/dashboard/settings?tab=billing")}
          >
            Upgrade plan
          </Button>
        )}
        {showRefill && (
          <Button
            size="sm"
            variant="outline"
            className={compact ? "h-7 px-2 text-[10px]" : "h-8 px-3 text-xs"}
            onClick={() => openModal("refill-credits")}
          >
            Refill credits
          </Button>
        )}
      </div>
    </div>
  );
}
