export type ProxyStatus = "healthy" | "slow" | "failed";
export type ProfileStatus = "ready" | "running" | "stopped" | "error";

export interface FirefoxProfile {
  id: string;
  accountName: string;
  countryCode: string;
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
  useDefaultWebsite: boolean;
  lastLaunched: string;
  lastRefreshed?: string;
  nextRefreshAt?: string | null;
  startupDelaySeconds: number;
  launchOnStartup: boolean;
}

export interface ProxyTestInput {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface ProxyTestResult {
  ok: boolean;
  proxyIp: string;
  externalIp: string;
  latencyMs: number;
  countryCode: string;
  httpsTunnel: boolean;
  publicIp: boolean;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  flags: string[];
  source: "local";
  error?: string;
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
