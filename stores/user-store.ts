import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Plan, PLAN_LIMITS, PlanLimits } from "@/types";

interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: Plan;
  dailyPromptCount: number;
  totalPrompts: number;
}

interface UserState {
  // User data
  user: UserProfile | null;
  isLoaded: boolean;

  // Usage tracking
  dailyUsage: number;
  usageResetAt: Date | null;

  // Connected services
  hasGitHub: boolean;
  hasAppleDev: boolean;
  hasGoogleDev: boolean;
  hasExpo: boolean;
  hasCustomClaudeKey: boolean;

  // Actions
  setUser: (user: UserProfile | null) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  setIsLoaded: (loaded: boolean) => void;
  incrementUsage: () => void;
  resetDailyUsage: () => void;
  setConnectedServices: (services: {
    github?: boolean;
    appleDev?: boolean;
    googleDev?: boolean;
    expo?: boolean;
    customClaudeKey?: boolean;
  }) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoaded: false,
      dailyUsage: 0,
      usageResetAt: null,
      hasGitHub: false,
      hasAppleDev: false,
      hasGoogleDev: false,
      hasExpo: false,
      hasCustomClaudeKey: false,

      // Actions
      setUser: (user) => {
        set({
          user,
          isLoaded: true,
          dailyUsage: user?.dailyPromptCount || 0,
        });
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      setIsLoaded: (loaded) => set({ isLoaded: loaded }),

      incrementUsage: () => {
        set((state) => ({
          dailyUsage: state.dailyUsage + 1,
        }));
      },

      resetDailyUsage: () => {
        set({
          dailyUsage: 0,
          usageResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      },

      setConnectedServices: (services) => {
        set((state) => ({
          hasGitHub: services.github ?? state.hasGitHub,
          hasAppleDev: services.appleDev ?? state.hasAppleDev,
          hasGoogleDev: services.googleDev ?? state.hasGoogleDev,
          hasExpo: services.expo ?? state.hasExpo,
          hasCustomClaudeKey:
            services.customClaudeKey ?? state.hasCustomClaudeKey,
        }));
      },

      logout: () => {
        set({
          user: null,
          isLoaded: false,
          dailyUsage: 0,
          usageResetAt: null,
          hasGitHub: false,
          hasAppleDev: false,
          hasGoogleDev: false,
          hasExpo: false,
          hasCustomClaudeKey: false,
        });
      },
    }),
    {
      name: "rux-user-store",
      partialize: (state) => ({
        dailyUsage: state.dailyUsage,
        usageResetAt: state.usageResetAt,
      }),
    },
  ),
);

// Computed selectors - use these in components
export const useRemainingPrompts = () => {
  const user = useUserStore((state) => state.user);
  const dailyUsage = useUserStore((state) => state.dailyUsage);

  if (!user) return 20; // Default for FREE plan
  const limit = PLAN_LIMITS[user.plan].dailyPrompts;
  return Math.max(0, limit - dailyUsage);
};

export const usePlanLimits = (): PlanLimits => {
  const user = useUserStore((state) => state.user);
  return user ? PLAN_LIMITS[user.plan] : PLAN_LIMITS.FREE;
};

export const useCanUseFeature = (feature: keyof PlanLimits): boolean => {
  const user = useUserStore((state) => state.user);
  if (!user) return false;
  const limits = PLAN_LIMITS[user.plan];
  const value = limits[feature];
  return typeof value === "boolean" ? value : value !== 0;
};

// Legacy selectors for direct state access
export const selectPlanLimits = (state: UserState) =>
  state.user ? PLAN_LIMITS[state.user.plan] : PLAN_LIMITS.FREE;

export const selectRemainingPrompts = (state: UserState) => {
  if (!state.user) return 20;
  const limit = PLAN_LIMITS[state.user.plan].dailyPrompts;
  return Math.max(0, limit - state.dailyUsage);
};

export const selectCanGenerate = (state: UserState) => {
  return selectRemainingPrompts(state) > 0;
};
