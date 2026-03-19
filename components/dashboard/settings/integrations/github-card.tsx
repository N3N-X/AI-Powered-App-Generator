"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserStore } from "@/stores/user-store";
import { toast } from "@/hooks/use-toast";
import { Github, Check, ExternalLink } from "lucide-react";

export function GitHubCard() {
  const { hasGitHub, setConnectedServices } = useUserStore();

  const [githubToken, setGithubToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);

  useEffect(() => {
    const checkGitHubStatus = async () => {
      try {
        const response = await fetch("/api/github/connect");
        if (response.ok) {
          const data = await response.json();
          setConnectedServices({ github: data.connected });
          if (data.connected && data.github?.login) {
            setGithubUsername(data.github.login);
          }
        }
      } catch {
        // Silently fail
      }
    };
    checkGitHubStatus();
  }, [setConnectedServices]);

  const handleConnect = async () => {
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
      if (!response.ok) throw new Error("Failed to connect GitHub");
      const data = await response.json();
      setConnectedServices({ github: true });
      setGithubToken("");
      setGithubUsername(data.github.login);
      toast({
        title: "GitHub connected",
        description: `Connected as ${data.github.login}`,
      });
    } catch {
      toast({
        title: "Connection failed",
        description: "Please check your token and try again",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const response = await fetch("/api/github/connect", {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to disconnect GitHub");
      setConnectedServices({ github: false });
      setGithubUsername(null);
      toast({
        title: "GitHub disconnected",
        description: "Your GitHub account has been disconnected",
      });
    } catch {
      toast({
        title: "Failed to disconnect",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card className="liquid-glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to create repos and push code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasGitHub ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-white">
                Connected{githubUsername ? ` as @${githubUsername}` : ""}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="GitHub Personal Access Token"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="bg-white/5"
            />
            <div className="flex items-center gap-3">
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Connect GitHub"}
              </Button>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-violet-400 hover:underline flex items-center gap-1"
              >
                Create token <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
