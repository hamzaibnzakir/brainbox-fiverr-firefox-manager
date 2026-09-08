import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert, ShieldCheck, Wifi, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { ProxyTestResult } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function countryName(code: string) {
  if (!code) return "Unknown";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

function flag(code: string) {
  if (!/^[A-Za-z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => 127397 + c.charCodeAt(0)));
}

function riskText(result: ProxyTestResult) {
  if (result.riskLevel === "low") return "Low risk";
  if (result.riskLevel === "medium") return "Medium risk";
  return "High risk";
}

export function ProxyTester() {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ProxyTestResult | null>(null);
  const [error, setError] = useState("");

  const canTest = host.trim().length > 0 && Number(port) > 0 && Number(port) <= 65535 && !testing;
  const country = useMemo(() => result ? countryName(result.countryCode) : "", [result]);

  async function runTest() {
    if (!canTest) return;
    setTesting(true);
    setError("");
    setResult(null);
    try {
      const data = await api.testStandaloneProxy({
        host: host.trim(),
        port: Number(port),
        username,
        password,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Proxy test failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight text-text-primary">Proxy Tester</h1>
        <p className="mt-0.5 text-[13px] text-text-secondary">Test a proxy before assigning it to a browser profile. No cloud API or account required.</p>
      </div>

      <div className="grid max-w-5xl grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-border bg-surface p-5">
          <div className="mb-5 flex items-center gap-2">
            <Wifi size={16} className="text-accent-soft" />
            <div>
              <h2 className="text-[14px] font-medium text-text-primary">Proxy credentials</h2>
              <p className="text-[11px] text-text-tertiary">Credentials are used for this test only and are not saved.</p>
            </div>
          </div>

          <div className="grid gap-4">
            <Input label="Proxy host" placeholder="154.3.233.91" value={host} onChange={(e) => setHost(e.target.value)} autoComplete="off" />
            <Input label="Port" placeholder="5369" type="number" min={1} max={65535} value={port} onChange={(e) => setPort(e.target.value)} />
            <Input label="Username" placeholder="Optional" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
            <Input label="Password" placeholder="Optional" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" onKeyDown={(e) => { if (e.key === "Enter") void runTest(); }} />
          </div>

          <Button className="mt-5 w-full justify-center" variant="primary" onClick={() => void runTest()} disabled={!canTest}>
            {testing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            {testing ? "Testing proxy…" : "Test Proxy"}
          </Button>

          <div className="mt-4 rounded-md border border-border bg-base/40 px-3 py-2.5 text-[11px] leading-5 text-text-tertiary">
            The test opens an HTTPS tunnel through the proxy to verify that it actually works. Country lookup uses a database bundled inside the app. The risk score is a local connection quality heuristic, not an abuse or fraud reputation score.
          </div>
        </section>

        <section className="min-h-[470px] rounded-lg border border-border bg-surface p-5">
          {!result && !error && !testing && (
            <div className="flex h-full min-h-[410px] flex-col items-center justify-center text-center">
              <ShieldCheck size={30} className="mb-3 text-text-tertiary" />
              <p className="text-[13px] font-medium text-text-secondary">Ready to inspect a proxy</p>
              <p className="mt-1 max-w-xs text-[11px] leading-5 text-text-tertiary">Enter the host, port and credentials, then run a local connectivity check.</p>
            </div>
          )}

          {testing && (
            <div className="flex h-full min-h-[410px] flex-col items-center justify-center text-center">
              <Loader2 size={28} className="mb-3 animate-spin text-accent-soft" />
              <p className="text-[13px] font-medium text-text-primary">Testing proxy tunnel</p>
              <p className="mt-1 text-[11px] text-text-tertiary">Checking authentication, HTTPS CONNECT and latency…</p>
            </div>
          )}

          {error && !testing && (
            <div className="rounded-md border border-status-failed/30 bg-status-failed/5 p-4">
              <div className="flex items-center gap-2 text-[13px] font-medium text-status-failed"><XCircle size={16} />Test error</div>
              <p className="mt-2 break-words text-[12px] text-text-secondary">{error}</p>
            </div>
          )}

          {result && !testing && (
            <div>
              <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  {result.ok ? <CheckCircle2 size={22} className="text-status-healthy" /> : <XCircle size={22} className="text-status-failed" />}
                  <div>
                    <p className="text-[14px] font-semibold text-text-primary">{result.ok ? "Connection successful" : "Connection failed"}</p>
                    <p className="text-[11px] text-text-tertiary">Local test completed</p>
                  </div>
                </div>
                <div className={`rounded-md border px-2.5 py-1 text-[11px] font-medium ${result.riskLevel === "low" ? "border-status-healthy/30 bg-status-healthy/10 text-status-healthy" : result.riskLevel === "medium" ? "border-status-slow/30 bg-status-slow/10 text-status-slow" : "border-status-failed/30 bg-status-failed/10 text-status-failed"}`}>
                  {result.riskScore}/100 · {riskText(result)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <Result label="Proxy IP" value={result.proxyIp || "Unknown"} mono />
                <Result label="Country" value={`${flag(result.countryCode)} ${country}`.trim()} />
                <Result label="Latency" value={`${result.latencyMs} ms`} mono />
                <Result label="HTTPS tunnel" value={result.httpsTunnel ? "Working" : "Failed"} />
                <Result label="Public IP" value={result.publicIp ? "Yes" : "No / unknown"} />
                <Result label="Analysis source" value="100% local" />
              </div>

              {result.error && (
                <div className="mt-5 rounded-md border border-status-failed/30 bg-status-failed/5 p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-status-failed">Failure reason</p>
                  <p className="mt-1 break-words text-[12px] text-text-secondary">{result.error}</p>
                </div>
              )}

              <div className="mt-5 rounded-md border border-border bg-base/40 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldAlert size={14} className="text-text-secondary" />
                  <p className="text-[11px] font-medium uppercase tracking-wide text-text-secondary">Local risk analysis</p>
                </div>
                {result.flags.length > 0 ? result.flags.map((item) => <p key={item} className="py-0.5 text-[12px] text-text-tertiary">• {item}</p>) : <p className="text-[12px] text-text-tertiary">No connection quality warnings detected.</p>}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Result({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">{label}</p>
      <p className={`mt-1 truncate text-[13px] text-text-primary ${mono ? "font-mono text-[12px]" : ""}`}>{value}</p>
    </div>
  );
}
