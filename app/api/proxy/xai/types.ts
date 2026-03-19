import type { Plan } from "@/types";

export interface HandlerContext {
  apiKeyId: string;
  projectId: string;
  userId: string;
  plan: Plan;
  xaiApiKey: string;
  startTime: number;
}
