"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Activity } from "lucide-react";

export function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="liquid-glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
      </CardContent>
    </Card>
  );
}

export function ToggleRow({
  label,
  description,
  checked,
  onChange,
  colorOn,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  colorOn: "green" | "violet";
}) {
  const activeColor =
    colorOn === "green" ? "bg-green-500/20" : "bg-violet-500/20";
  const activeIcon = colorOn === "green" ? "text-green-400" : "text-violet-400";
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full ${checked ? activeColor : "bg-red-500/20"} flex items-center justify-center`}
        >
          <Activity
            className={`h-5 w-5 ${checked ? activeIcon : "text-red-400"}`}
          />
        </div>
        <div>
          <p className="text-white font-medium">{label}</p>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <span className="flex items-center text-sm text-slate-400 px-3">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}

export function formatDuration(seconds: number | null) {
  if (seconds === null) return "N/A";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
