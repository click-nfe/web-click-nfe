"use client";

import axios from "axios";
import {
  AlertTriangle,
  Beaker,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleOff,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useState } from "react";
import useSWR from "swr";

import type {
  ClientImportTaxRule,
  ClientImportTaxRuleDiagnostic,
  ClientImportTaxRuleDiagnostics,
  ClientImportTaxRulePayload,
  ImportModality,
  ImportPurpose,
  ImportTaxConfiguration,
  ImportTaxRuleSimulation,
  ImportTaxRuleSimulationPayload,
  NcmScopeType,
  TaxRegime,
} from "@/lib/api/client-import-tax-rule";
import type { ClientFiscalProfile } from "@/lib/api/client-fiscal-profile";
import type { ClientRecord } from "@/lib/api/client-record";
import { routes } from "@/lib/api/routes";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import { getClientFiscalProfile } from "@/lib/bff/client-fiscal-profile";
import {
  createClientImportTaxRule,
  deactivateClientImportTaxRule,
  simulateClientImportTaxRule,
  updateClientImportTaxRule,
} from "@/lib/bff/client-import-tax-rule";

const purposeLabels: Record<ImportPurpose, string> = {
  resale: "Comercialização",
  industrialization: "Industrialização",
  fixed_asset: "Ativo imobilizado",
  use_consumption: "Uso ou consumo",
};

const modalityLabels: Record<ImportModality, string> = {
  direct: "Importação própria",
  on_behalf: "Conta e ordem",
  by_order: "Encomenda",
};

const regimeLabels: Record<TaxRegime, string> = {
  "1": "Simples Nacional",
  "2": "Simples Nacional — excesso de sublimite",
  "3": "Regime Normal",
};

const scopeLabels: Record<NcmScopeType, string> = {
  all: "Todos os NCMs",
  prefix: "Capítulo ou posição",
  exact: "NCM específico",
};

const mismatchLabels: Record<string, string> = {
  issuer_state: "UF emitente diferente",
  import_purpose: "finalidade diferente",
  import_modality: "modalidade diferente",
  tax_regime: "regime tributário diferente",
  effective_from: "a regra ainda não está vigente",
  effective_until: "a vigência da regra terminou",
  ncm_pattern: "NCM fora do escopo",
};

const icmsCstLabels: Record<string, string> = {
  "00": "00 — Tributada integralmente",
  "40": "40 — Isenta",
  "41": "41 — Não tributada",
  "50": "50 — Suspensão",
  "51": "51 — Diferimento",
  "90": "90 — Outras",
};

const originLabels: Record<string, string> = {
  "0": "0 — Nacional",
  "1": "1 — Estrangeira, importação direta",
  "2": "2 — Estrangeira, mercado interno",
  "3": "3 — Nacional, conteúdo de importação superior a 40%",
  "4": "4 — Nacional, produção conforme processos básicos",
  "5": "5 — Nacional, conteúdo de importação até 40%",
  "6": "6 — Estrangeira, importação direta sem similar nacional",
  "7": "7 — Estrangeira, mercado interno sem similar nacional",
  "8": "8 — Nacional, conteúdo de importação superior a 70%",
};

const states = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT",
  "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO",
  "RR", "SC", "SP", "SE", "TO",
];

type RuleFormValues = {
  name: string;
  issuerState: string;
  importPurpose: ImportPurpose;
  importModality: "" | ImportModality;
  taxRegime: "" | TaxRegime;
  ncmScopeType: NcmScopeType;
  ncmPatterns: string;
  priority: string;
  effectiveFrom: string;
  effectiveUntil: string;
  active: boolean;
  cfop: string;
  icmsOrigin: string;
  icmsCst: string;
  icmsRate: string;
  baseReductionRate: string;
  defermentRate: string;
  taxTreatmentConfirmed: boolean;
};

function digits(value: string, limit: number) {
  return value.replace(/\D/g, "").slice(0, limit);
}

function optionalRate(value: string) {
  return value.trim().replace(",", ".");
}

function patternsFrom(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\s,;]+/)
        .map((item) => digits(item, 8))
        .filter(Boolean),
    ),
  ).sort();
}

