import {
  Play,
  ShieldCheck,
  Globe,
  FileCheck2,
  Square,
  AlertTriangle,
} from "lucide-react";
import { useAppData } from "@/context/AppData";
import type { ActivityKind } from "@/types";
import { cn } from "@/lib/cn";

const ICONS: Record<ActivityKind, typeof Play> = {
  launch: Play,
  auth: ShieldCheck,
  "browser-open": Globe,
  "page-load": FileCheck2,
  stop: Square,
  error: AlertTriangle,
};

const TONE: Record<ActivityKind, string> = {
  launch: "text-accent-soft bg-accent/10",
  auth: "text-status-healthy bg-status-healthy/10",
  "browser-open": "text-text-secondary bg-white/5",
  "page-load": "text-status-healthy bg-status-healthy/10",
  stop: "text-text-tertiary bg-white/5",
  error: "text-status-failed bg-status-failed/10",
};

export function ActivityPage() {
  const { activity } = useAppData();
  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <h1 className="text-lg font-semibold tracking-tight text-text-primary">
        Activity
      </h1>
      <p className="mt-0.5 text-[13px] text-text-secondary">
        A timeline of what your profiles have been doing.
      </p>

      <div className="relative mt-6 flex flex-col">
        {activity.map((event, i) => {
          const Icon = ICONS[event.kind];
          return (
            <div key={event.id} className="relative flex gap-3 pb-6 last:pb-0">
              {i !== activity.length - 1 && (
                <span className="absolute left-[15px] top-8 h-full w-px bg-border" />
              )}
              <div
                className={cn(
                  "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                  TONE[event.kind]
                )}
              >
                <Icon size={14} />
              </div>
              <div className="flex flex-1 items-center justify-between pt-1">
                <div>
                  <p className="text-[13px] text-text-primary">
                    {event.profileName && (
                      <span className="font-medium">{event.profileName}</span>
                    )}{" "}
                    <span className="text-text-secondary">{event.message}</span>
                  </p>
                </div>
                <span className="shrink-0 text-[12px] text-text-tertiary">
                  {event.timestamp}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
