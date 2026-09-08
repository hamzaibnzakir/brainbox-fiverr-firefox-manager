import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "healthy" | "slow" | "failed" | "accent";

const tones: Record<Tone, string> = {
  neutral: "bg-white/5 text-text-secondary border-border",
  healthy: "bg-status-healthy/10 text-status-healthy border-status-healthy/25",
  slow: "bg-status-slow/10 text-status-slow border-status-slow/25",
  failed: "bg-status-failed/10 text-status-failed border-status-failed/25",
  accent: "bg-accent/10 text-accent-soft border-accent/25",
};

export function Badge({
  tone = "neutral",
  children,
  dot = false,
}: {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[11px] font-medium tracking-wide",
        tones[tone]
      )}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "healthy" && "bg-status-healthy",
            tone === "slow" && "bg-status-slow",
            tone === "failed" && "bg-status-failed",
            tone === "accent" && "bg-accent",
            tone === "neutral" && "bg-text-tertiary"
          )}
        />
      )}
      {children}
    </span>
  );
}
