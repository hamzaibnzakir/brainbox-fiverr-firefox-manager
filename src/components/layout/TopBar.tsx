import { Command, Bell } from "lucide-react";
import type { Route } from "./Sidebar";

const TITLES: Record<Route, string> = {
  dashboard: "Dashboard",
  profiles: "Browser Profiles",
  proxy: "Proxy Manager",
  activity: "Activity",
  settings: "Settings",
};

export function TopBar({ route }: { route: Route }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-base px-6">
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium text-text-secondary">
          Brainbox
        </span>
        <span className="text-[13px] text-text-tertiary">/</span>
        <span className="text-[13px] font-medium text-text-primary">
          {TITLES[route]}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-[12px] text-text-tertiary transition-colors hover:border-border-strong hover:text-text-secondary focus-ring">
          <Command size={13} />
          <span>Quick actions</span>
          <kbd className="rounded border border-border-strong bg-white/5 px-1 font-mono text-[10px]">
            K
          </kbd>
        </button>
        <button className="relative rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-white/5 hover:text-text-secondary focus-ring">
          <Bell size={16} />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>
      </div>
    </header>
  );
}
