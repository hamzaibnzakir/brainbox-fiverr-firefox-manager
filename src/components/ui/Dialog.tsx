import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  widthClass = "max-w-md",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  widthClass?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in" />
        <DialogPrimitive.Content
          className={`fixed left-1/2 top-1/2 z-50 w-full ${widthClass} -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface-raised shadow-panel animate-scale-in focus:outline-none`}
        >
          <div className="flex items-start justify-between border-b border-border px-5 py-4">
            <div>
              <DialogPrimitive.Title className="text-[15px] font-semibold text-text-primary">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-0.5 text-[13px] text-text-secondary">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close className="rounded-md p-1 text-text-tertiary transition-colors hover:bg-white/5 hover:text-text-primary focus-ring">
              <X size={16} />
            </DialogPrimitive.Close>
          </div>
          <div className="px-5 py-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
