import { ProxyService } from "./services";

// ============================================
// Usage Tracking
// ============================================

export interface ProxyUsageRecord {
  id: string;
  projectId: string;
  userId: string;
  service: ProxyService;
  operation: string;
  creditsUsed: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
