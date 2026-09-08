import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, type AppSettings, type AppSnapshot } from "@/lib/api";
import type { FirefoxProfile } from "@/types";

const FALLBACK: AppSnapshot = {
  engineOnline: false,
  platform: "Backend disconnected",
  autostart: true,
  profiles: [
    { id:"p1", accountName:"Australia Fiverr", countryCode:"au", countryName:"Australia", status:"stopped", proxyHost:"104.253.199.69", proxyPort:5348, proxyUsername:"••••••••", proxyPassword:"", proxyStatus:"failed", latencyMs:0, externalIp:"—", firefoxProfileName:"Profile 1", targetWebsite:"https://www.fiverr.com/users/manage_gigs", lastLaunched:"Unknown", startupDelaySeconds:12, launchOnStartup:true },
    { id:"p2", accountName:"Fiverr Germany", countryCode:"de", countryName:"Germany", status:"stopped", proxyHost:"87.86.25.143", proxyPort:5294, proxyUsername:"••••••••", proxyPassword:"", proxyStatus:"healthy", latencyMs:0, externalIp:"—", firefoxProfileName:"Profile 2", targetWebsite:"https://www.fiverr.com/users/manage_gigs", lastLaunched:"Unknown", startupDelaySeconds:12, launchOnStartup:true },
    { id:"p4", accountName:"UK Fiverr 2", countryCode:"gb", countryName:"United Kingdom", status:"stopped", proxyHost:"92.71.71.163", proxyPort:6357, proxyUsername:"••••••••", proxyPassword:"", proxyStatus:"healthy", latencyMs:0, externalIp:"—", firefoxProfileName:"Profile 4", targetWebsite:"https://www.fiverr.com/users/manage_gigs", lastLaunched:"Unknown", startupDelaySeconds:12, launchOnStartup:true },
    { id:"p5", accountName:"UK Fiverr", countryCode:"gb", countryName:"United Kingdom", status:"stopped", proxyHost:"31.58.22.109", proxyPort:6689, proxyUsername:"••••••••", proxyPassword:"", proxyStatus:"healthy", latencyMs:0, externalIp:"—", firefoxProfileName:"Profile 5", targetWebsite:"https://www.fiverr.com/users/manage_gigs", lastLaunched:"Unknown", startupDelaySeconds:12, launchOnStartup:true },
    { id:"p6", accountName:"United Kingdom", countryCode:"gb", countryName:"United Kingdom", status:"stopped", proxyHost:"217.69.127.203", proxyPort:6824, proxyUsername:"••••••••", proxyPassword:"", proxyStatus:"healthy", latencyMs:0, externalIp:"—", firefoxProfileName:"Profile 6", targetWebsite:"https://www.fiverr.com/users/manage_gigs", lastLaunched:"Unknown", startupDelaySeconds:12, launchOnStartup:true },
    { id:"p7", accountName:"USA Fiverr", countryCode:"us", countryName:"United States", status:"stopped", proxyHost:"154.3.233.91", proxyPort:5369, proxyUsername:"••••••••", proxyPassword:"", proxyStatus:"healthy", latencyMs:0, externalIp:"—", firefoxProfileName:"Profile 7", targetWebsite:"https://www.fiverr.com/users/manage_gigs", lastLaunched:"Unknown", startupDelaySeconds:12, launchOnStartup:true },
  ],
  activity: [],
  discoveredFirefoxProfiles: ["Profile 1","Profile 2","Profile 4","Profile 5","Profile 6","Profile 7"].map((name, i) => ({ id:`fp${i}`, name, inUse:true })),
  settings: { workspaceName:"Brainbox", firefoxBinary:"/usr/bin/firefox", launchOnLogin:true, launchAllAuto:true, startupDelay:12, defaultSite:"https://www.fiverr.com/users/manage_gigs", theme:"dark", notifyProxyFail:true, notifyLaunch:false, refreshEnabled:false, refreshMinMinutes:5, refreshMaxMinutes:15 },
};

type ContextValue = AppSnapshot & {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  startAll: () => Promise<void>;
  restartAll: () => Promise<void>;
  stopAll: () => Promise<void>;
  launchProfile: (id: string) => Promise<void>;
  stopProfile: (id: string) => Promise<void>;
  createProfile: (p: FirefoxProfile) => Promise<void>;
  updateProfile: (p: FirefoxProfile) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  duplicateProfile: (id: string) => Promise<void>;
  testProxy: (id: string) => Promise<void>;
  testAllProxies: () => Promise<void>;
  saveSettings: (s: AppSettings) => Promise<void>;
  refreshProfile: (id: string) => Promise<void>;
};

const Ctx = createContext<ContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppSnapshot>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback(async (fn: () => Promise<AppSnapshot>) => {
    try {
      const next = await fn();
      setData(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backend unavailable");
      throw e;
    }
  }, []);

  const refresh = useCallback(async () => {
    try { await apply(api.snapshot); } catch { /* keep fallback/current state */ } finally { setLoading(false); }
  }, [apply]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { void api.snapshot().then(setData).then(() => setError(null)).catch(() => {}); }, 2500);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const action = useCallback((fn: () => Promise<AppSnapshot>) => apply(fn).catch(() => {}), [apply]);

  const value = useMemo<ContextValue>(() => ({
    ...data, loading, error, refresh,
    startAll: () => action(api.startAll),
    restartAll: () => action(api.restartAll),
    stopAll: () => action(api.stopAll),
    launchProfile: (id) => action(() => api.launchProfile(id)),
    stopProfile: (id) => action(() => api.stopProfile(id)),
    createProfile: (p) => action(() => api.createProfile(p)),
    updateProfile: (p) => action(() => api.updateProfile(p)),
    deleteProfile: (id) => action(() => api.deleteProfile(id)),
    duplicateProfile: (id) => action(() => api.duplicateProfile(id)),
    testProxy: (id) => action(() => api.testProxy(id)),
    testAllProxies: () => action(api.testAllProxies),
    saveSettings: (s) => action(() => api.saveSettings(s)),
    refreshProfile: (id) => action(() => api.refreshProfile(id)),
  }), [data, loading, error, refresh, action]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useAppData must be used inside AppDataProvider");
  return value;
}
