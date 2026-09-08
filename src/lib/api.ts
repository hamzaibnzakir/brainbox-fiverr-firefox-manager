import type { ActivityEvent, DiscoveredFirefoxProfile, FirefoxProfile } from "@/types";

export interface AppSettings {
  workspaceName: string;
  firefoxBinary: string;
  launchOnLogin: boolean;
  launchAllAuto: boolean;
  startupDelay: number;
  defaultSite: string;
  theme: "dark" | "darker";
  notifyProxyFail: boolean;
  notifyLaunch: boolean;
  refreshEnabled: boolean;
  refreshMinMinutes: number;
  refreshMaxMinutes: number;
}

export interface AppSnapshot {
  engineOnline: boolean;
  platform: string;
  autostart: boolean;
  profiles: FirefoxProfile[];
  activity: ActivityEvent[];
  discoveredFirefoxProfiles: DiscoveredFirefoxProfile[];
  settings: AppSettings;
}

const API_BASE = (import.meta.env.VITE_BRAINBOX_API_URL || "http://127.0.0.1:8765/api").replace(/\/$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  snapshot: () => request<AppSnapshot>("/snapshot"),
  startAll: () => request<AppSnapshot>("/start-all", { method: "POST" }),
  restartAll: () => request<AppSnapshot>("/restart-all", { method: "POST" }),
  stopAll: () => request<AppSnapshot>("/stop-all", { method: "POST" }),
  launchProfile: (id: string) => request<AppSnapshot>(`/profiles/${encodeURIComponent(id)}/launch`, { method: "POST" }),
  stopProfile: (id: string) => request<AppSnapshot>(`/profiles/${encodeURIComponent(id)}/stop`, { method: "POST" }),
  createProfile: (profile: FirefoxProfile) => request<AppSnapshot>("/profiles", { method: "POST", body: JSON.stringify(profile) }),
  updateProfile: (profile: FirefoxProfile) => request<AppSnapshot>(`/profiles/${encodeURIComponent(profile.id)}`, { method: "PUT", body: JSON.stringify(profile) }),
  deleteProfile: (id: string) => request<AppSnapshot>(`/profiles/${encodeURIComponent(id)}`, { method: "DELETE" }),
  duplicateProfile: (id: string) => request<AppSnapshot>(`/profiles/${encodeURIComponent(id)}/duplicate`, { method: "POST" }),
  testProxy: (id: string) => request<AppSnapshot>(`/profiles/${encodeURIComponent(id)}/test-proxy`, { method: "POST" }),
  testAllProxies: () => request<AppSnapshot>("/proxies/test-all", { method: "POST" }),
  saveSettings: (settings: AppSettings) => request<AppSnapshot>("/settings", { method: "PUT", body: JSON.stringify(settings) }),
  refreshProfile: (id: string) => request<AppSnapshot>(`/profiles/${encodeURIComponent(id)}/refresh`, { method: "POST" }),
};
