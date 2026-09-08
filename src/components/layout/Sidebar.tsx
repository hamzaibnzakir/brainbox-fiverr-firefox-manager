import {
  LayoutGrid,
  Users,
  Waypoints,
  Radar,
  Activity as ActivityIcon,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type Route = "dashboard" | "profiles" | "proxy" | "proxy-tester" | "activity" | "settings";

const NAV: { id: Route; label: string; icon: typeof LayoutGrid }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "profiles", label: "Profiles", icon: Users },
  { id: "proxy", label: "Proxy Manager", icon: Waypoints },
  { id: "proxy-tester", label: "Proxy Tester", icon: Radar },
  { id: "activity", label: "Activity", icon: ActivityIcon },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar({
  route,
  onNavigate,
}: {
  route: Route;
  onNavigate: (r: Route) => void;
}) {
  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-[6px] bg-accent shadow-glow">
          <div className="h-2 w-2 rounded-sm bg-white" />
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-text-primary">
          Brainbox
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2 pt-2">
        {NAV.map((item) => {
          const active = item.id === route;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors duration-150 focus-ring",
                active
                  ? "bg-accent/10 text-text-primary"
                  : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
              )}
            >
              <Icon
                size={15}
                className={active ? "text-accent-soft" : "text-text-tertiary group-hover:text-text-secondary"}
              />
              {item.label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-text-secondary">Brainbox</p>
            <p className="text-[11px] text-text-tertiary">Version 1.1.1</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-status-healthy" />
            <span className="text-[11px] text-text-tertiary">Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
