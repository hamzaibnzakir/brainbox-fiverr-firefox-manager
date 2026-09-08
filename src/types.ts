export type ProxyStatus = "healthy" | "slow" | "failed";
export type ProfileStatus = "ready" | "running" | "stopped" | "error";

export interface FirefoxProfile {
  id: string;
  accountName: string;
  countryCode: string; // ISO-2, lowercase, used for flag emoji lookup
  countryName: string;
  status: ProfileStatus;
  proxyHost: string;
  proxyPort: number;
  proxyUsername: string;
  proxyPassword: string;
  proxyStatus: ProxyStatus;
  latencyMs: number;
  externalIp: string;
  firefoxProfileName: string;
  targetWebsite: string;
  lastLaunched: string; // human relative string
  lastRefreshed?: string;
  nextRefreshAt?: string | null;
  startupDelaySeconds: number;
  launchOnStartup: boolean;
}

export type ActivityKind =
  | "launch"
  | "auth"
  | "browser-open"
  | "page-load"
  | "stop"
  | "error"
  | "system";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  message: string;
  profileName?: string;
  timestamp: string;
}

export interface DiscoveredFirefoxProfile {
  id: string;
  name: string;
  inUse: boolean;
}
