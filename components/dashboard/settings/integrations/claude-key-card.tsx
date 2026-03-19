"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Key } from "lucide-react";

export function ClaudeKeyCard() {
  const [claudeKey, setClaudeKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  return (
    <Card className="liquid-glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Claude API Key
          <Badge variant="premium">Elite</Badge>
        </CardTitle>
        <CardDescription>
          Use your own Claude API key for faster generation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="password"
          placeholder="sk-ant-..."
          value={claudeKey}
          onChange={(e) => setClaudeKey(e.target.value)}
          className="bg-white/5"
        />
        <Button disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Key"}
        </Button>
      </CardContent>
    </Card>
  );
}
