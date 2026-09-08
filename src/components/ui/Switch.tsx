import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-[13px] text-text-primary">{label}</span>}
          {description && (
            <span className="text-xs text-text-tertiary">{description}</span>
          )}
        </div>
      )}
      <SwitchPrimitive.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full border transition-colors duration-150 focus-ring",
          checked ? "bg-accent border-accent" : "bg-white/10 border-border"
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "block h-3.5 w-3.5 translate-x-0.5 rounded-full bg-white transition-transform duration-150",
            checked && "translate-x-[18px]"
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  );
}
