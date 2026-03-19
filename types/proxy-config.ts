/**
 * Proxy Configuration Types
 *
 * Per-project configuration for proxy services (email, SMS, push, storage, maps).
 * Configs act as defaults that can be overridden per-request.
 */

// ---------------------------------------------------------------------------
// Service-Specific Configuration Types
// ---------------------------------------------------------------------------

export interface EmailProxyConfig {
  fromAddress: string;
  fromName: string;
  replyTo: string | null;
  subjectPrefix: string | null;
}

export interface SMSProxyConfig {
  countryCode: string;
}

export interface PushProxyConfig {
  defaultTitle: string;
  iconUrl: string | null;
  topics: string[];
  badgeEnabled: boolean;
  soundEnabled: boolean;
}

export interface StorageProxyConfig {
  defaultVisibility: "public" | "private";
  maxFileSizeMB: number;
  allowedMimeTypes: string[];
  autoOptimizeImages: boolean;
}

export interface MapsProxyConfig {
  defaultRegion: string;
  defaultUnits: "metric" | "imperial";
  defaultZoomLevel: number;
  restrictCountries: string[];
}

export interface NotificationsProxyConfig {
  notificationEmail: string;
}

// ---------------------------------------------------------------------------
// Union and Database Types
// ---------------------------------------------------------------------------

export type ProxyConfigService =
  | "email"
  | "sms"
  | "push"
  | "storage"
  | "maps"
  | "notifications";

export type ProxyConfigData =
  | EmailProxyConfig
  | SMSProxyConfig
  | PushProxyConfig
  | StorageProxyConfig
  | MapsProxyConfig
  | NotificationsProxyConfig;

export interface ProxyConfigRecord {
  id: string;
  projectId: string;
  service: ProxyConfigService;
  config: ProxyConfigData;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

export interface ProxyConfigsResponse {
  configs: {
    email: EmailProxyConfig | null;
    sms: SMSProxyConfig | null;
    push: PushProxyConfig | null;
    storage: StorageProxyConfig | null;
    maps: MapsProxyConfig | null;
    notifications: NotificationsProxyConfig | null;
  };
  detectedServices: ProxyConfigService[];
  enabledServices: ProxyConfigService[];
}

export interface SaveProxyConfigRequest {
  service: ProxyConfigService;
  config: Partial<ProxyConfigData>;
}

// ---------------------------------------------------------------------------
// Default Configurations
// ---------------------------------------------------------------------------

export const DEFAULT_EMAIL_CONFIG: EmailProxyConfig = {
  fromAddress: "",
  fromName: "",
  replyTo: null,
  subjectPrefix: null,
};

export const DEFAULT_SMS_CONFIG: SMSProxyConfig = {
  countryCode: "+1",
};

export const DEFAULT_PUSH_CONFIG: PushProxyConfig = {
  defaultTitle: "Notification",
  iconUrl: null,
  topics: [],
  badgeEnabled: true,
  soundEnabled: true,
};

export const DEFAULT_STORAGE_CONFIG: StorageProxyConfig = {
  defaultVisibility: "public",
  maxFileSizeMB: 10,
  allowedMimeTypes: ["image/*", "application/pdf"],
  autoOptimizeImages: true,
};

export const DEFAULT_MAPS_CONFIG: MapsProxyConfig = {
  defaultRegion: "US",
  defaultUnits: "imperial",
  defaultZoomLevel: 12,
  restrictCountries: [],
};

export const DEFAULT_NOTIFICATIONS_CONFIG: NotificationsProxyConfig = {
  notificationEmail: "",
};

// ---------------------------------------------------------------------------
// Service Metadata for UI
// ---------------------------------------------------------------------------

export const PROXY_SERVICE_INFO: Record<
  ProxyConfigService,
  { name: string; description: string; icon: string }
> = {
  email: {
    name: "Email",
    description: "Configure email sending settings",
    icon: "Mail",
  },
  sms: {
    name: "SMS",
    description: "Configure SMS messaging settings",
    icon: "MessageSquare",
  },
  push: {
    name: "Push Notifications",
    description: "Configure push notification settings",
    icon: "Bell",
  },
  storage: {
    name: "Storage",
    description: "Configure file storage settings",
    icon: "HardDrive",
  },
  maps: {
    name: "Maps",
    description: "Configure maps and location settings",
    icon: "MapPin",
  },
  notifications: {
    name: "Notifications",
    description: "Configure where to receive app notifications",
    icon: "BellRing",
  },
};
