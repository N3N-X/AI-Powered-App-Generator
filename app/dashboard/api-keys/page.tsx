"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useProjectStore } from "@/stores/project-store";
import {
  Key,
  Plus,
  Copy,
  Trash2,
  AlertTriangle,
  Clock,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  services: string[];
  active: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
}

const ALL_SERVICES = [
  { id: "OPENAI", name: "OpenAI", description: "AI chat completions" },
  { id: "MAPS", name: "Maps", description: "Geocoding & directions" },
  { id: "EMAIL", name: "Email", description: "SendGrid email sending" },
  { id: "SMS", name: "SMS", description: "Twilio SMS messaging" },
  { id: "STORAGE", name: "Storage", description: "File uploads" },
  { id: "DATABASE", name: "Database", description: "Managed Postgres" },
  { id: "PUSH", name: "Push", description: "Push notifications" },
  { id: "ANALYTICS", name: "Analytics", description: "Event tracking" },
];

export default function ApiKeysPage() {
  const { projects, currentProject } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("Default");
  const [selectedServices, setSelectedServices] = useState<string[]>(
    ALL_SERVICES.map((s) => s.id),
  );

  useEffect(() => {
    if (currentProject) {
      setSelectedProjectId(currentProject.id);
    } else if (projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [currentProject, projects]);

  const fetchApiKeys = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/proxy/keys?projectId=${selectedProjectId}`,
      );
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys);
      }
    } catch (err) {
      console.error("Failed to fetch API keys:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchApiKeys();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  const handleCreateKey = async () => {
    if (!selectedProjectId) return;

    try {
      const response = await fetch("/api/proxy/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          name: newKeyName,
          services: selectedServices,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      setNewKey(data.key);
      fetchApiKeys();
      toast({
        title: "API Key Created",
        description: "Make sure to copy it now - it won't be shown again!",
      });
    } catch (error) {
      toast({
        title: "Failed to create key",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    try {
      const response = await fetch("/api/proxy/keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });

      if (!response.ok) {
        throw new Error("Failed to revoke key");
      }

      fetchApiKeys();
      toast({
        title: "API Key Revoked",
        description: "The key has been permanently deleted",
      });
    } catch (error) {
      toast({
        title: "Failed to revoke key",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  return (
    <div className="h-full overflow-auto bg-[#0a0a0f]">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-white">
              API Keys
            </h1>
            <p className="text-gray-600 dark:text-slate-400">
              Manage API keys for your generated apps to access proxy services
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-gray-900 dark:text-white">
                  Create API Key
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-slate-400">
                  Create a new API key for your project. The key will only be
                  shown once.
                </DialogDescription>
              </DialogHeader>

              {newKey ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-400">
                        Key Created!
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
                      Copy this key now. It won&apos;t be shown again.
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-gray-100 dark:bg-black/50 rounded text-xs text-black dark:text-white font-mono break-all">
                        {newKey}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(newKey)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      setNewKey(null);
                      setShowCreateDialog(false);
                      setNewKeyName("Default");
                      setSelectedServices(ALL_SERVICES.map((s) => s.id));
                    }}
                  >
                    Done
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-900 dark:text-white">
                        Project
                      </Label>
                      <Select
                        value={selectedProjectId}
                        onValueChange={setSelectedProjectId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-900 dark:text-white">
                        Key Name
                      </Label>
                      <Input
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        placeholder="e.g., Production, Development"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-900 dark:text-white">
                        Services
                      </Label>
                      <div className="grid grid-cols-2 gap-2 p-3 rounded-lg border border-gray-200/50 dark:border-white/10">
                        {ALL_SERVICES.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={service.id}
                              checked={selectedServices.includes(service.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedServices([
                                    ...selectedServices,
                                    service.id,
                                  ]);
                                } else {
                                  setSelectedServices(
                                    selectedServices.filter(
                                      (s) => s !== service.id,
                                    ),
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={service.id}
                              className="text-sm text-gray-700 dark:text-slate-300 cursor-pointer"
                            >
                              {service.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowCreateDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateKey}>Create Key</Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Project Selector */}
        <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-gray-900 dark:text-white">
              Select Project
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* API Keys List */}
        <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-slate-400">
              Keys for accessing proxy services from your generated apps
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-600 dark:text-slate-400">
                Loading...
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key className="h-12 w-12 mx-auto mb-4 text-gray-600 dark:text-slate-600" />
                <p className="text-gray-600 dark:text-slate-400 mb-2">
                  No API keys yet
                </p>
                <p className="text-sm text-gray-700 dark:text-slate-500">
                  Create a key to start using proxy services in your apps
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className={cn(
                      "p-4 rounded-lg border transition-colors",
                      key.active
                        ? "bg-white/10 border-gray-300/50 dark:bg-white/5 dark:border-white/10"
                        : "bg-red-500/10 border-red-500/30 dark:bg-red-500/5 dark:border-red-500/20",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-black dark:text-white">
                            {key.name}
                          </span>
                          {!key.active && (
                            <Badge variant="destructive">Revoked</Badge>
                          )}
                        </div>
                        <code className="text-sm text-gray-600 dark:text-slate-400 font-mono">
                          {key.keyPrefix}...
                        </code>
                        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created{" "}
                            {new Date(key.createdAt).toLocaleDateString()}
                          </span>
                          {key.lastUsedAt && (
                            <span>
                              Last used{" "}
                              {new Date(key.lastUsedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {key.active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => handleRevokeKey(key.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {key.services.map((service) => (
                        <Badge
                          key={service}
                          variant="secondary"
                          className="text-xs"
                        >
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Info */}
        <Card className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Important
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 dark:text-slate-400 space-y-2">
            <p>
              API keys provide access to proxy services from your generated
              apps. Each request is tracked and deducted from your credit
              balance.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">
                Security:
              </strong>{" "}
              Never expose API keys in client-side code. Use environment
              variables or secure key management.
            </p>
            <p>
              <strong className="text-gray-900 dark:text-white">Usage:</strong>{" "}
              Include your key in the
              <code className="mx-1 px-1 py-0.5 bg-gray-100 dark:bg-white/10 rounded">
                x-rux-api-key
              </code>
              header or as a Bearer token.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
