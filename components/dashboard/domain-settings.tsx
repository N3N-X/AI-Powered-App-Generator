"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Link2,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DomainSettingsProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DomainData {
  subdomain: string | null;
  customDomain: string | null;
  domainVerified: boolean;
  subdomainUrl: string | null;
  customDomainUrl: string | null;
  dnsRecords?: Array<{
    type: string;
    name: string;
    value: string;
    ttl: number;
  }>;
}

export function DomainSettings({
  projectId,
  open,
  onOpenChange,
}: DomainSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [domainData, setDomainData] = useState<DomainData | null>(null);

  const [customDomain, setCustomDomain] = useState("");

  // Fetch domain data
  useEffect(() => {
    if (!open || !projectId) return;

    async function fetchDomain() {
      setLoading(true);
      try {
        const response = await fetch(`/api/projects/${projectId}/domain`);
        if (response.ok) {
          const data = await response.json();
          setDomainData(data);
          setCustomDomain(data.customDomain || "");
        }
      } catch (error) {
        console.error("Failed to fetch domain settings:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDomain();
  }, [open, projectId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/domain`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customDomain: customDomain.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save domain settings");
      }

      const data = await response.json();
      setDomainData(data);

      toast({
        title: "Domain settings saved",
        description: "Your domain configuration has been updated",
      });
    } catch (error) {
      toast({
        title: "Failed to save",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/domain/verify`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.verified) {
        setDomainData((prev) =>
          prev ? { ...prev, domainVerified: true } : null,
        );
        toast({
          title: "Domain verified!",
          description: "Your custom domain is now active",
        });
      } else {
        toast({
          title: "Verification failed",
          description: data.message || "Please check your DNS settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Value copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Settings
          </DialogTitle>
          <DialogDescription>
            Configure your web app&apos;s domain. Get a free subdomain or
            connect your custom domain.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Free Subdomain - Read Only (System Generated) */}
            <div className="space-y-3">
              <Label>Free Subdomain</Label>
              <p className="text-xs text-muted-foreground">
                Your subdomain is automatically generated when you create a
                project
              </p>
              {domainData?.subdomain ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                    <Globe className="h-4 w-4 text-green-500" />
                    <a
                      href={`https://${domainData.subdomain}.rux.sh`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:underline flex items-center gap-1 font-mono"
                    >
                      {domainData.subdomain}.rux.sh
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 ml-auto"
                      onClick={() =>
                        copyToClipboard(
                          `https://${domainData.subdomain}.rux.sh`,
                        )
                      }
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {/* Localhost testing link */}
                  <div className="flex items-center gap-2 p-2 rounded bg-black/20 text-xs">
                    <span className="text-muted-foreground">Test locally:</span>
                    <a
                      href={`/api/serve?subdomain=${domainData.subdomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline font-mono flex-1 truncate"
                    >
                      /api/serve?subdomain={domainData.subdomain}
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() =>
                        copyToClipboard(
                          `${window.location.origin}/api/serve?subdomain=${domainData.subdomain}`,
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-muted-foreground">
                  No subdomain assigned yet
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            {/* Custom Domain */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="customDomain">Custom Domain</Label>
                {domainData?.customDomain && (
                  <Badge
                    variant={
                      domainData.domainVerified ? "default" : "secondary"
                    }
                    className={cn(
                      domainData.domainVerified
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                    )}
                  >
                    {domainData.domainVerified ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending verification
                      </>
                    )}
                  </Badge>
                )}
              </div>
              <Input
                id="customDomain"
                placeholder="myapp.com"
                value={customDomain}
                onChange={(e) =>
                  setCustomDomain(
                    e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ""),
                  )
                }
              />

              {/* DNS Records for verification */}
              {domainData?.customDomain && !domainData.domainVerified && (
                <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Link2 className="h-4 w-4" />
                    DNS Configuration Required
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add these records to your domain&apos;s DNS settings:
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded bg-black/20">
                      <div>
                        <span className="text-muted-foreground">CNAME</span>{" "}
                        <span className="font-mono">{customDomain}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-violet-400">
                          cname.rux.sh
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard("cname.rux.sh")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded bg-black/20">
                      <div>
                        <span className="text-muted-foreground">TXT</span>{" "}
                        <span className="font-mono">_rux.{customDomain}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-violet-400 truncate max-w-[150px]">
                          rux-verify={projectId}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            copyToClipboard(`rux-verify=${projectId}`)
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleVerify}
                    disabled={verifying}
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Verify DNS Records
                      </>
                    )}
                  </Button>
                </div>
              )}

              {domainData?.domainVerified && domainData.customDomainUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <a
                    href={domainData.customDomainUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:underline flex items-center gap-1"
                  >
                    {domainData.customDomainUrl}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
