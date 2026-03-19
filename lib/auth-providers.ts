import type { Provider } from "@supabase/supabase-js";

export interface OAuthProviderConfig {
  name: string;
  provider: Provider;
  icon: string;
  color: string;
}

/**
 * All supported OAuth provider definitions.
 * Icons use simple SVG path data for rendering.
 */
const PROVIDER_REGISTRY: Record<string, Omit<OAuthProviderConfig, "provider">> =
  {
    google: {
      name: "Google",
      icon: "google",
      color: "hover:bg-white/10",
    },
    github: {
      name: "GitHub",
      icon: "github",
      color: "hover:bg-slate-700/50",
    },
    azure: {
      name: "Azure",
      icon: "azure",
      color: "hover:bg-blue-600/20",
    },
    apple: {
      name: "Apple",
      icon: "apple",
      color: "hover:bg-white/10",
    },
    gitlab: {
      name: "GitLab",
      icon: "gitlab",
      color: "hover:bg-orange-600/20",
    },
    bitbucket: {
      name: "Bitbucket",
      icon: "bitbucket",
      color: "hover:bg-blue-500/20",
    },
  };

/**
 * Returns the list of enabled OAuth providers based on the
 * NEXT_PUBLIC_AUTH_PROVIDERS environment variable.
 *
 * Set env var as comma-separated provider names, e.g.:
 *   NEXT_PUBLIC_AUTH_PROVIDERS=google,github
 *
 * If unset, returns an empty array (no OAuth buttons shown).
 */
export function getEnabledProviders(): OAuthProviderConfig[] {
  const envProviders = process.env.NEXT_PUBLIC_AUTH_PROVIDERS || "";

  if (!envProviders.trim()) {
    return [];
  }

  return envProviders
    .split(",")
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p in PROVIDER_REGISTRY)
    .map((p) => ({
      provider: p as Provider,
      ...PROVIDER_REGISTRY[p],
    }));
}
