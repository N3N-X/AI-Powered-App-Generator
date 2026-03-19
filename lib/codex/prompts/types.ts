/**
 * RUX Prompts — Shared types
 */

export type Platform = "IOS" | "ANDROID" | "WEB";

export interface ScreenSpec {
  name: string;
  path: string;
  description: string;
  components?: string[];
  dataNeeded?: string[];
}

export interface AppSpec {
  name: string;
  description: string;
  platforms: Platform[];
  features?: string[];
  screens: ScreenSpec[];
  api?: {
    collections?: Array<{
      name: string;
      type: "global" | "user";
      fields?: Array<{ name: string; type: string }>;
      seedCount?: number;
    }>;
    externalApis?: string[];
    authRequired?: boolean;
    paymentsRequired?: boolean;
  };
  styling?: {
    primaryColor?: string;
    secondaryColor?: string;
    style?: string;
  };
}
