import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string }
>(({ className, label, id, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label htmlFor={id} className="text-[13px] text-text-secondary">
        {label}
      </label>
    )}
    <input
      ref={ref}
      id={id}
      className={cn(
        "h-9 w-full rounded-md border border-border bg-surface px-3 text-[13px] text-text-primary placeholder:text-text-tertiary transition-colors duration-150 focus-ring focus:border-accent",
        className
      )}
      {...props}
    />
  </div>
));
Input.displayName = "Input";
