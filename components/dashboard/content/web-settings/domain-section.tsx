"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Globe,
  Link,
  Shield,
  Crown,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

interface WebDomainSectionProps {
  slug: string;
  projectId: string;
  customDomain: string;
  customDomainInput: string;
  domainVerified: boolean;
  domainSaving: boolean;
  domainVerifying: boolean;
  domainDnsRecords: { type: string; name: string; value: string }[];
  canRemoveBranding: boolean;
  onDomainInputChange: (value: string) => void;
  onSaveDomain: () => void;
  onVerifyDomain: () => void;
  onRemoveDomain: () => void;
}

export function WebDomainSection({
  slug,
  projectId,
  customDomain,
  customDomainInput,
  domainVerified,
  domainSaving,
  domainVerifying,
  domainDnsRecords,
  canRemoveBranding,
  onDomainInputChange,
  onSaveDomain,
  onVerifyDomain,
  onRemoveDomain,
}: WebDomainSectionProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-slate-200 border-b border-white/10 pb-2 flex items-center gap-2">
        <Globe className="h-4 w-4" />
        Domain
      </h4>
      {slug && (
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">
            Rulxy Subdomain
          </label>
          <div className="flex items-center gap-2 h-9 px-3 rounded-md bg-white/[0.04] border border-white/10 max-w-xs">
            <span className="text-sm font-mono text-slate-300">
              {slug}.rulxy.com
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            System-generated subdomain. Not editable.
          </p>
        </div>
      )}

      <div>
        <label className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
          Custom Domain
          {!canRemoveBranding && (
            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-medium">
              <Crown className="h-2.5 w-2.5" />
              PRO
            </span>
          )}
        </label>

        {canRemoveBranding ? (
          <>
            {customDomain && !domainVerified ? (
              <DomainPendingVerification
                customDomainInput={customDomainInput}
                customDomain={customDomain}
                projectId={projectId}
                domainVerifying={domainVerifying}
                domainDnsRecords={domainDnsRecords}
                onDomainInputChange={onDomainInputChange}
                onVerifyDomain={onVerifyDomain}
                onRemoveDomain={onRemoveDomain}
              />
            ) : customDomain && domainVerified ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-green-500/20 bg-green-500/5 text-sm text-green-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="font-mono">{customDomain}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-red-400 hover:text-red-300"
                  onClick={onRemoveDomain}
                  disabled={domainSaving}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={customDomainInput}
                  onChange={(e) => onDomainInputChange(e.target.value)}
                  placeholder="app.yourdomain.com"
                  className="h-9 text-sm bg-white/5 border-white/10 max-w-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5"
                  onClick={onSaveDomain}
                  disabled={domainSaving || !customDomainInput.trim()}
                >
                  {domainSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Link className="h-3.5 w-3.5" />
                  )}
                  Connect
                </Button>
              </div>
            )}
            <p className="text-xs text-slate-600 mt-1">
              Point your domain to Rulxy via CNAME record
            </p>
          </>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-slate-400">
              Custom domains are available on Pro and Elite plans. Upgrade to
              connect your own domain.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DomainPendingVerification({
  customDomainInput,
  customDomain,
  projectId,
  domainVerifying,
  domainDnsRecords,
  onDomainInputChange,
  onVerifyDomain,
  onRemoveDomain,
}: {
  customDomainInput: string;
  customDomain: string;
  projectId: string;
  domainVerifying: boolean;
  domainDnsRecords: { type: string; name: string; value: string }[];
  onDomainInputChange: (value: string) => void;
  onVerifyDomain: () => void;
  onRemoveDomain: () => void;
}) {
  const records =
    domainDnsRecords.length > 0
      ? domainDnsRecords
      : [
          { type: "CNAME", name: customDomain, value: "cname.rulxy.com" },
          {
            type: "TXT",
            name: `_rux.${customDomain}`,
            value: `rux-verify=${projectId}`,
          },
        ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          value={customDomainInput}
          onChange={(e) => onDomainInputChange(e.target.value)}
          placeholder="app.yourdomain.com"
          className="h-9 text-sm bg-white/5 border-white/10 max-w-xs"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          onClick={onVerifyDomain}
          disabled={domainVerifying}
        >
          {domainVerifying ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Shield className="h-3.5 w-3.5" />
          )}
          Verify
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 text-red-400 hover:text-red-300"
          onClick={onRemoveDomain}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
        <p className="text-xs text-amber-400 font-medium mb-2 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5" />
          Configure these DNS records:
        </p>
        <div className="space-y-1.5">
          {records.map((rec, i) => (
            <div
              key={i}
              className="flex items-center gap-3 text-xs font-mono bg-white/5 rounded px-2 py-1.5"
            >
              <span className="text-slate-500 w-12 shrink-0">{rec.type}</span>
              <span className="text-slate-300 truncate">{rec.name}</span>
              <span className="text-slate-600">{"\u2192"}</span>
              <span className="text-slate-300 truncate">{rec.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
