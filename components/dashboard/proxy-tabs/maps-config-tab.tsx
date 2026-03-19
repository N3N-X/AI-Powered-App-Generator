"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, MapPin, Plus, X } from "lucide-react";
import type { MapsProxyConfig } from "@/types/proxy-config";
import { DEFAULT_MAPS_CONFIG } from "@/types/proxy-config";

const REGIONS = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "JP", label: "Japan" },
  { value: "IN", label: "India" },
  { value: "BR", label: "Brazil" },
  { value: "KR", label: "South Korea" },
  { value: "MX", label: "Mexico" },
  { value: "ES", label: "Spain" },
  { value: "IT", label: "Italy" },
  { value: "NL", label: "Netherlands" },
  { value: "SE", label: "Sweden" },
];

interface MapsConfigTabProps {
  projectId: string;
  config: MapsProxyConfig | null;
  onSave: (config: Partial<MapsProxyConfig>) => Promise<void>;
}

export function MapsConfigTab({
  projectId,
  config,
  onSave,
}: MapsConfigTabProps) {
  const [form, setForm] = useState<MapsProxyConfig>(
    config || DEFAULT_MAPS_CONFIG,
  );
  const [saving, setSaving] = useState(false);
  const [newCountry, setNewCountry] = useState("");

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
      toast({ title: "Maps settings saved" });
    } catch {
      toast({ title: "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addCountry = () => {
    const code = newCountry.trim().toUpperCase();
    if (!code || code.length !== 2 || form.restrictCountries.includes(code))
      return;
    setForm({
      ...form,
      restrictCountries: [...form.restrictCountries, code],
    });
    setNewCountry("");
  };

  const removeCountry = (code: string) => {
    setForm({
      ...form,
      restrictCountries: form.restrictCountries.filter((c) => c !== code),
    });
  };

  return (
    <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-xl">
      <div className="p-6 border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <MapPin className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Maps Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Configure maps and location services for your app
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
          size="sm"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </Button>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Default Region
          </label>
          <Select
            value={form.defaultRegion}
            onValueChange={(value) =>
              setForm({ ...form, defaultRegion: value })
            }
          >
            <SelectTrigger className="bg-white/80 dark:bg-white/5">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {REGIONS.map((region) => (
                <SelectItem key={region.value} value={region.value}>
                  {region.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Default region for geocoding and place search
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Units
          </label>
          <div className="flex gap-3">
            <Button
              variant={form.defaultUnits === "imperial" ? "default" : "outline"}
              size="sm"
              onClick={() => setForm({ ...form, defaultUnits: "imperial" })}
            >
              Imperial (mi)
            </Button>
            <Button
              variant={form.defaultUnits === "metric" ? "default" : "outline"}
              size="sm"
              onClick={() => setForm({ ...form, defaultUnits: "metric" })}
            >
              Metric (km)
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Default unit system for distances and directions
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Default Zoom Level
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={20}
              value={form.defaultZoomLevel}
              onChange={(e) =>
                setForm({
                  ...form,
                  defaultZoomLevel: parseInt(e.target.value),
                })
              }
              className="flex-1"
            />
            <span className="text-sm font-mono text-gray-700 dark:text-slate-300 w-8 text-center">
              {form.defaultZoomLevel}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Default map zoom (1 = world, 20 = building level)
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Restrict to Countries
          </label>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Country code (e.g., US)"
              value={newCountry}
              onChange={(e) => setNewCountry(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCountry()}
              maxLength={2}
              className="bg-white/80 dark:bg-white/5 w-48"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addCountry}
              disabled={!newCountry.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {form.restrictCountries.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.restrictCountries.map((code) => (
                <Badge key={code} variant="secondary" className="gap-1">
                  {code}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeCountry(code)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-slate-500">
            Limit place search to specific countries (empty = no restrictions)
          </p>
        </div>
      </div>
    </div>
  );
}
