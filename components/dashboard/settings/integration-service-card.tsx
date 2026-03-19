"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface IntegrationServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  connected: boolean;
  connectLabel: string;
  onConnect: () => void;
  onUpdate?: () => void;
  onDisconnect?: () => void;
}

export function IntegrationServiceCard({
  icon: Icon,
  title,
  description,
  connected,
  connectLabel,
  onConnect,
  onUpdate,
  onDisconnect,
}: IntegrationServiceCardProps) {
  return (
    <Card className="liquid-glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {connected ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="text-white">Connected</span>
            </div>
            <div className="flex gap-2">
              {onUpdate && (
                <Button variant="outline" size="sm" onClick={onUpdate}>
                  Update
                </Button>
              )}
              {onDisconnect && (
                <Button variant="outline" size="sm" onClick={onDisconnect}>
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={onConnect}>
            {connectLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
