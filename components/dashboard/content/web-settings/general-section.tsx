"use client";

import { Input } from "@/components/ui/input";

interface WebGeneralSectionProps {
  name: string;
  version: string;
  description: string;
  onNameChange: (value: string) => void;
  onVersionChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function WebGeneralSection({
  name,
  version,
  description,
  onNameChange,
  onVersionChange,
  onDescriptionChange,
}: WebGeneralSectionProps) {
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
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter app display name"
            className="h-9 text-sm bg-white/5 border-white/10"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Version</label>
          <Input
            value={version}
            onChange={(e) => onVersionChange(e.target.value)}
            placeholder="1.0.0"
            className="h-9 text-sm bg-white/5 border-white/10"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-slate-400 mb-1.5 block">
            Description
          </label>
          <Input
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Brief description for SEO and sharing"
            className="h-9 text-sm bg-white/5 border-white/10"
          />
          <p className="text-xs text-slate-600 mt-1">
            Used for SEO meta tags and social sharing
          </p>
        </div>
      </div>
    </div>
  );
}