function formValues(
  rule: ClientImportTaxRule | null,
  profile: ClientFiscalProfile | null,
  client: ClientRecord,
): RuleFormValues {
  const configuration = rule?.configuration_json;
  return {
    name: rule?.name ?? "",
    issuerState: rule?.issuer_state ?? profile?.state ?? "",
    importPurpose: rule?.import_purpose ?? "resale",
    importModality: rule?.import_modality ?? "",
    taxRegime:
      rule?.tax_regime ??
      profile?.tax_regime ??
      ((client.regime_tributacao === "1" ||
      client.regime_tributacao === "2" ||
      client.regime_tributacao === "3")
        ? client.regime_tributacao
        : ""),
    ncmScopeType: rule?.ncm_scope_type ?? "all",
    ncmPatterns: rule?.ncm_patterns.join("\n") ?? "",
    priority: String(rule?.priority ?? 100),
    effectiveFrom: rule?.effective_from ?? "",
    effectiveUntil: rule?.effective_until ?? "",
    active: rule?.active ?? true,
    cfop: String(configuration?.cfop ?? "3102"),
    icmsOrigin: String(configuration?.icms_origin ?? "1"),
    icmsCst: String(configuration?.icms_cst ?? "90").padStart(2, "0"),
    icmsRate: String(configuration?.icms_rate ?? ""),
    baseReductionRate: String(configuration?.icms_base_reduction_rate ?? ""),
    defermentRate: String(configuration?.icms_deferment_rate ?? ""),
    taxTreatmentConfirmed: Boolean(
      configuration?.icms_tax_treatment_confirmed,
    ),
  };
}

function apiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as
      | {
          message?: string;
          error?: string;
          messages?: Record<string, string[] | Record<string, string[]>>;
        }
      | undefined;
    if (body?.message) return body.message;
    if (body?.messages) {
      const first = Object.values(body.messages)[0];
      if (Array.isArray(first)) return first[0] ?? "Revise os campos informados.";
      if (first && typeof first === "object") {
        const nested = Object.values(first)[0];
        if (Array.isArray(nested)) return nested[0] ?? "Revise os campos informados.";
      }
    }
  }
  return bffErrorMessage(error);
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}

function scopeDescription(rule: ClientImportTaxRule) {
  if (rule.ncm_scope_type === "all") return "Todos os NCMs";
  return rule.ncm_patterns.join(", ");
}

