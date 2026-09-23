import { Check } from "lucide-react";

import type { NfeWorkflowStep } from "@/lib/api/import-process";

const defaultSteps: NfeWorkflowStep[] = [
  { key: "client", label: "Cliente", status: "current", can_view: true },
  { key: "duimp", label: "DUIMP", status: "blocked", can_view: false },
  { key: "context", label: "Contexto", status: "blocked", can_view: false },
  { key: "purposes", label: "Finalidades", status: "blocked", can_view: false },
  { key: "planning", label: "Plano", status: "blocked", can_view: false },
  { key: "drafts", label: "Rascunho", status: "blocked", can_view: false },
  { key: "xml", label: "XML", status: "blocked", can_view: false },
  { key: "review", label: "Conferência", status: "blocked", can_view: false },
];

export function NfeIssuanceStepper({
  steps = defaultSteps,
}: {
  steps?: NfeWorkflowStep[];
}) {
  return (
    <nav className="overflow-x-auto pb-2" aria-label="Etapas da emissão">
      <ol className="flex min-w-max items-start gap-2">
        {steps.map((step, index) => {
          const complete = step.status === "completed";
          const current = step.status === "current";
          return (
            <li key={step.key} className="flex items-center gap-2">
              <div
                className={`flex min-w-28 items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium ${
                  current
                    ? "border-primary bg-primary text-primary-foreground"
                    : complete
                      ? "border-primary/20 bg-sage-soft text-sage-strong"
                      : "border-border bg-card text-muted-foreground"
                }`}
                aria-current={current ? "step" : undefined}
              >
                <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs ${current ? "bg-white/20" : "bg-background/70"}`}>
                  {complete ? <Check size={14} strokeWidth={3} /> : index + 1}
                </span>
                {step.label}
              </div>
              {index < steps.length - 1 ? (
                <span className="h-px w-4 bg-border" aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
