import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

export function Tooltip({
  children,
  label,
  shortcut,
}: {
  children: ReactNode;
  label: string;
  shortcut?: string;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="bottom"
          sideOffset={6}
          className="z-50 flex items-center gap-2 rounded-md border border-border bg-surface-overlay px-2 py-1 text-xs text-text-primary shadow-panel animate-fade-in"
        >
          {label}
          {shortcut && (
            <kbd className="rounded border border-border-strong bg-white/5 px-1 py-0.5 font-mono text-[10px] text-text-tertiary">
              {shortcut}
            </kbd>
          )}
          <TooltipPrimitive.Arrow className="fill-surface-overlay" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
