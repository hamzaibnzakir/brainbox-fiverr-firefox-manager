import * as SliderPrimitive from "@radix-ui/react-slider";

export function Slider({
  value,
  onChange,
  min = 0,
  max = 30,
  step = 1,
  suffix = "s",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <SliderPrimitive.Root
        className="relative flex h-4 w-full touch-none select-none items-center"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      >
        <SliderPrimitive.Track className="relative h-1 grow rounded-full bg-white/10">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-accent" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-3.5 w-3.5 rounded-full border-2 border-accent bg-white shadow-glow focus-ring" />
      </SliderPrimitive.Root>
      <span className="w-12 shrink-0 text-right font-mono text-[13px] text-text-secondary">
        {value}
        {suffix}
      </span>
    </div>
  );
}
