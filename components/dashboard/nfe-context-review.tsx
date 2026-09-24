"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  PencilLine,
  RefreshCw,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import useSWR from "swr";

import { Sheet } from "@/components/ui/sheet";
import type { ImportPurpose } from "@/lib/api/client-import-tax-rule";
import type {
  NfeContextState,
  NfeItemClassification,
  NfeItemClassificationState,
  ResolveNfeContextPayload,
} from "@/lib/api/import-process";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import {
  itemClassificationsUrl,
  nfeContextUrl,
  resolveNfeContext,
  saveNfeItemClassifications,
} from "@/lib/bff/import-process";

const transportModes: Record<string, string> = {
  "1": "Marítima",
  "2": "Fluvial",
  "3": "Lacustre",
  "4": "Aérea",
  "5": "Postal",
  "6": "Ferroviária",
  "7": "Rodoviária",
  "8": "Conduto",
  "9": "Meios próprios",
  "10": "Entrada/saída ficta",
  "11": "Courier",
  "12": "Em mãos",
  "13": "Por reboque",
};

const modalityLabels: Record<string, string> = {
  direct: "Importação própria",
  on_behalf: "Por conta e ordem",
  by_order: "Por encomenda",
};

const purposeLabels: Record<ImportPurpose, string> = {
  resale: "Revenda",
  industrialization: "Industrialização",
  fixed_asset: "Ativo imobilizado",
  use_consumption: "Uso e consumo",
};

const statusLabels: Record<NfeItemClassification["status"], string> = {
  unclassified: "Sem finalidade",
  missing_tax_rule: "Regra não encontrada",
  inactive_tax_rule: "Regra inativa",
  stale_tax_rule: "Regra alterada",
  missing_cfop: "CFOP ausente",
  classified: "Classificado",
};

const sourceLabels: Record<string, string> = {
  duimp: "DUIMP",
  portal_unico_tabx: "Portal Único / TABX",
  portal_unico_cct: "Portal Único / CCT",
  builtin_official_reference: "Referência oficial local",
  provider_configuration: "Configuração do provedor",
  operator_override: "Informado pelo usuário",
};

const missingLabels: Record<string, string> = {
  registration_date: "Data de registro",
  clearance_location: "Local de desembaraço",
  clearance_state: "UF do desembaraço",
  clearance_date: "Data de desembaraço",
  transport_mode_code: "Via de transporte",
  "foreign_supplier.country_code": "Código do país do fornecedor",
  "foreign_supplier.country_name": "País do fornecedor",
  "client.fiscal_profile": "Perfil fiscal do cliente",
  tax_configuration: "Regra tributária aplicável",
};

const mismatchLabels: Record<string, string> = {
  issuer_state: "UF do emitente",
  import_purpose: "finalidade",
  tax_regime: "regime tributário",
  import_modality: "modalidade de importação",
  effective_from: "vigência inicial",
  effective_until: "vigência final",
  ncm_pattern: "escopo de NCM",
};

function displayValue(value: unknown, fallback = "Não informado") {
  return value === null || value === undefined || value === "" ? fallback : String(value);
}

function ContextItem({ label, value, source }: { label: string; value: unknown; source?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 text-sm font-medium">{displayValue(value)}</dd>
      {source ? <span className="mt-1 block text-xs text-muted-foreground">Fonte: {sourceLabels[source] ?? source}</span> : null}
    </div>
  );
}

