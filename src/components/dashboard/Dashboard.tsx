import { Users, UserCheck, ShieldCheck, Zap, Monitor } from "lucide-react";
import { StatWidget } from "./StatWidget";
import { useAppData } from "@/context/AppData";
import { Badge } from "@/components/ui/Badge";

export function Dashboard() {
  const { profiles, activity, engineOnline, platform } = useAppData();
  const active = profiles.filter((p) => p.status === "running").length;
  const healthyProxies = profiles.filter((p) => p.proxyStatus === "healthy").length;
  const autostartCount = profiles.filter((p) => p.launchOnStartup).length;
  const recent = activity.slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <div className="relative mb-8 flex items-start justify-between overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-[100px]"
        />
        <div className="relative">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Good evening, Brainbox
          </h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            Manage your Firefox identities and proxy infrastructure.
          </p>
        </div>
        <div className="relative flex flex-col items-end gap-2">
          <Badge tone={engineOnline ? "healthy" : "failed"} dot>
            {engineOnline ? "System Online" : "Engine Offline"}
          </Badge>
          <div className="flex items-center gap-1.5 text-[12px] text-text-tertiary">
            <Monitor size={13} />
            {platform}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatWidget
          label="Profiles"
          value={String(profiles.length)}
          icon={<Users size={16} />}
        />
        <StatWidget
          label="Active Profiles"
          value={String(active)}
          icon={<UserCheck size={16} />}
        />
        <StatWidget
          label="Healthy Proxies"
          value={String(healthyProxies)}
          sublabel={`of ${profiles.length}`}
          icon={<ShieldCheck size={16} />}
        />
        <StatWidget
          label="Autostart"
          value={autostartCount > 0 ? "Enabled" : "Disabled"}
          sublabel={`${autostartCount} profiles`}
          icon={<Zap size={16} />}
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-[13px] font-medium text-text-secondary">
          Recent activity
        </h2>
        <div className="rounded-lg border border-border bg-surface">
          {recent.map((event, i) => (
            <div
              key={event.id}
              className={`flex items-center justify-between px-4 py-2.5 text-[13px] ${
                i !== recent.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className="text-text-primary">
                {event.profileName && (
                  <span className="text-text-secondary">{event.profileName} — </span>
                )}
                {event.message}
              </span>
              <span className="text-[12px] text-text-tertiary">{event.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
