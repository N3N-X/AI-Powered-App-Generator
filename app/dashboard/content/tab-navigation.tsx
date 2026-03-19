"use client";

import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  Users,
  BarChart3,
  Settings2,
  Activity,
  FileCode,
  Key,
  ImageIcon,
  CreditCard,
  Mail,
  MessageSquare,
  Bell,
  HardDrive,
  MapPin,
  Github,
} from "lucide-react";

const TAB_CONFIG: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}[] = [
  { id: "database", icon: Database, label: "Database" },
  { id: "users", icon: Users, label: "Users" },
  { id: "settings", icon: Settings2, label: "Settings" },
  { id: "github", icon: Github, label: "GitHub" },
  { id: "apikeys", icon: Key, label: "API Keys" },
  { id: "usage", icon: BarChart3, label: "Usage" },
  { id: "payments", icon: CreditCard, label: "Payments" },
  { id: "images", icon: ImageIcon, label: "Images" },
  { id: "files", icon: FileCode, label: "Files" },
  { id: "logs", icon: Activity, label: "Logs" },
  { id: "proxy-email", icon: Mail, label: "Email" },
  { id: "proxy-sms", icon: MessageSquare, label: "SMS" },
  { id: "proxy-push", icon: Bell, label: "Push" },
  { id: "proxy-storage", icon: HardDrive, label: "Storage" },
  { id: "proxy-maps", icon: MapPin, label: "Maps" },
];

interface TabNavigationProps {
  availableTabs: string[];
}

export function TabNavigation({ availableTabs }: TabNavigationProps) {
  return (
    <TabsList className="h-auto flex flex-wrap gap-1 bg-white/5 border border-white/10 p-1.5 w-full">
      {TAB_CONFIG.filter((tab) => availableTabs.includes(tab.id)).map((tab) => {
        const Icon = tab.icon;
        return (
          <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 shrink-0">
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
