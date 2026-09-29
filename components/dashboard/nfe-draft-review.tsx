"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Files,
  ExternalLink,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";

import { Sheet } from "@/components/ui/sheet";
import type {
  NfeDocumentPlan,
  NfeDraftDetail,
  NfeDraftSummary,
  NfePlannedDocument,
  NfeValidationIssue,
} from "@/lib/api/import-process";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import {
  generateNfeChildDrafts,
  nfeDraftUrl,
  validateNfeDraft,
} from "@/lib/bff/import-process";

type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function objects(value: unknown): JsonObject[] {
  return Array.isArray(value) ? value.filter((item): item is JsonObject => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function display(value: unknown, fallback = "Não informado") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function formatMoney(value: unknown) {
  if (value === null || value === undefined || value === "") return "Não informado";
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)
    : display(value);
}

function supplierName(document: NfePlannedDocument) {
  return document.foreign_supplier?.name
    || document.foreign_supplier?.legal_name
    || document.exporter_code
    || `NF-e filha ${document.ordinal}`;
}

function issueText(issue: NfeValidationIssue) {
  return issue.message || issue.code || issue.field || "Validação pendente";
}

const statusLabels: Record<string, string> = {
  ready_for_xml: "Pronto para XML",
  validation_failed: "Correção necessária",
  draft: "Em elaboração",
  xml_generated: "XML gerado",
  signed: "Assinado",
};

export function NfeDraftReviewPanel({
  processId,
  snapshotId,
  plan,
  onPlanChange,
  onPlanRefresh,
  onWorkflowChange,
}: {
  processId: string;
  snapshotId: string;
  plan: NfeDocumentPlan;
  onPlanChange: (plan: NfeDocumentPlan) => Promise<unknown>;
  onPlanRefresh: () => Promise<unknown>;
  onWorkflowChange: () => Promise<unknown>;
}) {
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<{ id: string; title: string } | null>(null);
  const drafted = plan.documents.filter((document) => document.draft);

  useEffect(() => {
    let refreshing = false;
    async function refresh() {
      if (refreshing) return;
      refreshing = true;
      try {
        await Promise.all([onPlanRefresh(), onWorkflowChange()]);
      } finally {
        refreshing = false;
      }
    }
    const onStorage = (event: StorageEvent) => {
      if (event.key === "click-nfe:draft-updated") void refresh();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [onPlanRefresh, onWorkflowChange]);

  async function generate() {
    setGenerating(true);
    setActionError(null);
    try {
      const result = await generateNfeChildDrafts(processId, snapshotId);
      await onPlanChange(result.plan);
      await onWorkflowChange();
    } catch (error) {
      setActionError(bffErrorMessage(error));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <section id="rascunhos-nfe" className="surface-card mt-6 scroll-mt-24 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <p className="eyebrow">Etapa 6</p>
            <h2 className="mt-2 text-2xl font-semibold">Rascunhos das NF-e filhas</h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Gere um rascunho independente para cada exportador e confira os dados fiscais antes de reservar a numeração ou produzir XML.
            </p>
          </div>
          {drafted.length < plan.documents.length ? (
            <button type="button" className="button button-primary" disabled={generating} onClick={generate}>
              {generating ? <LoaderCircle className="animate-spin" size={16} /> : <Files size={16} />}
              {generating ? "Gerando..." : drafted.length ? "Gerar pendentes" : "Gerar rascunhos"}
            </button>
          ) : null}
        </div>

        {!drafted.length ? (
          <div className="p-6 sm:p-8">
            <div className="rounded-2xl border border-primary/20 bg-sage-soft p-5 text-sage-strong">
              <div className="flex items-start gap-3">
                <FileCheck2 className="mt-0.5 shrink-0" size={21} />
                <div>
                  <p className="font-semibold">Plano pronto para materializar as notas filhas</p>
                  <p className="mt-1 text-sm">A Master permanece apenas gerencial. Nenhum número, chave de acesso ou XML será criado neste checkpoint.</p>
                </div>
              </div>
              <button type="button" className="button button-primary mt-5" disabled={generating} onClick={generate}>
                {generating ? <LoaderCircle className="animate-spin" size={16} /> : <Files size={16} />}
                {generating ? "Gerando rascunhos..." : `Gerar ${plan.documents.length} rascunho(s)`}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-5 sm:p-7">
            <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${plan.progress.all_drafts_created ? "border-primary/20 bg-sage-soft text-sage-strong" : "border-amber-400/35 bg-amber-500/5 text-amber-800 dark:text-amber-300"}`}>
              {plan.progress.all_drafts_created ? <CheckCircle2 className="mt-0.5 shrink-0" size={20} /> : <AlertTriangle className="mt-0.5 shrink-0" size={20} />}
              <div><p className="font-semibold">{plan.progress.all_drafts_created ? "Todos os rascunhos foram gerados" : "Ainda há rascunhos pendentes"}</p><p className="mt-1">{drafted.length} de {plan.documents.length} NF-e filha(s) disponível(is) para conferência.</p></div>
            </div>

            {plan.documents.map((document) => (
              <DraftCard
                key={document.id}
                document={document}
                processId={processId}
                onOpen={(draft) => setSelectedDraft({ id: draft.id, title: supplierName(document) })}
              />
            ))}

            {plan.progress.all_drafts_created ? (
              <div className="rounded-2xl border border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                O próximo checkpoint será a reserva controlada da numeração, geração das chaves de acesso e XMLs individuais. A transmissão à SEFAZ continua bloqueada.
              </div>
            ) : null}
          </div>
        )}

        {actionError ? <p className="mx-6 mb-6 text-sm text-destructive" role="alert">{actionError}</p> : null}
      </section>

      <DraftReviewSheet
        draft={selectedDraft}
        processId={processId}
        onClose={() => setSelectedDraft(null)}
        onValidated={async () => {
          await Promise.all([onPlanRefresh(), onWorkflowChange()]);
        }}
      />
    </>
  );
}

function DraftCard({ document, processId, onOpen }: { document: NfePlannedDocument; processId: string; onOpen: (draft: NfeDraftSummary) => void }) {
  const draft = document.draft;
  if (!draft) {
    return <article className="flex items-center justify-between gap-4 rounded-2xl border border-dashed border-border p-5"><div><p className="font-semibold">NF-e filha {document.ordinal} · {supplierName(document)}</p><p className="mt-1 text-sm text-muted-foreground">Aguardando geração do rascunho.</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Pendente</span></article>;
  }
  const errors = draft.validation_errors ?? [];
  const warnings = draft.validation_warnings ?? [];
  const valid = !errors.length;
  return (
    <article className="rounded-2xl border border-border">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          {valid ? <CheckCircle2 className="mt-0.5 shrink-0 text-primary" size={21} /> : <ShieldAlert className="mt-0.5 shrink-0 text-amber-600" size={21} />}
          <div><p className="font-semibold">NF-e filha {document.ordinal} · {supplierName(document)}</p><p className="mt-1 text-sm text-muted-foreground">{document.items_count} item(ns) · Série {draft.series} · {statusLabels[draft.status] ?? draft.status}</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="button button-secondary" onClick={() => onOpen(draft)}><Search size={16} /> Consultar</button>
          <Link href={`/dashboard/processos/${processId}/rascunhos/${draft.id}`} target="_blank" className="button button-primary"><ExternalLink size={16} /> Configurar nota</Link>
        </div>
      </div>
      {errors.length || warnings.length ? (
        <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3 text-xs">
          {errors.length ? <span className="rounded-full bg-red-100 px-3 py-1 font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">{errors.length} erro(s)</span> : null}
          {warnings.length ? <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">{warnings.length} aviso(s)</span> : null}
        </div>
      ) : null}
    </article>
  );
}

function DraftReviewSheet({
  draft,
  processId,
  onClose,
  onValidated,
}: {
  draft: { id: string; title: string } | null;
  processId: string;
  onClose: () => void;
  onValidated: () => Promise<unknown>;
}) {
  const request = useSWR<NfeDraftDetail>(draft ? nfeDraftUrl(draft.id) : null, bffFetcher);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  async function validate() {
    if (!draft) return;
    setValidating(true);
    setValidationError(null);
    try {
      await validateNfeDraft(draft.id);
      await request.mutate();
      await onValidated();
    } catch (error) {
      setValidationError(bffErrorMessage(error));
    } finally {
      setValidating(false);
    }
  }

  return (
    <Sheet open={Boolean(draft)} onOpenChange={(open) => { if (!open) onClose(); }} title={`Revisar rascunho · ${draft?.title ?? "NF-e filha"}`} description="Confira a origem de cada dado e as validações antes de avançar para numeração e XML.">
      {request.error ? (
        <div className="mt-8 text-center"><p className="text-sm text-destructive">{bffErrorMessage(request.error)}</p><button type="button" className="button button-secondary mt-4" onClick={() => request.mutate()}><RefreshCw size={16} /> Tentar novamente</button></div>
      ) : request.isLoading || !request.data ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" size={18} /> Carregando rascunho...</div>
      ) : (
        <DraftDetails detail={request.data} />
      )}

      {validationError ? <p className="mt-5 text-sm text-destructive" role="alert">{validationError}</p> : null}
      {request.data ? (
        <div className="sticky bottom-0 mt-7 flex justify-end gap-3 border-t border-border bg-background py-4">
          <button type="button" className="button button-secondary" onClick={onClose}>Fechar</button>
          {draft ? <Link href={`/dashboard/processos/${processId}/rascunhos/${draft.id}`} target="_blank" className="button button-secondary"><ExternalLink size={16} /> Configurar nota</Link> : null}
          <button type="button" className="button button-primary" disabled={validating} onClick={validate}>{validating ? <LoaderCircle className="animate-spin" size={16} /> : <RefreshCw size={16} />}{validating ? "Validando..." : "Revalidar rascunho"}</button>
        </div>
      ) : null}
    </Sheet>
  );
}

function DraftDetails({ detail }: { detail: NfeDraftDetail }) {
  const payload = object(detail.draft.fiscal_payload);
  const document = object(payload.document);
  const issuer = object(payload.issuer);
  const supplier = object(payload.recipient);
  const supplierAddress = object(supplier.address);
  const transport = object(payload.transport);
  const carrier = object(transport.carrier);
  const volume = object(transport.volume);
  const volumes = objects(transport.volumes);
  const costs = object(payload.additional_costs);
  const errors = detail.draft.validation_errors || [];
  const warnings = detail.draft.validation_warnings || [];

  return (
    <div className="mt-7 space-y-5">
      <div className={`rounded-2xl border p-4 text-sm ${errors.length ? "border-red-500/25 bg-red-500/5 text-red-700 dark:text-red-300" : "border-primary/20 bg-sage-soft text-sage-strong"}`}>
        <p className="font-semibold">{errors.length ? "O rascunho precisa de correções" : "Rascunho fiscalmente consistente"}</p>
        <p className="mt-1">{errors.length} erro(s) e {warnings.length} aviso(s) encontrados.</p>
      </div>

      {errors.length || warnings.length ? <IssueList errors={errors} warnings={warnings} /> : null}

      <ReviewSection title="Documento">
        <InfoGrid fields={[["Natureza da operação", document.operation_nature], ["Modelo", document.model ?? detail.draft.model], ["Série", document.series ?? detail.draft.series], ["Ambiente", "Produção"], ["Presença", document.presence_indicator], ["Intermediador", document.intermediary_indicator]]} />
      </ReviewSection>

      <ReviewSection title="Emitente e fornecedor estrangeiro">
        <InfoGrid fields={[["Emitente", issuer.legal_name ?? issuer.name], ["CNPJ", issuer.cnpj ?? issuer.tax_id], ["Inscrição estadual", issuer.state_registration], ["Fornecedor", supplier.legal_name ?? supplier.name], ["Identificação estrangeira", supplier.foreign_id ?? supplier.foreign_tax_id], ["País", supplierAddress.country_name ?? supplierAddress.country_code]]} />
      </ReviewSection>

      <ReviewSection title="Transporte e volumes">
        <InfoGrid fields={[["Modalidade do frete", transport.freight_mode], ["Transportadora", carrier.name], ["Documento", carrier.tax_id], ["Volumes", volume.quantity ?? (volumes.length || transport.volumes_quantity)], ["Espécie", volume.species], ["Peso líquido", volume.net_weight ?? transport.net_weight], ["Peso bruto", volume.gross_weight ?? transport.gross_weight]]} />
      </ReviewSection>

      <ReviewSection title="Custos adicionais">
        <InfoGrid fields={[["AFRMM", formatMoney(costs.afrmm)], ["Taxa Siscomex", formatMoney(costs.siscomex_fee)], ["THC", formatMoney(costs.thc)], ["Outras despesas", formatMoney(costs.other)]]} />
      </ReviewSection>

      <ReviewSection title={`Itens (${detail.items.length})`}>
        <div className="space-y-3">
          {detail.items.map((item) => {
            const taxes = object(item.tax_payload);
            const icms = object(taxes.icms);
            return (
              <details key={item.id} className="rounded-2xl border border-border p-4">
                <summary className="cursor-pointer list-none marker:content-none"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">Item {item.item_number} · {item.description}</p><p className="mt-1 text-xs text-muted-foreground">NCM {item.ncm} · CFOP {item.cfop} · {item.commercial_quantity} {item.commercial_unit}</p></div><p className="shrink-0 font-semibold">{formatMoney(item.product_value)}</p></div></summary>
                <div className="mt-4 border-t border-border pt-4"><InfoGrid fields={[["Código do produto", item.product_code], ["Valor unitário", formatMoney(item.commercial_unit_value)], ["Frete", formatMoney(item.freight_value)], ["Seguro", formatMoney(item.insurance_value)], ["ICMS CST", icms.cst], ["Base ICMS", formatMoney(icms.base)], ["Alíquota ICMS", icms.rate ? `${icms.rate}%` : null], ["Valor ICMS", formatMoney(icms.value)]]} /></div>
              </details>
            );
          })}
        </div>
      </ReviewSection>
    </div>
  );
}

function IssueList({ errors, warnings }: { errors: NfeValidationIssue[]; warnings: NfeValidationIssue[] }) {
  return <div className="space-y-2">{errors.map((issue, index) => <div key={`error-${index}`} className="flex items-start gap-2 rounded-xl bg-red-500/5 p-3 text-sm text-red-700 dark:text-red-300"><AlertTriangle className="mt-0.5 shrink-0" size={16} /><span>{issue.field ? `${issue.field}: ` : ""}{issueText(issue)}</span></div>)}{warnings.map((issue, index) => <div key={`warning-${index}`} className="flex items-start gap-2 rounded-xl bg-amber-500/5 p-3 text-sm text-amber-800 dark:text-amber-300"><ShieldAlert className="mt-0.5 shrink-0" size={16} /><span>{issue.field ? `${issue.field}: ` : ""}{issueText(issue)}</span></div>)}</div>;
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h3 className="border-b border-border pb-2 font-semibold">{title}</h3><div className="mt-3">{children}</div></section>;
}

function InfoGrid({ fields }: { fields: Array<[string, unknown]> }) {
  return <dl className="grid gap-3 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="rounded-xl bg-muted/45 p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{display(value)}</dd></div>)}</dl>;
}
