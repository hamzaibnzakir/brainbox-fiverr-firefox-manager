import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import type { ProxyStatus } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppData } from "@/context/AppData";

const STATUS_LABEL: Record<ProxyStatus, string> = { healthy: "Healthy", slow: "Slow", failed: "Failed" };

export function ProxyManager() {
  const { profiles, testProxy, testAllProxies } = useAppData();
  const [testingAll, setTestingAll] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  async function testAll() { setTestingAll(true); await testAllProxies(); setTestingAll(false); }
  async function testOne(id: string) { setTestingId(id); await testProxy(id); setTestingId(null); }

  return (
    <div className="px-8 py-8">
      <div className="mb-5 flex items-center justify-between">
        <div><h1 className="text-lg font-semibold tracking-tight text-text-primary">Proxy Manager</h1><p className="mt-0.5 text-[13px] text-text-secondary">{profiles.length} proxies across your identity pool</p></div>
        <Button variant="primary" onClick={() => void testAll()} disabled={testingAll}>{testingAll ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}Test all proxies</Button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="grid grid-cols-[1.1fr_0.6fr_0.9fr_0.8fr_0.7fr_1fr_1.2fr_auto] gap-4 border-b border-border px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-text-tertiary"><span>Proxy</span><span>Port</span><span>Username</span><span>Status</span><span>Latency</span><span>External IP</span><span>Assigned profile</span><span></span></div>
        {profiles.map((p, i) => {
          const testing = testingAll || testingId === p.id;
          return <div key={p.id} className={`grid grid-cols-[1.1fr_0.6fr_0.9fr_0.8fr_0.7fr_1fr_1.2fr_auto] items-center gap-4 px-4 py-3 text-[13px] transition-colors hover:bg-white/[0.02] ${i !== profiles.length - 1 ? "border-b border-border" : ""}`}>
            <span className="truncate font-mono text-[12px] text-text-primary">{p.proxyHost}</span><span className="font-mono text-[12px] text-text-secondary">{p.proxyPort}</span><span className="truncate font-mono text-[12px] text-text-secondary">{p.proxyUsername || "••••••••"}</span>
            <Badge tone={testing ? "neutral" : p.proxyStatus === "healthy" ? "healthy" : p.proxyStatus === "slow" ? "slow" : "failed"} dot>{testing ? "Testing…" : STATUS_LABEL[p.proxyStatus]}</Badge>
            <span className="font-mono text-[12px] text-text-secondary">{p.latencyMs > 0 ? `${p.latencyMs} ms` : "—"}</span><span className="truncate font-mono text-[12px] text-text-secondary">{p.externalIp}</span><span className="truncate text-text-secondary">{p.accountName}</span>
            <Button variant="ghost" size="sm" onClick={() => void testOne(p.id)} disabled={testing}>Test</Button>
          </div>;
        })}
      </div>
    </div>
  );
}
