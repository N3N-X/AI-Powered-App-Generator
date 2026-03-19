export interface AdminStats {
  users: {
    total: number;
    byPlan: {
      free: number;
      pro: number;
      elite: number;
    };
  };
  projects: {
    total: number;
  };
  builds: {
    total: number;
    byStatus: Record<string, number>;
  };
  credits: {
    totalUsed: number;
    totalRemaining: number;
    avgPerUser: number;
  };
  revenue: {
    monthlyEstimate: number;
  };
  blog: {
    total: number;
    published: number;
  };
  recentSignups: Array<{
    id: string;
    email: string;
    name: string | null;
    plan: string;
    createdAt: string;
  }>;
}