function RuleForm({
  client,
  profile,
  rule,
  onCancel,
  onSaved,
}: {
  client: ClientRecord;
  profile: ClientFiscalProfile | null;
  rule: ClientImportTaxRule | null;
  onCancel: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [values, setValues] = useState(() => formValues(rule, profile, client));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setValue<K extends keyof RuleFormValues>(
    field: K,
    value: RuleFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function validate() {
    if (!values.name.trim()) return "Informe um nome para identificar a regra.";
    if (!states.includes(values.issuerState)) return "Selecione a UF emitente.";
    if (!/^\d{4}$/.test(values.cfop)) return "O CFOP deve conter 4 dígitos.";

    const priority = Number(values.priority);
    if (!Number.isInteger(priority) || priority < 0 || priority > 1_000_000) {
      return "A prioridade deve ser um número inteiro entre 0 e 1.000.000.";
    }

    const patterns = patternsFrom(values.ncmPatterns);
    if (values.ncmScopeType !== "all" && patterns.length === 0) {
      return "Informe ao menos um NCM para o escopo selecionado.";
    }
    if (
      values.ncmScopeType === "exact" &&
      patterns.some((pattern) => pattern.length !== 8)
    ) {
      return "No escopo específico, cada NCM deve possuir 8 dígitos.";
    }
    if (
      values.ncmScopeType === "prefix" &&
      patterns.some((pattern) => pattern.length < 2 || pattern.length > 7)
    ) {
      return "Capítulos e posições devem possuir entre 2 e 7 dígitos.";
    }

    const reduction = Number(optionalRate(values.baseReductionRate) || 0);
    const deferment = Number(optionalRate(values.defermentRate) || 0);
    if (reduction > 0 && deferment > 0) {
      return "Redução de base e diferimento não podem ser aplicados juntos.";
    }
    if (
      values.effectiveFrom &&
      values.effectiveUntil &&
      values.effectiveUntil < values.effectiveFrom
    ) {
      return "A data final da vigência não pode ser anterior à data inicial.";
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const configuration: ImportTaxConfiguration = {
      ...(rule?.configuration_json ?? {}),
      cfop: values.cfop,
      icms_origin: values.icmsOrigin,
      icms_cst: values.icmsCst,
      icms_tax_treatment_confirmed: values.taxTreatmentConfirmed,
    };
    const exempt = ["40", "41", "50"].includes(values.icmsCst);
    const rate = optionalRate(values.icmsRate);
    const reduction = optionalRate(values.baseReductionRate);
    const deferment = optionalRate(values.defermentRate);

    if (!exempt && rate) configuration.icms_rate = rate;
    else delete configuration.icms_rate;
    if (!exempt && reduction) configuration.icms_base_reduction_rate = reduction;
    else delete configuration.icms_base_reduction_rate;
    if (!exempt && deferment) configuration.icms_deferment_rate = deferment;
    else delete configuration.icms_deferment_rate;

    const payload: ClientImportTaxRulePayload = {
      name: values.name.trim(),
      issuer_state: values.issuerState,
      import_purpose: values.importPurpose,
      import_modality: values.importModality || null,
      tax_regime: values.taxRegime || null,
      ncm_scope_type: values.ncmScopeType,
      ncm_patterns:
        values.ncmScopeType === "all" ? [] : patternsFrom(values.ncmPatterns),
      priority: Number(values.priority),
      configuration_json: configuration,
      active: values.active,
      effective_from: values.effectiveFrom || null,
      effective_until: values.effectiveUntil || null,
    };

    setSaving(true);
    setError(null);
    try {
      if (rule) {
        await updateClientImportTaxRule(client.id, rule.id, payload);
        await onSaved("Regra de ICMS atualizada. A nova revisão já está disponível para os próximos itens.");
      } else {
        await createClientImportTaxRule(client.id, payload);
        await onSaved("Regra de ICMS criada e incluída na resolução automática.");
      }
    } catch (submitError) {
      setError(apiErrorMessage(submitError));
    } finally {
      setSaving(false);
    }
  }

  const exempt = ["40", "41", "50"].includes(values.icmsCst);

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-border p-6 sm:p-8">
        <p className="eyebrow">{rule ? `Revisão ${rule.revision}` : "Nova regra"}</p>
        <h2 className="mt-3 text-2xl font-semibold">
          {rule ? "Editar regra de ICMS" : "Configurar regra de ICMS"}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Uma alteração fiscal gera nova revisão. Itens já classificados mantêm o snapshot anterior e ficam sinalizados para reconferência.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 p-6 sm:p-8">
        <fieldset className="grid gap-5 md:grid-cols-2 xl:grid-cols-4" disabled={saving}>
          <legend className="mb-5 w-full border-b border-border pb-3 text-base font-semibold md:col-span-2 xl:col-span-4">
            Aplicação da regra
          </legend>
          <label className="grid gap-2 text-sm font-semibold md:col-span-2">
            Nome da regra *
            <input
              className="field-input"
              value={values.name}
              onChange={(event) => setValue("name", event.target.value)}
              placeholder="Ex.: Revenda PR — autopeças capítulo 84"
              maxLength={120}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            UF emitente *
            <select className="field-input" value={values.issuerState} onChange={(event) => setValue("issuerState", event.target.value)} required>
              <option value="">Selecione</option>
              {states.map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Prioridade *
            <input className="field-input" type="number" min="0" max="1000000" step="1" value={values.priority} onChange={(event) => setValue("priority", event.target.value)} required />
            <span className="text-xs font-normal text-muted-foreground">Usada após a especificidade do NCM; maior número vence.</span>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Finalidade *
            <select className="field-input" value={values.importPurpose} onChange={(event) => setValue("importPurpose", event.target.value as ImportPurpose)}>
              {Object.entries(purposeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Modalidade
            <select className="field-input" value={values.importModality} onChange={(event) => setValue("importModality", event.target.value as "" | ImportModality)}>
              <option value="">Todas as modalidades</option>
              {Object.entries(modalityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Regime tributário
            <select className="field-input" value={values.taxRegime} onChange={(event) => setValue("taxRegime", event.target.value as "" | TaxRegime)}>
              <option value="">Todos os regimes</option>
              {Object.entries(regimeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Escopo de NCM *
            <select className="field-input" value={values.ncmScopeType} onChange={(event) => setValue("ncmScopeType", event.target.value as NcmScopeType)}>
              {Object.entries(scopeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {values.ncmScopeType !== "all" ? (
            <label className="grid gap-2 text-sm font-semibold md:col-span-2 xl:col-span-4">
              {values.ncmScopeType === "exact" ? "NCMs completos *" : "Capítulos ou posições *"}
              <textarea
                className="min-h-24 rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none ring-primary/20 focus:ring-4"
                value={values.ncmPatterns}
                onChange={(event) => setValue("ncmPatterns", event.target.value)}
                placeholder={values.ncmScopeType === "exact" ? "84212300\n87087090" : "84\n8708"}
              />
              <span className="text-xs font-normal text-muted-foreground">Informe um código por linha ou separe por vírgula.</span>
            </label>
          ) : null}
          <label className="grid gap-2 text-sm font-semibold">
            Vigente a partir de
            <input className="field-input" type="date" value={values.effectiveFrom} onChange={(event) => setValue("effectiveFrom", event.target.value)} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Vigente até
            <input className="field-input" type="date" value={values.effectiveUntil} onChange={(event) => setValue("effectiveUntil", event.target.value)} />
          </label>
          <label className="flex min-h-12 items-center gap-3 self-end rounded-xl border border-border px-4 text-sm font-semibold">
            <input type="checkbox" checked={values.active} onChange={(event) => setValue("active", event.target.checked)} className="size-4 accent-primary" />
            Regra ativa
          </label>
        </fieldset>

        <fieldset className="grid gap-5 md:grid-cols-2 xl:grid-cols-4" disabled={saving}>
          <legend className="mb-5 w-full border-b border-border pb-3 text-base font-semibold md:col-span-2 xl:col-span-4">
            Cálculo do ICMS
          </legend>
          <label className="grid gap-2 text-sm font-semibold">
            CFOP *
            <input className="field-input font-mono" inputMode="numeric" value={values.cfop} onChange={(event) => setValue("cfop", digits(event.target.value, 4))} required />
          </label>
          <label className="grid gap-2 text-sm font-semibold xl:col-span-2">
            Origem da mercadoria *
            <select className="field-input" value={values.icmsOrigin} onChange={(event) => setValue("icmsOrigin", event.target.value)}>
              {Object.entries(originLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            CST do ICMS *
            <select className="field-input" value={values.icmsCst} onChange={(event) => setValue("icmsCst", event.target.value)}>
              {Object.entries(icmsCstLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Alíquota nominal (%)
            <input className="field-input" inputMode="decimal" value={values.icmsRate} onChange={(event) => setValue("icmsRate", event.target.value)} placeholder={exempt ? "Não se aplica" : "12,00"} disabled={exempt} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Redução da base (%)
            <input className="field-input" inputMode="decimal" value={values.baseReductionRate} onChange={(event) => setValue("baseReductionRate", event.target.value)} placeholder="0,00" disabled={exempt} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Diferimento (%)
            <input className="field-input" inputMode="decimal" value={values.defermentRate} onChange={(event) => setValue("defermentRate", event.target.value)} placeholder="0,00" disabled={exempt} />
          </label>
          <label className="flex min-h-12 items-center gap-3 self-end rounded-xl border border-border px-4 text-sm font-semibold">
            <input type="checkbox" checked={values.taxTreatmentConfirmed} onChange={(event) => setValue("taxTreatmentConfirmed", event.target.checked)} className="size-4 accent-primary" />
            Tratamento fiscal conferido
          </label>
          <p className="rounded-xl bg-muted/60 p-4 text-xs leading-5 text-muted-foreground md:col-span-2 xl:col-span-4">
            O cálculo utiliza o snapshot desta configuração. Marcar o tratamento como conferido registra que CST, base e alíquota foram revisados antes da autorização fiscal.
          </p>
        </fieldset>

        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" className="button button-ghost" onClick={onCancel} disabled={saving}>Cancelar</button>
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? <><LoaderCircle className="animate-spin" size={16} /> Salvando...</> : <><Save size={16} /> {rule ? "Salvar nova revisão" : "Criar regra"}</>}
          </button>
        </div>
      </form>
    </section>
  );
}

function RuleCard({
  rule,
  busy,
  onEdit,
  onToggle,
}: {
  rule: ClientImportTaxRuleDiagnostic;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const configuration = rule.configuration_json;
  return (
    <article className={`rounded-2xl border p-5 sm:p-6 ${rule.active ? "border-border" : "border-border bg-muted/25 opacity-75"}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{rule.name}</h3>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${rule.active ? "bg-sage-soft text-sage-strong" : "bg-muted text-muted-foreground"}`}>
              {rule.active ? "Ativa" : "Inativa"}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">Revisão {rule.revision}</span>
            {rule.has_conflicts ? <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">Conflito</span> : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
            <span className="rounded-full border border-border px-3 py-1.5">{rule.issuer_state}</span>
            <span className="rounded-full border border-border px-3 py-1.5">{purposeLabels[rule.import_purpose]}</span>
            <span className="rounded-full border border-border px-3 py-1.5">{rule.import_modality ? modalityLabels[rule.import_modality] : "Todas as modalidades"}</span>
            <span className="rounded-full border border-border px-3 py-1.5">{rule.tax_regime ? regimeLabels[rule.tax_regime] : "Todos os regimes"}</span>
            <span className="rounded-full border border-border px-3 py-1.5">Prioridade {rule.priority}</span>
          </div>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-5">
            <div><dt className="text-xs text-muted-foreground">Escopo de NCM</dt><dd className="mt-1 font-medium">{scopeDescription(rule)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">CFOP</dt><dd className="mt-1 font-mono font-medium">{configuration.cfop}</dd></div>
            <div><dt className="text-xs text-muted-foreground">ICMS</dt><dd className="mt-1 font-medium">CST {configuration.icms_cst} · {configuration.icms_rate ? `${configuration.icms_rate}%` : "sem alíquota"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Vigência</dt><dd className="mt-1 font-medium">{formatDate(rule.effective_from) ?? "imediata"} — {formatDate(rule.effective_until) ?? "sem término"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Conferência fiscal</dt><dd className="mt-1 font-medium">{configuration.icms_tax_treatment_confirmed ? "Confirmada" : "Pendente"}</dd></div>
          </dl>
          {rule.has_conflicts ? (
            <p className="mt-4 flex items-start gap-2 text-sm text-destructive"><AlertTriangle className="mt-0.5 shrink-0" size={16} />Esta regra possui o mesmo nível de precedência de outra regra ativa. Use o simulador e ajuste a prioridade.</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" className="button button-secondary" onClick={onEdit} disabled={busy}><Pencil size={16} /> Editar</button>
          <button type="button" className="button button-ghost" onClick={onToggle} disabled={busy}>
            {busy ? <LoaderCircle className="animate-spin" size={16} /> : rule.active ? <CircleOff size={16} /> : <ShieldCheck size={16} />}
            {rule.active ? "Inativar" : "Reativar"}
          </button>
        </div>
      </div>
    </article>
  );
}

function TaxRuleSimulator({
  clientId,
  profile,
}: {
  clientId: string;
  profile: ClientFiscalProfile | null;
}) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<ImportTaxRuleSimulationPayload>({
    issuer_state: profile?.state ?? "",
    tax_regime: profile?.tax_regime ?? "3",
    import_purpose: "resale",
    import_modality: null,
    ncm: "",
    reference_date: new Date().toISOString().slice(0, 10),
  });
  const [result, setResult] = useState<ImportTaxRuleSimulation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!states.includes(values.issuer_state)) {
      setError("Selecione a UF emitente para executar a simulação.");
      return;
    }
    if (digits(values.ncm, 8).length !== 8) {
      setError("Informe um NCM completo com 8 dígitos.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await simulateClientImportTaxRule(clientId, { ...values, ncm: digits(values.ncm, 8) }));
    } catch (simulationError) {
      setError(apiErrorMessage(simulationError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="surface-card overflow-hidden">
      <button type="button" className="flex w-full items-center justify-between gap-4 p-6 text-left sm:p-8" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <span className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sage-soft text-sage-strong"><Beaker size={21} /></span>
          <span><span className="block text-lg font-semibold">Simular resolução</span><span className="mt-1 block text-sm text-muted-foreground">Confira qual regra será aplicada a um NCM antes de importar a DUIMP.</span></span>
        </span>
        {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {open ? (
        <div className="border-t border-border p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2 xl:grid-cols-6">
            <label className="grid gap-2 text-sm font-semibold"><span>NCM *</span><input className="field-input font-mono" inputMode="numeric" value={values.ncm} onChange={(event) => setValues((current) => ({ ...current, ncm: digits(event.target.value, 8) }))} placeholder="84212300" required /></label>
            <label className="grid gap-2 text-sm font-semibold"><span>UF emitente *</span><select className="field-input" value={values.issuer_state} onChange={(event) => setValues((current) => ({ ...current, issuer_state: event.target.value }))} required><option value="">Selecione</option>{states.map((state) => <option key={state} value={state}>{state}</option>)}</select></label>
            <label className="grid gap-2 text-sm font-semibold"><span>Finalidade *</span><select className="field-input" value={values.import_purpose} onChange={(event) => setValues((current) => ({ ...current, import_purpose: event.target.value as ImportPurpose }))}>{Object.entries(purposeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="grid gap-2 text-sm font-semibold"><span>Modalidade</span><select className="field-input" value={values.import_modality ?? ""} onChange={(event) => setValues((current) => ({ ...current, import_modality: (event.target.value || null) as ImportModality | null }))}><option value="">Não informada</option>{Object.entries(modalityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="grid gap-2 text-sm font-semibold"><span>Regime *</span><select className="field-input" value={values.tax_regime} onChange={(event) => setValues((current) => ({ ...current, tax_regime: event.target.value as TaxRegime }))}>{Object.entries(regimeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label className="grid gap-2 text-sm font-semibold"><span>Data de referência</span><input className="field-input" type="date" value={values.reference_date ?? ""} onChange={(event) => setValues((current) => ({ ...current, reference_date: event.target.value || null }))} /></label>
            <div className="flex items-center justify-end gap-3 md:col-span-2 xl:col-span-6">
              <button type="submit" className="button button-primary" disabled={loading}>{loading ? <><LoaderCircle className="animate-spin" size={16} /> Simulando...</> : <><Sparkles size={16} /> Executar simulação</>}</button>
            </div>
          </form>
          {error ? <p className="mt-5 text-sm text-destructive" role="alert">{error}</p> : null}
          {result ? (
            <div className="mt-6 rounded-2xl border border-border bg-muted/25 p-5">
              {result.selected_rule ? (
                <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-sage-strong" size={20} /><div><p className="font-semibold">Regra selecionada: {result.selected_rule.name}</p><p className="mt-1 text-sm text-muted-foreground">Correspondência: {result.selection.matched_ncm_pattern || "regra geral"}. A especificidade do NCM é avaliada antes da prioridade numérica.</p></div></div>
              ) : (
                <div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-destructive" size={20} /><div><p className="font-semibold">Nenhuma regra aplicável.</p><p className="mt-1 text-sm text-muted-foreground">O item ficará pendente de classificação fiscal até existir uma regra compatível.</p></div></div>
              )}
              {result.candidates.length ? (
                <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="pb-3 font-semibold">Regra</th><th className="pb-3 font-semibold">NCM correspondente</th><th className="pb-3 font-semibold">Resultado</th></tr></thead><tbody className="divide-y divide-border">{result.candidates.map((candidate) => <tr key={candidate.rule.id}><td className="py-3 pr-4 font-medium">{candidate.rule.name}</td><td className="py-3 pr-4 font-mono text-xs">{candidate.matched_ncm_pattern || (candidate.mismatch_reasons.includes("ncm_pattern") ? "—" : "regra geral")}</td><td className={`py-3 ${candidate.selected ? "font-semibold text-sage-strong" : "text-muted-foreground"}`}>{candidate.selected ? "Selecionada" : candidate.mismatch_reasons.map((reason) => mismatchLabels[reason] ?? reason).join(", ") || "Menor precedência"}</td></tr>)}</tbody></table></div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function ClientTaxRules({ client }: { client: ClientRecord }) {
  const diagnosticsUrl = routes.bff.client.importTaxRuleDiagnostics(client.id);
  const { data, error, isLoading, mutate } = useSWR<ClientImportTaxRuleDiagnostics>(diagnosticsUrl, bffFetcher);
  const { data: profile } = useSWR<ClientFiscalProfile | null>(
    routes.bff.client.fiscalProfile(client.id),
    () => getClientFiscalProfile(client.id),
  );
  const [editing, setEditing] = useState<ClientImportTaxRule | null | undefined>(undefined);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function saved(message: string) {
    setEditing(undefined);
    setNotice(message);
    setActionError(null);
    await mutate();
  }

  async function toggleRule(rule: ClientImportTaxRuleDiagnostic) {
    if (rule.active && !window.confirm(`Inativar a regra “${rule.name}”? Ela deixará de ser considerada nos próximos itens.`)) return;
    setBusyId(rule.id);
    setActionError(null);
    setNotice(null);
    try {
      if (rule.active) {
        await deactivateClientImportTaxRule(client.id, rule.id);
        setNotice("Regra inativada. Os snapshots já aplicados foram preservados.");
      } else {
        await updateClientImportTaxRule(client.id, rule.id, { active: true });
        setNotice("Regra reativada e disponível para novas resoluções.");
      }
      await mutate();
    } catch (toggleError) {
      setActionError(apiErrorMessage(toggleError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {editing !== undefined ? (
        <RuleForm key={editing?.id ?? "new"} client={client} profile={profile ?? null} rule={editing} onCancel={() => setEditing(undefined)} onSaved={saved} />
      ) : (
        <section className="surface-card overflow-hidden">
          <div className="flex flex-col gap-5 border-b border-border p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
            <div><p className="eyebrow">Automação tributária</p><h2 className="mt-3 text-2xl font-semibold">Regras de ICMS por item da DUIMP</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Defina regras gerais, por capítulo/posição ou por NCM completo. Na classificação, o sistema escolhe primeiro o escopo mais específico e depois a maior prioridade.</p></div>
            <button type="button" className="button button-primary shrink-0" onClick={() => { setEditing(null); setNotice(null); setActionError(null); }}><Plus size={16} /> Nova regra</button>
          </div>

          {data ? (
            <div className="grid gap-px border-b border-border bg-border sm:grid-cols-4">
              {[
                ["Total", data.summary.total],
                ["Ativas", data.summary.active],
                ["Inativas", data.summary.inactive],
                ["Conflitos", data.summary.conflict_count],
              ].map(([label, value]) => <div key={String(label)} className="bg-card px-6 py-5"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}
            </div>
          ) : null}

          {notice ? <p className="mx-6 mt-6 flex items-start gap-2 rounded-xl bg-sage-soft p-4 text-sm text-sage-strong" role="status"><CheckCircle2 className="mt-0.5 shrink-0" size={16} />{notice}</p> : null}
          {actionError ? <p className="mx-6 mt-6 text-sm text-destructive" role="alert">{actionError}</p> : null}

          {error ? (
            <div className="p-10 text-center"><p className="text-sm text-destructive">{bffErrorMessage(error)}</p><button type="button" className="button button-secondary mt-4" onClick={() => mutate()}><RefreshCw size={16} /> Tentar novamente</button></div>
          ) : isLoading ? (
            <div className="space-y-3 p-6" aria-label="Carregando regras tributárias">{[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl bg-muted" />)}</div>
          ) : data?.items.length ? (
            <div className="space-y-4 p-6 sm:p-8">{data.items.map((rule) => <RuleCard key={rule.id} rule={rule} busy={busyId === rule.id} onEdit={() => { setEditing(rule); setNotice(null); setActionError(null); }} onToggle={() => toggleRule(rule)} />)}</div>
          ) : (
            <div className="p-12 text-center"><Scale className="mx-auto text-sage-strong" size={32} /><p className="mt-4 font-medium">Nenhuma regra de ICMS cadastrada.</p><p className="mt-1 text-sm text-muted-foreground">Comece por uma regra geral e depois crie exceções para capítulos ou NCMs específicos.</p><button type="button" className="button button-primary mt-5" onClick={() => setEditing(null)}><Plus size={16} /> Criar primeira regra</button></div>
          )}
        </section>
      )}

      <TaxRuleSimulator key={`${profile?.state ?? ""}-${profile?.tax_regime ?? ""}`} clientId={client.id} profile={profile ?? null} />
    </div>
  );
}
