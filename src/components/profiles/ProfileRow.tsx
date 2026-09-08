import { Play, Pencil, MoreHorizontal, Square } from "lucide-react";
import type { FirefoxProfile } from "@/types";
import { flagEmoji } from "@/lib/flag";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/DropdownMenu";
import { cn } from "@/lib/cn";

const STATUS_TONE = {
  ready: "healthy",
  running: "accent",
  stopped: "neutral",
  error: "failed",
} as const;

const STATUS_LABEL: Record<FirefoxProfile["status"], string> = {
  ready: "READY",
  running: "RUNNING",
  stopped: "STOPPED",
  error: "ERROR",
};

export function ProfileRow({
  profile,
  selected,
  onSelect,
  onEdit,
  onLaunch,
  onStop,
  onDuplicate,
  onDelete,
}: {
  profile: FirefoxProfile;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onLaunch: () => void;
  onStop: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const isRunning = profile.status === "running";

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group grid cursor-pointer grid-cols-[24px_1.3fr_0.9fr_0.7fr_0.5fr_0.9fr_1.3fr_0.9fr_auto] items-center gap-4 border-b border-border px-4 py-3 text-[13px] transition-colors duration-100",
        selected ? "bg-accent/[0.06]" : "hover:bg-white/[0.02]"
      )}
    >
      <span className="text-base leading-none">{flagEmoji(profile.countryCode)}</span>

      <div className="flex flex-col overflow-hidden">
        <span className="truncate font-medium text-text-primary">
          {profile.accountName}
        </span>
        <span className="truncate text-[11px] text-text-tertiary">
          {profile.countryName}
        </span>
      </div>

      <Badge tone={STATUS_TONE[profile.status]} dot>
        {STATUS_LABEL[profile.status]}
      </Badge>

      <span className="truncate font-mono text-[12px] text-text-secondary">
        {profile.proxyHost}
      </span>

      <span className="font-mono text-[12px] text-text-secondary">
        {profile.proxyPort}
      </span>

      <span className="truncate text-text-secondary">{profile.firefoxProfileName}</span>

      <span className="truncate text-text-secondary">{profile.targetWebsite}</span>

      <span className="truncate text-[12px] text-text-tertiary">
        {profile.lastLaunched}
      </span>

      <div
        className="flex items-center gap-1 opacity-0 transition-opacity duration-100 group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        {isRunning ? (
          <Button variant="secondary" size="sm" onClick={onStop}>
            <Square size={12} /> Stop
          </Button>
        ) : (
          <Button variant="primary" size="sm" onClick={onLaunch}>
            <Play size={12} /> Launch
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil size={12} /> Edit
        </Button>
        <DropdownMenu
          trigger={
            <Button variant="ghost" size="sm">
              <MoreHorizontal size={14} />
            </Button>
          }
        >
          <DropdownItem onSelect={onDuplicate}>Duplicate profile</DropdownItem>
          <DropdownItem onSelect={() => {}}>Copy proxy details</DropdownItem>
          <DropdownItem onSelect={() => {}}>View activity log</DropdownItem>
          <DropdownSeparator />
          <DropdownItem destructive onSelect={onDelete}>
            Delete profile
          </DropdownItem>
        </DropdownMenu>
      </div>
    </div>
  );
}
