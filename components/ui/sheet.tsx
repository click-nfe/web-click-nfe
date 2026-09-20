"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-end sm:items-stretch">
          <Dialog.Popup className="flex max-h-[94dvh] w-full flex-col rounded-t-3xl border border-border bg-background shadow-2xl outline-none transition duration-200 data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full sm:max-h-none sm:max-w-3xl sm:rounded-none sm:border-y-0 sm:border-r-0 sm:data-[ending-style]:translate-x-full sm:data-[ending-style]:translate-y-0 sm:data-[starting-style]:translate-x-full sm:data-[starting-style]:translate-y-0">
            <div className="flex shrink-0 items-start justify-between gap-5 border-b border-border px-5 py-5 sm:px-7">
              <div>
                <Dialog.Title className="text-xl font-semibold">{title}</Dialog.Title>
                {description ? (
                  <Dialog.Description className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {description}
                  </Dialog.Description>
                ) : null}
              </div>
              <Dialog.Close
                className="grid size-10 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Fechar painel"
              >
                <X size={18} />
              </Dialog.Close>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 sm:px-7">
              {children}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