export function NfeContextReview({
  processId,
  clientId,
  snapshotId,
  onWorkflowChange,
}: {
  processId: string;
  clientId: string;
  snapshotId: string;
  onWorkflowChange: () => Promise<unknown>;
}) {
  const url = nfeContextUrl(processId, snapshotId);
  const { data, error, isLoading, mutate } = useSWR<NfeContextState>(url, bffFetcher);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function refreshOfficialSources() {
    setRefreshing(true);
    setActionError(null);
    try {
      const resolved = await resolveNfeContext(processId, {
        duimp_snapshot_id: snapshotId,
        refresh_external: true,
        overrides: {},
      });
      await mutate(resolved, { revalidate: false });
      await onWorkflowChange();
    } catch (requestError) {
      setActionError(bffErrorMessage(requestError));
    } finally {
      setRefreshing(false);
    }
  }

  async function retryLoad() {
    setActionError(null);
    await mutate();
  }

  return (
    <>
      <section className="surface-card mt-6 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <p className="eyebrow">Etapa 3</p>
            <h2 className="mt-2 text-2xl font-semibold">Conferir contexto fiscal</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Confirme desembaraço, transporte e fornecedor. A origem de cada dado permanece visível para auditoria.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="button button-secondary" disabled={refreshing || isLoading} onClick={refreshOfficialSources}>
              {refreshing ? <LoaderCircle className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              {refreshing ? "Consultando..." : "Atualizar fontes oficiais"}
            </button>
            <button type="button" className="button button-primary" disabled={!data} onClick={() => setSheetOpen(true)}>
              <PencilLine size={16} /> Revisar dados
            </button>
          </div>
        </div>

        {error || actionError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-destructive">{actionError ?? bffErrorMessage(error)}</p>
            <button type="button" className="button button-secondary mt-4" onClick={retryLoad}><RefreshCw size={16} /> Tentar novamente</button>
          </div>
        ) : isLoading || !data ? (
          <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4" aria-label="Carregando contexto fiscal">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : (
          <div className="p-5 sm:p-7">
            <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${data.ready_for_draft ? "border-primary/20 bg-sage-soft text-sage-strong" : "border-amber-400/35 bg-amber-500/5 text-amber-800 dark:text-amber-300"}`}>
              {data.ready_for_draft ? <CheckCircle2 className="mt-0.5 shrink-0" size={19} /> : <AlertTriangle className="mt-0.5 shrink-0" size={19} />}
              <div>
                <p className="font-semibold">{data.ready_for_draft ? "Contexto fiscal completo" : "Existem dados obrigatórios pendentes"}</p>
                {!data.ready_for_draft ? (
                  <p className="mt-1">{data.missing_fields.map((field) => missingLabels[field] ?? field).join(" · ")}</p>
                ) : <p className="mt-1">Os itens já podem receber finalidade e regra tributária.</p>}
              </div>
            </div>

            <dl className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-4">
              <ContextItem label="Registro da DUIMP" value={data.normalized.registration_date} source={data.fields.registration_date?.source} />
              <ContextItem label="Modalidade" value={data.normalized.import_modality ? modalityLabels[data.normalized.import_modality] ?? data.normalized.import_modality : null} />
              <ContextItem label="Local de desembaraço" value={data.normalized.clearance_location} source={data.fields.clearance_location?.source} />
              <ContextItem label="UF do desembaraço" value={data.normalized.clearance_state} source={data.fields.clearance_state?.source} />
              <ContextItem label="Data de desembaraço" value={data.normalized.clearance_date} source={data.fields.clearance_date?.source} />
              <ContextItem label="Via de transporte" value={data.normalized.transport_mode_code ? `${data.normalized.transport_mode_code} — ${transportModes[data.normalized.transport_mode_code] ?? "Não identificada"}` : null} source={data.fields.transport_mode_code?.source} />
              <ContextItem label="Fornecedor estrangeiro" value={data.normalized.foreign_supplier?.name} source={data.fields["foreign_supplier.name"]?.source} />
              <ContextItem label="País do fornecedor" value={data.normalized.foreign_supplier?.country_name} source={data.fields["foreign_supplier.country_name"]?.source} />
              <ContextItem label="Código do país" value={data.normalized.foreign_supplier?.country_code} source={data.fields["foreign_supplier.country_code"]?.source} />
            </dl>

            {data.missing_fields.includes("registration_date") ? (
              <p className="mt-6 rounded-xl bg-destructive/5 p-4 text-sm text-destructive">
                A data de registro deve vir da DUIMP e não pode ser substituída manualmente. Recapture a DUIMP antes de continuar.
              </p>
            ) : null}

            {data.external.errors?.length ? (
              <div className="mt-6 rounded-2xl border border-amber-400/35 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-300">
                <p className="font-semibold">Algumas fontes externas não responderam</p>
                <ul className="mt-2 space-y-1">
                  {data.external.errors.map((item, index) => <li key={`${item.source}-${index}`}>{item.source ?? "Integração"}: {item.message ?? item.code ?? "erro não detalhado"}</li>)}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {data?.ready_for_draft ? (
        <NfeItemClassificationSection processId={processId} clientId={clientId} snapshotId={snapshotId} onWorkflowChange={onWorkflowChange} />
      ) : null}

      {data ? (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title="Revisar contexto fiscal" description="Altere somente dados que precisam de correção ou complemento. As mudanças serão registradas como informadas pelo usuário.">
          {sheetOpen ? (
            <NfeContextForm
              processId={processId}
              snapshotId={snapshotId}
              context={data}
              onCancel={() => setSheetOpen(false)}
              onSaved={async (resolved) => {
                await mutate(resolved, { revalidate: false });
                setSheetOpen(false);
                await onWorkflowChange();
              }}
            />
          ) : null}
        </Sheet>
      ) : null}
    </>
  );
}

function NfeContextForm({
  processId,
  snapshotId,
  context,
  onCancel,
  onSaved,
}: {
  processId: string;
  snapshotId: string;
  context: NfeContextState;
  onCancel: () => void;
  onSaved: (context: NfeContextState) => Promise<void>;
}) {
  const supplier = context.normalized.foreign_supplier ?? {};
  const [values, setValues] = useState({
    clearance_location: context.normalized.clearance_location ?? "",
    clearance_state: context.normalized.clearance_state ?? "",
    clearance_date: context.normalized.clearance_date ?? "",
    transport_mode_code: context.normalized.transport_mode_code ?? "",
    supplier_name: supplier.name ?? "",
    country_code: supplier.country_code ?? "",
    country_name: supplier.country_name ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setValue(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const overrides: ResolveNfeContextPayload["overrides"] = {};
    const changed = (value: string, original: unknown) => value.trim() !== String(original ?? "").trim();
    if (changed(values.clearance_location, context.normalized.clearance_location)) overrides.clearance_location = values.clearance_location.trim();
    if (changed(values.clearance_state, context.normalized.clearance_state)) overrides.clearance_state = values.clearance_state.trim().toUpperCase();
    if (changed(values.clearance_date, context.normalized.clearance_date)) overrides.clearance_date = values.clearance_date;
    if (changed(values.transport_mode_code, context.normalized.transport_mode_code)) overrides.transport_mode_code = values.transport_mode_code;
    const foreignSupplier: NonNullable<ResolveNfeContextPayload["overrides"]["foreign_supplier"]> = {};
    if (changed(values.supplier_name, supplier.name)) foreignSupplier.name = values.supplier_name.trim();
    if (changed(values.country_code, supplier.country_code)) foreignSupplier.country_code = values.country_code.trim();
    if (changed(values.country_name, supplier.country_name)) foreignSupplier.country_name = values.country_name.trim();
    if (Object.keys(foreignSupplier).length) overrides.foreign_supplier = foreignSupplier;

    try {
      const resolved = await resolveNfeContext(processId, {
        duimp_snapshot_id: snapshotId,
        refresh_external: false,
        overrides,
      });
      await onSaved(resolved);
    } catch (requestError) {
      setError(bffErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="field-label">Local de desembaraço *</span><input className="field-input" value={values.clearance_location} onChange={(event) => setValue("clearance_location", event.target.value)} required /></label>
        <label><span className="field-label">UF do desembaraço *</span><input className="field-input uppercase" value={values.clearance_state} onChange={(event) => setValue("clearance_state", event.target.value.slice(0, 2))} minLength={2} maxLength={2} required /></label>
        <label><span className="field-label">Data de desembaraço *</span><input className="field-input" type="date" value={values.clearance_date} onChange={(event) => setValue("clearance_date", event.target.value)} required /></label>
        <label className="sm:col-span-2"><span className="field-label">Via de transporte *</span><select className="field-input" value={values.transport_mode_code} onChange={(event) => setValue("transport_mode_code", event.target.value)} required><option value="">Selecione</option>{Object.entries(transportModes).map(([code, label]) => <option key={code} value={code}>{code} — {label}</option>)}</select></label>
      </div>
      <div className="border-t border-border pt-6">
        <h3 className="font-semibold">Fornecedor estrangeiro</h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="field-label">Nome</span><input className="field-input" value={values.supplier_name} onChange={(event) => setValue("supplier_name", event.target.value)} /></label>
          <label><span className="field-label">Código do país *</span><input className="field-input" value={values.country_code} onChange={(event) => setValue("country_code", event.target.value)} required /></label>
          <label><span className="field-label">País *</span><input className="field-input uppercase" value={values.country_name} onChange={(event) => setValue("country_name", event.target.value)} required /></label>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <div className="flex justify-end gap-3 border-t border-border pt-5">
        <button type="button" className="button button-secondary" onClick={onCancel} disabled={saving}>Cancelar</button>
        <button type="submit" className="button button-primary" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{saving ? "Salvando..." : "Salvar contexto"}</button>
      </div>
    </form>
  );
}

function NfeItemClassificationSection({
  processId,
  clientId,
  snapshotId,
  onWorkflowChange,
}: {
  processId: string;
  clientId: string;
  snapshotId: string;
  onWorkflowChange: () => Promise<unknown>;
}) {
  const url = itemClassificationsUrl(processId, snapshotId);
  const { data, error, isLoading, mutate } = useSWR<NfeItemClassificationState>(url, bffFetcher);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <section className="surface-card mt-6 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <p className="eyebrow">Etapa 4</p>
            <h2 className="mt-2 text-2xl font-semibold">Finalidades e regras tributárias</h2>
            <p className="mt-2 text-sm text-muted-foreground">Cada item é resolvido pela prioridade: NCM exato, maior prefixo, regra geral e prioridade configurada.</p>
          </div>
          <button type="button" className="button button-primary" disabled={!data} onClick={() => setSheetOpen(true)}><SlidersHorizontal size={16} /> Classificar itens</button>
        </div>

        {error ? (
          <div className="p-8 text-center"><p className="text-sm text-destructive">{bffErrorMessage(error)}</p><button type="button" className="button button-secondary mt-4" onClick={() => mutate()}><RefreshCw size={16} /> Tentar novamente</button></div>
        ) : isLoading || !data ? (
          <div className="space-y-3 p-6">{[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-muted" />)}</div>
        ) : (
          <>
            <div className="grid gap-3 border-b border-border p-5 sm:grid-cols-3 sm:p-6">
              <div className="rounded-xl bg-muted/60 p-4"><p className="text-xs uppercase text-muted-foreground">Itens</p><p className="mt-1 text-xl font-semibold">{data.total_items}</p></div>
              <div className="rounded-xl bg-muted/60 p-4"><p className="text-xs uppercase text-muted-foreground">Classificados</p><p className="mt-1 text-xl font-semibold text-sage-strong">{data.classified_count}</p></div>
              <div className="rounded-xl bg-muted/60 p-4"><p className="text-xs uppercase text-muted-foreground">Pendentes</p><p className="mt-1 text-xl font-semibold">{data.pending_count}</p></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-6 py-4">Item</th><th className="px-6 py-4">NCM</th><th className="px-6 py-4">Finalidade</th><th className="px-6 py-4">CFOP</th><th className="px-6 py-4">Regra aplicada</th><th className="px-6 py-4">Situação</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {data.items.map((item) => <ClassificationRow key={item.duimp_item_number} item={item} />)}
                </tbody>
              </table>
            </div>
            {data.ready_for_draft ? (
              <div className="m-5 rounded-2xl border border-primary/20 bg-sage-soft p-5 text-sage-strong sm:m-6"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0" size={20} /><div><p className="font-semibold">Todos os itens possuem regra aplicável</p><p className="mt-1 text-sm">O processo está pronto para criar e reconciliar o plano de documentos.</p></div></div><button type="button" className="button button-primary mt-5" disabled title="Será habilitado no próximo checkpoint">Criar plano de documentos</button><p className="mt-2 text-xs">A divisão por exportador e o rateio de despesas serão implementados no próximo checkpoint.</p></div>
            ) : (
              <div className="m-5 rounded-2xl border border-amber-400/35 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-300 sm:m-6">
                <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 shrink-0" size={18} /><div><p className="font-semibold">Classificação incompleta</p><p className="mt-1">Defina a finalidade dos itens e corrija regras ausentes, inativas ou desatualizadas.</p></div></div>
                <Link href={`/dashboard/clientes/${clientId}?section=tax-rules`} target="_blank" className="button button-secondary mt-4 min-h-9 px-3 text-xs">Abrir regras tributárias <ExternalLink size={13} /></Link>
              </div>
            )}
          </>
        )}
      </section>

      {data ? (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title="Classificar itens da DUIMP" description="Defina a finalidade. A API selecionará a regra mais específica e bloqueará empates de prioridade.">
          {sheetOpen ? <ItemClassificationForm processId={processId} snapshotId={snapshotId} state={data} onCancel={() => setSheetOpen(false)} onSaved={async (saved) => { await mutate(saved, { revalidate: false }); setSheetOpen(false); await onWorkflowChange(); }} /> : null}
        </Sheet>
      ) : null}
    </>
  );
}

function ClassificationRow({ item }: { item: NfeItemClassification }) {
  const ready = item.status === "classified";
  return (
    <tr>
      <td className="max-w-80 px-6 py-4"><p className="font-semibold">Item {item.duimp_item_number}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description || item.product_code || "Sem descrição"}</p></td>
      <td className="px-6 py-4 font-mono text-xs">{item.ncm || "—"}</td>
      <td className="px-6 py-4">{item.import_purpose ? purposeLabels[item.import_purpose] : "—"}</td>
      <td className="px-6 py-4 font-mono text-xs">{item.cfop || "—"}</td>
      <td className="max-w-52 px-6 py-4">{item.tax_rule?.name ?? "—"}</td>
      <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ready ? "bg-sage-soft text-sage-strong" : "bg-amber-100 text-amber-800 dark:bg-amber-950/55 dark:text-amber-200"}`}>{statusLabels[item.status]}</span></td>
    </tr>
  );
}

function ItemClassificationForm({
  processId,
  snapshotId,
  state,
  onCancel,
  onSaved,
}: {
  processId: string;
  snapshotId: string;
  state: NfeItemClassificationState;
  onCancel: () => void;
  onSaved: (state: NfeItemClassificationState) => Promise<void>;
}) {
  const [purposes, setPurposes] = useState<Record<string, ImportPurpose | "">>(() => Object.fromEntries(state.items.map((item) => [item.duimp_item_number, item.import_purpose ?? ""])));
  const [bulkPurpose, setBulkPurpose] = useState<ImportPurpose | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing = state.items.filter((item) => !purposes[item.duimp_item_number]);
    if (missing.length) {
      setError(`Defina a finalidade de ${missing.length} item(ns) antes de aplicar as regras.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await saveNfeItemClassifications(processId, {
        duimp_snapshot_id: snapshotId,
        items: state.items.map((item) => ({
          duimp_item_number: item.duimp_item_number,
          import_purpose: purposes[item.duimp_item_number] as ImportPurpose,
        })),
      });
      await onSaved(saved);
    } catch (requestError) {
      setError(bffErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-5">
      <div className="rounded-2xl border border-border bg-muted/40 p-4">
        <label><span className="field-label">Aplicar a todos os itens</span><div className="flex flex-col gap-2 sm:flex-row"><select className="field-input" value={bulkPurpose} onChange={(event) => setBulkPurpose(event.target.value as ImportPurpose | "")}><option value="">Selecione uma finalidade</option>{Object.entries(purposeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" className="button button-secondary shrink-0" disabled={!bulkPurpose} onClick={() => setPurposes(Object.fromEntries(state.items.map((item) => [item.duimp_item_number, bulkPurpose])))}>Aplicar em todos</button></div></label>
      </div>

      <div className="space-y-3">
        {state.items.map((item) => (
          <div key={item.duimp_item_number} className="rounded-2xl border border-border p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0"><p className="font-semibold">Item {item.duimp_item_number} · NCM {item.ncm || "não informado"}</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description || item.product_code || "Sem descrição"}</p>{item.tax_rule ? <p className="mt-2 text-xs text-sage-strong">Regra atual: {item.tax_rule.name} · CFOP {item.cfop}</p> : null}</div>
              <label className="w-full shrink-0 sm:w-64"><span className="field-label">Finalidade *</span><select className="field-input" value={purposes[item.duimp_item_number] ?? ""} onChange={(event) => setPurposes((current) => ({ ...current, [item.duimp_item_number]: event.target.value as ImportPurpose }))} required><option value="">Selecione</option>{Object.entries(purposeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            </div>
            {item.rule_candidates.length ? <div className="mt-3 rounded-xl bg-amber-500/5 p-3 text-xs text-amber-800 dark:text-amber-300"><p className="font-semibold">Regras próximas, mas não aplicáveis:</p>{item.rule_candidates.map((candidate) => <p key={candidate.id} className="mt-1">{candidate.name}: {candidate.mismatch_reasons.map((reason) => mismatchLabels[reason] ?? reason).join(", ")}</p>)}</div> : null}
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <div className="flex justify-end gap-3 border-t border-border pt-5"><button type="button" className="button button-secondary" onClick={onCancel} disabled={saving}>Cancelar</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{saving ? "Aplicando regras..." : "Salvar e aplicar regras"}</button></div>
    </form>
  );
}
