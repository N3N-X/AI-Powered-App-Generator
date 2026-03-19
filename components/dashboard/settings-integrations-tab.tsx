"use client";

import { useState } from "react";
import { Github, Key, Check, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface SettingsIntegrationsTabProps {
  user: {
    plan?: string | null;
  } | null;
  hasGitHub: boolean;
  setConnectedServices: (services: Record<string, boolean>) => void;
}

export function SettingsIntegrationsTab({
  user,
  hasGitHub,
  setConnectedServices,
}: SettingsIntegrationsTabProps) {
  const [githubToken, setGithubToken] = useState("");
  const [claudeKey, setClaudeKey] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectGitHub = async () => {
    if (!githubToken.trim()) {
      toast({
        title: "Token required",
        description: "Please enter your GitHub personal access token",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch("/api/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: githubToken }),
      });

      if (!response.ok) {
        throw new Error("Failed to connect GitHub");
      }

      const data = await response.json();
      setConnectedServices({ github: true });
      setGithubToken("");
      toast({
        title: "GitHub connected",
        description: `Connected as ${data.github.login}`,
      });
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Please check your token and try again",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSaveClaudeKey = async () => {
    if (!claudeKey.trim()) {
      toast({
        title: "API key required",
        description: "Please enter your Claude API key",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch("/api/settings/claude-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: claudeKey }),
      });

      if (!response.ok) {
        throw new Error("Failed to save Claude key");
      }

      setConnectedServices({ customApiKey: true });
      setClaudeKey("");
      toast({
        title: "Claude API key saved",
        description: "You can now use Claude for code generation",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Please check your API key and try again",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <>
      {/* GitHub */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-medium text-white">GitHub</h4>
              <p className="text-sm text-slate-400">
                Create repos and push code
              </p>
            </div>
          </div>
          {hasGitHub ? (
            <Badge variant="success">
              <Check className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">Not connected</Badge>
          )}
        </div>

        {!hasGitHub && (
          <div className="mt-4 space-y-2">
            <Input
              type="password"
              placeholder="GitHub Personal Access Token"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleConnectGitHub}
                disabled={isConnecting}
              >
                Connect
              </Button>
              <a
                href="https://github.com/settings/tokens/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-400 hover:underline flex items-center gap-1"
              >
                Get token <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Claude API Key (Elite only) */}
      {user?.plan === "ELITE" && (
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/5">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-white">Claude API Key</h4>
                <p className="text-sm text-slate-400">
                  Use your own Claude API key
                </p>
              </div>
            </div>
            <Badge variant="premium">Elite</Badge>
          </div>

          <div className="mt-4 space-y-2">
            <Input
              type="password"
              placeholder="sk-ant-..."
              value={claudeKey}
              onChange={(e) => setClaudeKey(e.target.value)}
            />
            <Button
              size="sm"
              onClick={handleSaveClaudeKey}
              disabled={isConnecting}
            >
              Save Key
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
