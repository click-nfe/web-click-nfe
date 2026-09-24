"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileStack,
  LoaderCircle,
  PencilLine,
  RefreshCw,
  Save,
} from "lucide-react";
import { FormEvent, useState } from "react";
import useSWR from "swr";

import { Sheet } from "@/components/ui/sheet";
import { NfeDraftReviewPanel } from "@/components/dashboard/nfe-draft-review";
import type { ImportPurpose } from "@/lib/api/client-import-tax-rule";
import type {
  NfeDocumentPlan,
  NfeDocumentPlanState,
  NfePlannedDocument,
  NfeSharedCosts,
} from "@/lib/api/import-process";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import {
  createNfeDocumentPlan,
  nfeDocumentPlanUrl,
} from "@/lib/bff/import-process";

const purposeLabels: Record<ImportPurpose, string> = {
  resale: "Revenda",
  industrialization: "Industrialização",
  fixed_asset: "Ativo imobilizado",
  use_consumption: "Uso e consumo",
};

const costFields = [
  { key: "afrmm", label: "AFRMM" },
  { key: "siscomex_fee", label: "Taxa Siscomex" },
  { key: "thc", label: "THC" },
  { key: "other", label: "Outras despesas" },
] as const;

type CostValues = Record<(typeof costFields)[number]["key"], string>;

const emptyCosts: CostValues = {
  afrmm: "",
  siscomex_fee: "",
  thc: "",
  other: "",
};

function formatMoney(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(amount) ? amount : 0);
}

function supplierName(document: NfePlannedDocument) {
  return document.foreign_supplier?.name
    || document.foreign_supplier?.legal_name
    || document.exporter_code
    || "Exportador não identificado";
}

