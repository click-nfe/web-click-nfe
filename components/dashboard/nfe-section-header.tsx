import type { ReactNode } from "react";

export function NfeSectionHeader({
  step,
  title,
  summary,
  actions,
}: {
  step: number;
  title: string;
  summary: string;
  actions?: ReactNode;
}) {
  return (
    <>
      <header className="sticky top-36 z-20 rounded-t-2xl border-b border-border bg-card/95 px-5 py-3 shadow-sm backdrop-blur-xl sm:px-6 lg:top-20">
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">{step}</span>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Etapa {step}</p>
            <h2 className="truncate text-base font-semibold sm:text-lg">{title}</h2>
          </div>
          <p className="ml-auto hidden max-w-xs text-right text-xs text-muted-foreground xl:block">{summary}</p>
        </div>
      </header>
      {actions ? <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3 sm:px-6">{actions}</div> : null}
    </>
  );
}
