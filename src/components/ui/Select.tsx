import { ChevronDown } from "lucide-react";

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; hint?: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-[13px] text-text-secondary">{label}</label>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full appearance-none rounded-md border border-border bg-surface px-3 pr-8 text-[13px] text-text-primary transition-colors duration-150 focus-ring focus:border-accent"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
              {opt.hint ? ` — ${opt.hint}` : ""}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
        />
      </div>
    </div>
  );
}