export function NfeDocumentPlanPanel({
  processId,
  snapshotId,
  requiresRebuild = false,
  onWorkflowChange,
}: {
  processId: string;
  snapshotId: string;
  requiresRebuild?: boolean;
  onWorkflowChange: () => Promise<unknown>;
}) {
  const url = nfeDocumentPlanUrl(processId, snapshotId);
  const { data, error, isLoading, mutate } = useSWR<NfeDocumentPlanState>(url, bffFetcher);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [costs, setCosts] = useState<CostValues>(emptyCosts);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function openEditor() {
    // A API devolve os custos já resolvidos, sem distinguir automáticos de
    // substituições manuais. Manter os campos vazios preserva os automáticos.
    setCosts(emptyCosts);
    setActionError(null);
    setSheetOpen(true);
  }

  async function retryLoad() {
    setActionError(null);
    await mutate();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const additionalCosts: NfeSharedCosts = {};
    for (const field of costFields) {
      const rawValue = costs[field.key].trim();
      if (!rawValue) continue;
      const normalized = rawValue.replace(",", ".");
      if (!Number.isFinite(Number(normalized)) || Number(normalized) < 0) {
        setActionError(`Informe um valor válido para ${field.label}.`);
        return;
      }
      additionalCosts[field.key] = normalized;
    }

    setSaving(true);
    setActionError(null);
    try {
      const plan = await createNfeDocumentPlan(processId, {
        duimp_snapshot_id: snapshotId,
        additional_costs: additionalCosts,
      });
      await mutate(
        { process_id: processId, snapshot_id: snapshotId, plan },
        { revalidate: false },
      );
      setSheetOpen(false);
      await onWorkflowChange();
    } catch (requestError) {
      setActionError(bffErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  const plan = requiresRebuild ? null : data?.plan ?? null;

  return (
    <>
      <section id="plano-de-notas" className="surface-card mt-6 scroll-mt-24 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <p className="eyebrow">Etapa 5</p>
            <h2 className="mt-2 text-2xl font-semibold">Plano de notas</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              A API separa uma NF-e por exportador e rateia as despesas compartilhadas pelo valor aduaneiro de cada item.
            </p>
          </div>
          {plan ? (
            <button type="button" className="button button-secondary" onClick={openEditor}>
              <PencilLine size={16} /> Recalcular despesas
            </button>
          ) : null}
        </div>

        {error && !data ? (
          <div className="p-8 text-center">
            <p className="text-sm text-destructive">{bffErrorMessage(error)}</p>
            <button type="button" className="button button-secondary mt-4" onClick={retryLoad}>
              <RefreshCw size={16} /> Tentar novamente
            </button>
          </div>
        ) : isLoading && !data ? (
          <div className="grid gap-4 p-6 sm:grid-cols-3" aria-label="Carregando plano de notas">
            {[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : !plan ? (
          <div className="p-6 sm:p-8">
            <div className="rounded-2xl border border-primary/20 bg-sage-soft p-5 text-sage-strong">
              <div className="flex items-start gap-3">
                <FileStack className="mt-0.5 shrink-0" size={21} />
                <div>
                  <p className="font-semibold">{requiresRebuild ? "As classificações mudaram; recalcule o plano" : "Itens classificados e prontos para planejamento"}</p>
                  <p className="mt-1 text-sm">
                    {requiresRebuild ? "O plano anterior não será reutilizado porque pode conter finalidades, CFOPs ou rateios desatualizados." : "Será criada uma Master apenas gerencial e uma NF-e filha para cada exportador encontrado na DUIMP."}
                  </p>
                </div>
              </div>
              <button type="button" className="button button-primary mt-5" onClick={openEditor}>
                <FileStack size={16} /> {requiresRebuild ? "Recalcular plano" : "Montar plano de notas"}
              </button>
            </div>
          </div>
        ) : (
          <PlanSummary plan={plan} />
        )}

        {actionError && !sheetOpen ? (
          <p className="mx-6 mb-6 text-sm text-destructive" role="alert">{actionError}</p>
        ) : null}
      </section>

      {plan ? (
        <NfeDraftReviewPanel
          processId={processId}
          snapshotId={snapshotId}
          plan={plan}
          onPlanChange={async (nextPlan) => {
            await mutate(
              { process_id: processId, snapshot_id: snapshotId, plan: nextPlan },
              { revalidate: false },
            );
          }}
          onPlanRefresh={() => mutate()}
          onWorkflowChange={onWorkflowChange}
        />
      ) : null}

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={plan ? "Recalcular plano de notas" : "Montar plano de notas"}
        description="Valores informados substituem as referências automáticas. Campos vazios usam dados da DUIMP e os padrões das regras tributárias."
      >
        <form onSubmit={submit} className="mt-7 space-y-5">
          <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            O rateio é feito em centavos e a eventual diferença de arredondamento fica no item de maior valor aduaneiro, garantindo reconciliação exata.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {costFields.map((field) => (
              <label key={field.key}>
                <span className="field-label">{field.label}</span>
                <input
                  className="field-input"
                  inputMode="decimal"
                  value={costs[field.key]}
                  placeholder="Usar valor automático"
                  disabled={saving}
                  onChange={(event) => setCosts((current) => ({
                    ...current,
                    [field.key]: event.target.value,
                  }))}
                />
              </label>
            ))}
          </div>

          {actionError ? <p className="text-sm text-destructive" role="alert">{actionError}</p> : null}
          <div className="flex justify-end gap-3 border-t border-border pt-5">
            <button type="button" className="button button-secondary" disabled={saving} onClick={() => setSheetOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="button button-primary" disabled={saving}>
              {saving ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}
              {saving ? "Calculando..." : plan ? "Recalcular plano" : "Criar plano"}
            </button>
          </div>
        </form>
      </Sheet>
    </>
  );
}

function PlanSummary({ plan }: { plan: NfeDocumentPlan }) {
  const balanced = plan.reconciliation.balanced === true;
  return (
    <div className="p-5 sm:p-7">
      <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${balanced ? "border-primary/20 bg-sage-soft text-sage-strong" : "border-amber-400/35 bg-amber-500/5 text-amber-800 dark:text-amber-300"}`}>
        {balanced ? <CheckCircle2 className="mt-0.5 shrink-0" size={20} /> : <AlertTriangle className="mt-0.5 shrink-0" size={20} />}
        <div>
          <p className="font-semibold">{balanced ? "Plano reconciliado" : "O rateio precisa de revisão"}</p>
          <p className="mt-1">
            Versão {plan.version_number} · {plan.documents.length} NF-e filha(s) · {plan.totals.items_count ?? 0} item(ns).
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TotalCard label="Valor aduaneiro" value={plan.totals.customs_value} />
        <TotalCard label="Despesas rateadas" value={plan.totals.shared_costs} />
        <TotalCard label="Total planejado" value={plan.totals.planned_value} />
        <div className="rounded-2xl border border-border p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Master</dt>
          <dd className="mt-2 font-semibold">Somente gerencial</dd>
          <p className="mt-1 text-xs text-muted-foreground">Sem número, chave ou XML fiscal.</p>
        </div>
      </dl>

      <div className="mt-7 space-y-4">
        {plan.documents.map((document) => <DocumentCard key={document.id} document={document} />)}
      </div>

      <a href="#rascunhos-nfe" className="button button-primary mt-7">Ir para os rascunhos</a>
    </div>
  );
}

function TotalCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-border p-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-2 text-lg font-semibold">{formatMoney(value)}</dd>
    </div>
  );
}

function DocumentCard({ document }: { document: NfePlannedDocument }) {
  return (
    <article className="rounded-2xl border border-border">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">NF-e filha {document.ordinal}</p>
          <h3 className="mt-2 text-lg font-semibold">{supplierName(document)}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {document.exporter_code ? `Exportador ${document.exporter_code} · ` : ""}{document.items_count} item(ns)
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total planejado</p>
          <p className="mt-1 text-lg font-semibold">{formatMoney(document.totals.planned_value)}</p>
        </div>
      </div>

      <div className="grid gap-4 border-t border-border bg-muted/25 p-5 sm:grid-cols-3">
        <div><p className="text-xs text-muted-foreground">Natureza da operação</p><p className="mt-1 text-sm font-medium">{document.operation_nature}</p></div>
        <div><p className="text-xs text-muted-foreground">Valor aduaneiro</p><p className="mt-1 text-sm font-medium">{formatMoney(document.customs_value)}</p></div>
        <div><p className="text-xs text-muted-foreground">Despesas rateadas</p><p className="mt-1 text-sm font-medium">{formatMoney(document.totals.shared_costs)}</p></div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border px-5 py-4">
        {document.item_purposes.map((purpose) => (
          <span key={purpose} className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
            {purposeLabels[purpose]}
          </span>
        ))}
        {document.mixed_import_purposes ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/55 dark:text-amber-200">Finalidades mistas</span> : null}
      </div>

      <details className="border-t border-border px-5 py-4">
        <summary className="cursor-pointer text-sm font-semibold">Ver itens e rateio</summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-2xl text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="pb-3">Item</th><th className="pb-3">Finalidade</th><th className="pb-3">CFOP</th><th className="pb-3 text-right">Valor aduaneiro</th><th className="pb-3 text-right">Despesas</th></tr></thead>
            <tbody className="divide-y divide-border">
              {document.items.map((item) => {
                const allocated = Object.values(item.allocated_shared_costs).reduce((total, value) => total + Number(value || 0), 0);
                return <tr key={item.id}><td className="py-3 font-semibold">{item.duimp_item_number}</td><td className="py-3">{purposeLabels[item.import_purpose]}</td><td className="py-3 font-mono text-xs">{item.cfop}</td><td className="py-3 text-right">{formatMoney(item.customs_value)}</td><td className="py-3 text-right">{formatMoney(allocated)}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </details>
    </article>
  );
}
