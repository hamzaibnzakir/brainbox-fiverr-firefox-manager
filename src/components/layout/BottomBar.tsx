import { Play, RotateCw, Square } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function BottomBar({
  onStartAll,
  onRestartAll,
  onStopAll,
  autostart,
}: {
  onStartAll: () => void;
  onRestartAll: () => void;
  onStopAll: () => void;
  autostart: boolean;
}) {
  return (
    <footer className="flex h-12 shrink-0 items-center justify-between border-t border-border bg-surface px-6">
      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={onStartAll}>
          <Play size={13} /> Start All
        </Button>
        <Button variant="secondary" size="sm" onClick={onRestartAll}>
          <RotateCw size={13} /> Restart All
        </Button>
        <Button variant="danger" size="sm" onClick={onStopAll}>
          <Square size={13} /> Stop All
        </Button>
      </div>

      <div className="flex items-center gap-4 text-[12px] text-text-tertiary">
        <div className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              autostart ? "bg-status-healthy" : "bg-text-tertiary"
            }`}
          />
          Autostart {autostart ? "ON" : "OFF"}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-status-healthy" />
          Engine Online
        </div>
      </div>
    </footer>
  );
}
