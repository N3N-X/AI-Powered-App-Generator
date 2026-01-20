import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Plan, Role, PLAN_LIMITS, PlanLimits, CREDIT_COSTS } from "@/types";

interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: Plan;
  role: Role;
  credits: number;
  totalCreditsUsed: number;
  lastCreditReset: Date | null;
}

interface UserState {
  // User data
  user: UserProfile | null;
  isLoaded: boolean;

  // Connected services
  hasGitHub: boolean;
  hasAppleDev: boolean;
  hasGoogleDev: boolean;
  hasExpo: boolean;
  hasCustomApiKey: boolean;

  // Actions
  setUser: (user: UserProfile | null) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  setIsLoaded: (loaded: boolean) => void;
  useCredits: (amount: number) => boolean;
  setCredits: (credits: number) => void;
  setConnectedServices: (services: {
    github?: boolean;
    appleDev?: boolean;
    googleDev?: boolean;
    expo?: boolean;
    customApiKey?: boolean;
  }) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoaded: false,
      hasGitHub: false,
      hasAppleDev: false,
      hasGoogleDev: false,
      hasExpo: false,
      hasCustomApiKey: false,

      // Actions
      setUser: (user) => {
        set({
          user,
          isLoaded: true,
        });
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },

      setIsLoaded: (loaded) => set({ isLoaded: loaded }),

      // Use credits - returns true if successful, false if insufficient
      useCredits: (amount: number) => {
        const state = get();
        if (!state.user) return false;
        if (state.user.credits < amount) return false;

        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                credits: state.user.credits - amount,
                totalCreditsUsed: state.user.totalCreditsUsed + amount,
              }
            : null,
        }));
        return true;
      },

      setCredits: (credits: number) => {
        set((state) => ({
          user: state.user ? { ...state.user, credits } : null,
        }));
      },

      setConnectedServices: (services) => {
        set((state) => ({
          hasGitHub: services.github ?? state.hasGitHub,
          hasAppleDev: services.appleDev ?? state.hasAppleDev,
          hasGoogleDev: services.googleDev ?? state.hasGoogleDev,
          hasExpo: services.expo ?? state.hasExpo,
          hasCustomApiKey: services.customApiKey ?? state.hasCustomApiKey,
        }));
      },

      logout: () => {
        set({
          user: null,
          isLoaded: false,
          hasGitHub: false,
          hasAppleDev: false,
          hasGoogleDev: false,
          hasExpo: false,
          hasCustomApiKey: false,
        });
      },
    }),
    {
      name: "rux-user-store",
      partialize: () => ({}), // Don't persist anything - always fetch fresh from server
    },
  ),
);

// ============================================
// Computed Selectors - use these in components
// ============================================

export const useRemainingCredits = () => {
  const user = useUserStore((state) => state.user);
  return user?.credits ?? 0;
};

export const useTotalCreditsUsed = () => {
  const user = useUserStore((state) => state.user);
  return user?.totalCreditsUsed ?? 0;
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

export const useIsAdmin = () => {
  const user = useUserStore((state) => state.user);
  return user?.role === "ADMIN";
};

export const useCanGenerate = () => {
  const user = useUserStore((state) => state.user);
  if (!user) return false;
  return user.credits >= CREDIT_COSTS.codeGeneration;
};

export const useCanRefine = () => {
  const user = useUserStore((state) => state.user);
  if (!user) return false;
  return user.credits >= CREDIT_COSTS.codeRefinement;
};

export const useCanBuild = () => {
  const user = useUserStore((state) => state.user);
  if (!user) return false;
  const limits = PLAN_LIMITS[user.plan];
  return limits.buildAccess && user.credits >= CREDIT_COSTS.buildAndroid;
};

// ============================================
// Legacy selectors for direct state access
// ============================================

export const selectPlanLimits = (state: UserState) =>
  state.user ? PLAN_LIMITS[state.user.plan] : PLAN_LIMITS.FREE;

export const selectRemainingCredits = (state: UserState) => {
  return state.user?.credits ?? 0;
};

export const selectCanGenerate = (state: UserState) => {
  if (!state.user) return false;
  return state.user.credits >= CREDIT_COSTS.codeGeneration;
};

export const selectCanRefine = (state: UserState) => {
  if (!state.user) return false;
  return state.user.credits >= CREDIT_COSTS.codeRefinement;
};

export const selectIsAdmin = (state: UserState) => {
  return state.user?.role === "ADMIN";
};
