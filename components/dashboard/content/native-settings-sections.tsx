"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface AppConfigForm {
  name: string;
  slug: string;
  version: string;
  orientation: string;
  icon: string;
  splashImage: string;
  splashBackgroundColor: string;
  iosBundleIdentifier: string;
  iosSupportsTablet: boolean;
  androidPackage: string;
  androidAdaptiveIconBg: string;
}

interface NativeGeneralSectionProps {
  form: AppConfigForm;
  onFormChange: (updater: (prev: AppConfigForm) => AppConfigForm) => void;
}

export function NativeGeneralSection({
  form,
  onFormChange,
}: NativeGeneralSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-slate-200 border-b border-white/10 pb-2">
        General
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            App Name
          </label>
          <Input
            value={form.name}
            onChange={(e) =>
              onFormChange((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter app display name"
            className="h-9 text-sm bg-white/5 border-white/10"
          />
          <p className="text-xs text-slate-600 mt-1">
            Display name shown on the device home screen
          </p>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Slug</label>
          <div className="flex items-center h-9 px-3 rounded-md bg-white/[0.04] border border-white/10">
            <span className="text-sm font-mono text-slate-300">
              {form.slug || "\u2014"}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            System-generated identifier. Not editable.
          </p>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Version</label>
          <Input
            value={form.version}
            onChange={(e) =>
              onFormChange((prev) => ({ ...prev, version: e.target.value }))
            }
            placeholder="1.0.0"
            className="h-9 text-sm bg-white/5 border-white/10"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            Orientation
          </label>
          <Select
            value={form.orientation}
            onValueChange={(val) =>
              onFormChange((prev) => ({ ...prev, orientation: val }))
            }
          >
            <SelectTrigger className="h-9 text-sm bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">Portrait</SelectItem>
              <SelectItem value="landscape">Landscape</SelectItem>
              <SelectItem value="default">Default (both)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

interface NativeSplashSectionProps {
  form: AppConfigForm;
  onFormChange: (updater: (prev: AppConfigForm) => AppConfigForm) => void;
}

export function NativeSplashSection({
  form,
  onFormChange,
}: NativeSplashSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-slate-200 border-b border-white/10 pb-2">
        Splash Screen
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            Splash Image Path
          </label>
          <Input
            value={form.splashImage}
            onChange={(e) =>
              onFormChange((prev) => ({ ...prev, splashImage: e.target.value }))
            }
            placeholder="./assets/splash.png"
            className="h-9 text-sm bg-white/5 border-white/10"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            Background Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.splashBackgroundColor}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  splashBackgroundColor: e.target.value,
                }))
              }
              className="h-9 w-9 rounded border border-white/10 cursor-pointer bg-transparent"
            />
            <Input
              value={form.splashBackgroundColor}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  splashBackgroundColor: e.target.value,
                }))
              }
              placeholder="#ffffff"
              className="h-9 text-sm bg-white/5 border-white/10 flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface NativeIosSectionProps {
  form: AppConfigForm;
  onFormChange: (updater: (prev: AppConfigForm) => AppConfigForm) => void;
}

export function NativeIosSection({
  form,
  onFormChange,
}: NativeIosSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-slate-200 border-b border-white/10 pb-2">
        iOS
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            Bundle Identifier
          </label>
          <Input
            value={form.iosBundleIdentifier}
            onChange={(e) =>
              onFormChange((prev) => ({
                ...prev,
                iosBundleIdentifier: e.target.value,
              }))
            }
            placeholder={`com.rux.${form.slug || "my-app"}`}
            className="h-9 text-sm bg-white/5 border-white/10"
          />
          <p className="text-xs text-slate-600 mt-1">
            Unique identifier for the App Store (e.g. com.yourcompany.appname)
          </p>
        </div>
        <div className="flex items-center gap-3 pt-5">
          <button
            type="button"
            role="switch"
            aria-checked={form.iosSupportsTablet}
            onClick={() =>
              onFormChange((prev) => ({
                ...prev,
                iosSupportsTablet: !prev.iosSupportsTablet,
              }))
            }
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
              form.iosSupportsTablet ? "bg-violet-500" : "bg-white/10",
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform",
                form.iosSupportsTablet ? "translate-x-4" : "translate-x-0",
              )}
            />
          </button>
          <label className="text-sm text-slate-400">
            Supports iPad / Tablet
          </label>
        </div>
      </div>
    </div>
  );
}

interface NativeAndroidSectionProps {
  form: AppConfigForm;
  onFormChange: (updater: (prev: AppConfigForm) => AppConfigForm) => void;
}

export function NativeAndroidSection({
  form,
  onFormChange,
}: NativeAndroidSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-slate-200 border-b border-white/10 pb-2">
        Android
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            Package Name
          </label>
          <Input
            value={form.androidPackage}
            onChange={(e) =>
              onFormChange((prev) => ({
                ...prev,
                androidPackage: e.target.value,
              }))
            }
            placeholder={`com.rux.${form.slug || "my-app"}`}
            className="h-9 text-sm bg-white/5 border-white/10"
          />
          <p className="text-xs text-slate-600 mt-1">
            Unique identifier for the Play Store (e.g. com.yourcompany.appname)
          </p>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            Adaptive Icon Background
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.androidAdaptiveIconBg}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  androidAdaptiveIconBg: e.target.value,
                }))
              }
              className="h-9 w-9 rounded border border-white/10 cursor-pointer bg-transparent"
            />
            <Input
              value={form.androidAdaptiveIconBg}
              onChange={(e) =>
                onFormChange((prev) => ({
                  ...prev,
                  androidAdaptiveIconBg: e.target.value,
                }))
              }
              placeholder="#ffffff"
              className="h-9 text-sm bg-white/5 border-white/10 flex-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
