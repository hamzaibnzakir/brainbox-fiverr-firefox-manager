import { useEffect, useState } from "react";
import { Eye, EyeOff, ShieldCheck, Loader2, Globe2 } from "lucide-react";
import type { FirefoxProfile, DiscoveredFirefoxProfile } from "@/types";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function ProfileDrawer({ profile, open, onOpenChange, onSave, onTestProxy, discoveredProfiles }: {
  profile: FirefoxProfile | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (p: FirefoxProfile) => void;
  onTestProxy: (id: string) => Promise<void>;
  discoveredProfiles: DiscoveredFirefoxProfile[];
}) {
  const [form, setForm] = useState<FirefoxProfile | null>(profile);
  const [showPassword, setShowPassword] = useState(false);
  const [testState, setTestState] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  useEffect(() => { setForm(profile); setTestState("idle"); setShowPassword(false); }, [profile]);
  if (!form) return null;
  function set<K extends keyof FirefoxProfile>(key: K, value: FirefoxProfile[K]) { setForm(prev => prev ? { ...prev, [key]: value } : prev); }
  async function testProxy() { setTestState("testing"); try { await onTestProxy(form.id); setTestState("ok"); } catch { setTestState("fail"); } }
  return <Drawer open={open} onOpenChange={onOpenChange} title={form.accountName} subtitle={`${form.firefoxProfileName} · ${form.countryName}`} footer={<><Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={() => onSave(form)}>Save changes</Button></>}>
    <div className="flex flex-col gap-5">
      <Input label="Account name" value={form.accountName} onChange={e => set("accountName", e.target.value)} />
      <Input label="Country" value={form.countryName} onChange={e => set("countryName", e.target.value)} />
      <Select label="Firefox profile" value={form.firefoxProfileName} onChange={v => set("firefoxProfileName", v)} options={discoveredProfiles.map(p => ({ value:p.name, label:p.name, hint:p.inUse ? "in use" : undefined }))} />
      <div className="h-px bg-border" />
      <div className="grid grid-cols-2 gap-3"><Input label="Proxy host" value={form.proxyHost} onChange={e => set("proxyHost", e.target.value)} /><Input label="Proxy port" type="number" min={1} max={65535} value={form.proxyPort || ""} onChange={e => set("proxyPort", Number(e.target.value) || 0)} /></div>
      <Input label="Proxy username" value={form.proxyUsername} onChange={e => set("proxyUsername", e.target.value)} />
      <div className="flex flex-col gap-1.5"><label className="text-[13px] text-text-secondary">Proxy password</label><div className="relative"><input type={showPassword ? "text" : "password"} value={form.proxyPassword} onChange={e => set("proxyPassword", e.target.value)} className="h-9 w-full rounded-md border border-border bg-surface px-3 pr-9 font-mono text-[13px] text-text-primary transition-colors focus-ring focus:border-accent" /><button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary transition-colors hover:text-text-secondary">{showPassword ? <EyeOff size={14} /> : <Eye size={14} />}</button></div></div>
      <div className="flex items-center gap-2"><Button variant="secondary" size="sm" onClick={() => void testProxy()} disabled={testState === "testing"}>{testState === "testing" ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />} Test proxy</Button>{testState === "ok" && <Badge tone="healthy">Connection OK</Badge>}{testState === "fail" && <Badge tone="failed">Connection failed</Badge>}</div>
      <div className="h-px bg-border" />
      <div className="rounded-md border border-border bg-base px-3 py-2.5"><Switch checked={form.useDefaultWebsite} onCheckedChange={v => set("useDefaultWebsite", v)} label="Use default website" description="Launch this profile at the website configured in Settings." /></div>
      {!form.useDefaultWebsite && <Input label="Profile target website" placeholder="https://www.fiverr.com/..." value={form.targetWebsite} onChange={e => set("targetWebsite", e.target.value)} />}
      {form.useDefaultWebsite && <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2.5 text-[12px] text-text-tertiary"><Globe2 size={14} /> This profile will always use the current default website.</div>}
      <div className="flex flex-col gap-1.5"><label className="text-[13px] text-text-secondary">Startup delay</label><Slider value={form.startupDelaySeconds} onChange={v => set("startupDelaySeconds", v)} /></div>
      <div className="rounded-md border border-border bg-base px-3 py-2.5"><Switch checked={form.launchOnStartup} onCheckedChange={v => set("launchOnStartup", v)} label="Enable on startup" description="Launch this profile automatically with Brainbox" /></div>
    </div>
  </Drawer>;
}
