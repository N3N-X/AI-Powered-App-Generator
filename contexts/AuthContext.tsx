"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { createAuthActions, createMfaActions } from "./auth-helpers";
import type { OAuthProvider } from "./auth-helpers";

interface MfaFactor {
  id: string;
  friendly_name?: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
    inviteCode?: string,
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  logout: () => Promise<void>;
  logoutAllDevices: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName?: string, photoURL?: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  linkOAuthProvider: (provider: OAuthProvider) => Promise<void>;
  // MFA
  mfaEnabled: boolean;
  assuranceLevel: "aal1" | "aal2" | null;
  mfaRequired: boolean;
  mfaEnroll: (friendlyName?: string) => Promise<{
    id: string;
    totp: { qr_code: string; secret: string; uri: string };
  }>;
  mfaChallenge: (factorId: string) => Promise<string>;
  mfaVerify: (
    factorId: string,
    challengeId: string,
    code: string,
  ) => Promise<void>;
  mfaUnenroll: (factorId: string) => Promise<void>;
  mfaListFactors: () => Promise<{ totp: MfaFactor[] }>;
  refreshMfaState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [assuranceLevel, setAssuranceLevel] = useState<"aal1" | "aal2" | null>(
    null,
  );
  const [mfaRequired, setMfaRequired] = useState(false);
  const supabase = createClient();

  const authActions = createAuthActions(supabase);
  const mfaActions = createMfaActions(supabase);

  const refreshMfaState = async () => {
    try {
      const { data: aalData } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const { data: factorsData } = await supabase.auth.mfa.listFactors();

      const verifiedFactors =
        factorsData?.totp?.filter(
          (f: { status: string }) => f.status === "verified",
        ) ?? [];
      setMfaEnabled(verifiedFactors.length > 0);

      if (aalData) {
        setAssuranceLevel(aalData.currentLevel);
        setMfaRequired(aalData.currentLevel !== aalData.nextLevel);
      }
    } catch {
      // Silently fail — MFA state stays at defaults
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        refreshMfaState();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        refreshMfaState();
      } else {
        setMfaEnabled(false);
        setAssuranceLevel(null);
        setMfaRequired(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        ...authActions,
        updateUserProfile: (displayName?: string, photoURL?: string) =>
          authActions.updateUserProfile(user, displayName, photoURL),
        updateEmail: (newEmail: string) =>
          authActions.updateEmail(user, newEmail),
        changePassword: (newPassword: string) =>
          authActions.changePassword(user, newPassword),
        linkOAuthProvider: (provider: OAuthProvider) =>
          authActions.linkOAuthProvider(user, provider),
        mfaEnabled,
        assuranceLevel,
        mfaRequired,
        mfaEnroll: mfaActions.mfaEnroll,
        mfaChallenge: mfaActions.mfaChallenge,
        mfaVerify: (factorId: string, challengeId: string, code: string) =>
          mfaActions.mfaVerify(factorId, challengeId, code, refreshMfaState),
        mfaUnenroll: (factorId: string) =>
          mfaActions.mfaUnenroll(factorId, refreshMfaState),
        mfaListFactors: mfaActions.mfaListFactors,
        refreshMfaState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
