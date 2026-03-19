export interface ContentProject {
  id: string;
  name: string;
  description: string | null;
  platform: string;
  codeFiles: Record<string, string>;
  appConfig: Record<string, unknown> | null;
  githubRepo: string | null;
  githubUrl: string | null;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  documentCount: number;
  globalCount: number;
  userCount: number;
  createdAt: string;
}

export interface Document {
  id: string;
  data: Record<string, unknown>;
  ownerType: string;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  services: string[];
  lastUsed: string | null;
  createdAt: string;
  isActive: boolean;
}

export interface UsageStats {
  totalCalls: number;
  totalCredits: number;
  byService: Record<string, { calls: number; credits: number }>;
}

export interface UsageLog {
  id: string;
  service: string;
  operation: string;
  creditsUsed: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ImageFile {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url: string;
  createdAt: string;
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getServiceColor(service: string) {
  const colors: Record<string, string> = {
    db: "text-blue-400 bg-blue-400/10",
    auth: "text-green-400 bg-green-400/10",
    email: "text-yellow-400 bg-yellow-400/10",
    storage: "text-purple-400 bg-purple-400/10",
    payments: "text-pink-400 bg-pink-400/10",
    openai: "text-cyan-400 bg-cyan-400/10",
    maps: "text-orange-400 bg-orange-400/10",
    sms: "text-emerald-400 bg-emerald-400/10",
  };
  return colors[service] || "text-slate-400 bg-slate-400/10";
}
