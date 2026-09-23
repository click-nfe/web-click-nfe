"use client";

import { Hash, LoaderCircle, Save } from "lucide-react";
import { FormEvent, useState } from "react";

import { useDashboardSession } from "@/components/dashboard/dashboard-session-context";
import { Sheet } from "@/components/ui/sheet";
import type { NfeNumberSequence } from "@/lib/api/nfe-number-sequence";
import { bffErrorMessage } from "@/lib/bff/client";
import { upsertNfeNumberSequence } from "@/lib/bff/nfe-number-sequence";

export function NfeNumberSequenceSheet({
  open,
  onOpenChange,
  clientId,
  sequence,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  sequence?: NfeNumberSequence;
  onSaved: (sequence: NfeNumberSequence) => void;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Sequência de numeração NF-e"
      description="Defina a série e o intervalo usado para reservar os próximos números do modelo 55 em produção."
    >
      {open ? (
        <NfeNumberSequenceForm
          clientId={clientId}
          sequence={sequence}
          onCancel={() => onOpenChange(false)}
          onSaved={(saved) => {
            onSaved(saved);
            onOpenChange(false);
          }}
        />
      ) : null}
    </Sheet>
  );
}

function NfeNumberSequenceForm({
  clientId,
  sequence,
  onCancel,
  onSaved,
}: {
  clientId: string;
  sequence?: NfeNumberSequence;
  onCancel: () => void;
  onSaved: (sequence: NfeNumberSequence) => void;
}) {
  const { user } = useDashboardSession();
  const [series, setSeries] = useState(sequence?.series ?? "1");
  const [initialNumber, setInitialNumber] = useState(String(sequence?.initial_number ?? 1));
  const [maxNumber, setMaxNumber] = useState(String(sequence?.max_number ?? 999999999));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const initial = Number(initialNumber);
    const maximum = Number(maxNumber);
    if (!series.trim() || !Number.isInteger(initial) || !Number.isInteger(maximum) || initial < 1 || maximum < initial) {
      setError("Revise a série e o intervalo de numeração.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const saved = await upsertNfeNumberSequence(clientId, {
        environment: "production",
        model: "55",
        series: series.trim(),
        initial_number: initial,
        max_number: maximum,
        status: "active",
        ...(sequence ? {} : { current_number: initial - 1 }),
      });
      onSaved(saved);
    } catch (requestError) {
      setError(bffErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
      <form onSubmit={submit} className="mt-7 space-y-6">
        <div className="rounded-2xl border border-primary/15 bg-sage-soft p-5 text-sm text-sage-strong">
          <div className="flex gap-3">
            <Hash className="mt-0.5 shrink-0" size={18} />
            <p>
              {sequence
                ? `O último número registrado é ${sequence.current_number}. A edição preserva o contador atual para evitar regressões.`
                : "O primeiro número disponível será o número inicial informado abaixo."}
            </p>
          </div>
        </div>

        {user.role !== "admin" ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            Apenas administradores podem configurar a sequência fiscal.
          </div>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <label>
            <span className="field-label">Ambiente</span>
            <input className="field-input" value="Produção" disabled />
          </label>
          <label>
            <span className="field-label">Modelo</span>
            <input className="field-input" value="55 — NF-e" disabled />
          </label>
          <label>
            <span className="field-label">Série *</span>
            <input className="field-input" value={series} onChange={(event) => setSeries(event.target.value)} required maxLength={3} disabled={Boolean(sequence)} />
            {sequence ? <span className="mt-1.5 block text-xs text-muted-foreground">A série existente não pode ser trocada durante a edição.</span> : null}
          </label>
          {sequence ? (
            <label>
              <span className="field-label">Número atual</span>
              <input className="field-input" value={sequence.current_number} disabled />
            </label>
          ) : null}
          <label>
            <span className="field-label">Número inicial *</span>
            <input className="field-input" type="number" min={1} max={999999999} value={initialNumber} onChange={(event) => setInitialNumber(event.target.value)} required />
          </label>
          <label>
            <span className="field-label">Número máximo *</span>
            <input className="field-input" type="number" min={1} max={999999999} value={maxNumber} onChange={(event) => setMaxNumber(event.target.value)} required />
          </label>
        </div>

        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}

        <div className="flex justify-end gap-3 border-t border-border pt-5">
          <button type="button" className="button button-secondary" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="button button-primary" disabled={saving || user.role !== "admin"}>
            {saving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}
            {saving ? "Salvando..." : "Salvar sequência"}
          </button>
        </div>
      </form>
  );
}
