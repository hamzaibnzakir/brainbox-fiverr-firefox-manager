import type { ReactNode } from "react";

export function StatWidget({
  label,
  value,
  sublabel,
  icon,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-lg border border-border bg-surface px-4 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/[0.03] text-accent-soft">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[13px] text-text-secondary">{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-semibold tracking-tight text-text-primary">
            {value}
          </span>
          {sublabel && (
            <span className="text-[11px] text-text-tertiary">{sublabel}</span>
          )}
        </div>
      </div>
    </div>
  );
}
