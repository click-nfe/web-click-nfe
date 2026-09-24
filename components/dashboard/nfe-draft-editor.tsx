"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  RefreshCw,
  Save,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, ReactNode, useMemo, useState } from "react";
import useSWR from "swr";

import { CountrySearch } from "@/components/dashboard/fiscal-reference-search";
import type {
  NfeDraftDetail,
  NfeDraftItem,
  NfeValidationIssue,
  UpdateNfeDraftItemPayload,
  UpdateNfeDraftPayload,
} from "@/lib/api/import-process";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import {
  adjustNfeDraftItemTax,
  nfeDraftUrl,
  updateNfeDraft,
  updateNfeDraftItem,
  validateNfeDraft,
} from "@/lib/bff/import-process";

type JsonObject = Record<string, unknown>;
type Severity = "error" | "warning";
type TabKey = "general" | "parties" | "items" | "taxes" | "import" | "transport" | "additional" | "validation";

type ItemForm = {
  id: string;
  itemNumber: number;
  productCode: string;
  description: string;
  ncm: string;
  cfop: string;
  cest: string;
  commercialUnit: string;
  commercialQuantity: string;
  commercialUnitValue: string;
  taxableUnit: string;
  taxableQuantity: string;
  taxableUnitValue: string;
  productValue: string;
  freightValue: string;
  insuranceValue: string;
  discountValue: string;
  otherValue: string;
  additionNumber: string;
  sequenceNumber: string;
  manufacturerCode: string;
  importPayload: JsonObject;
  icmsCst: string;
  icmsBase: string;
  icmsRate: string;
  icmsReductionRate: string;
  icmsDefermentRate: string;
  originalTaxSignature: string;
};

type EditorState = {
  operationNature: string;
  presenceIndicator: string;
  intermediaryIndicator: string;
  issuerStateRegistration: string;
  supplierLegalName: string;
  supplierForeignId: string;
  supplierCountryCode: string;
  supplierCountryName: string;
  supplierCountryIso: string;
  supplierStreet: string;
  supplierNumber: string;
  supplierComplement: string;
  supplierDistrict: string;
  supplierCity: string;
  paymentIndicator: string;
  paymentMethod: string;
  paymentDescription: string;
  paymentValue: string;
  freightMode: string;
  carrierTaxId: string;
  carrierName: string;
  carrierStateRegistration: string;
  carrierAddress: string;
  carrierCity: string;
  carrierState: string;
  volumeQuantity: string;
  volumeSpecies: string;
  volumeBrand: string;
  volumeNumbering: string;
  volumeNetWeight: string;
  volumeGrossWeight: string;
  afrmm: string;
  siscomexFee: string;
  thc: string;
  otherCost: string;
  automaticSummary: boolean;
  fiscalInfo: string;
  complementaryInfo: string;
  legalText: string;
  taxReason: string;
  items: ItemForm[];
};

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "general", label: "Dados gerais" },
  { key: "parties", label: "Emitente e exportador" },
  { key: "items", label: "Itens" },
  { key: "taxes", label: "Tributos" },
  { key: "import", label: "Importação e despesas" },
  { key: "transport", label: "Transporte e volumes" },
  { key: "additional", label: "Informações complementares" },
  { key: "validation", label: "Validação" },
];

const icmsCsts = ["00", "10", "20", "30", "40", "41", "50", "51", "60", "70", "90"];

function object(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function text(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function nullable(value: string) {
  return value.trim() || null;
}

function taxSignature(values: Pick<ItemForm, "cfop" | "icmsCst" | "icmsBase" | "icmsRate" | "icmsReductionRate" | "icmsDefermentRate">) {
  return JSON.stringify([
    values.cfop.trim(),
    values.icmsCst.trim(),
    values.icmsBase.trim(),
    values.icmsRate.trim(),
    values.icmsReductionRate.trim(),
    values.icmsDefermentRate.trim(),
  ]);
}

function itemForm(item: NfeDraftItem): ItemForm {
  const importPayload = object(item.import_payload);
  const icms = object(object(item.tax_payload).icms);
  const form = {
    id: item.id,
    itemNumber: item.item_number,
    productCode: text(item.product_code),
    description: text(item.description),
    ncm: text(item.ncm),
    cfop: text(item.cfop),
    cest: text(item.cest),
    commercialUnit: text(item.commercial_unit),
    commercialQuantity: text(item.commercial_quantity),
    commercialUnitValue: text(item.commercial_unit_value),
    taxableUnit: text(item.taxable_unit),
    taxableQuantity: text(item.taxable_quantity),
    taxableUnitValue: text(item.taxable_unit_value),
    productValue: text(item.product_value),
    freightValue: text(item.freight_value),
    insuranceValue: text(item.insurance_value),
    discountValue: text(item.discount_value),
    otherValue: text(item.other_value),
    additionNumber: text(importPayload.addition_number),
    sequenceNumber: text(importPayload.sequence_number),
    manufacturerCode: text(importPayload.manufacturer_code),
    importPayload,
    icmsCst: text(icms.cst),
    icmsBase: text(icms.base),
    icmsRate: text(icms.rate),
    icmsReductionRate: text(icms.reduction_rate),
    icmsDefermentRate: text(icms.deferment_rate),
    originalTaxSignature: "",
  };
  form.originalTaxSignature = taxSignature(form);
  return form;
}

function editorState(detail: NfeDraftDetail): EditorState {
  const payload = object(detail.draft.fiscal_payload);
  const document = object(payload.document);
  const issuer = object(payload.issuer);
  const recipient = object(payload.recipient);
  const recipientAddress = object(recipient.address);
  const payment = object(payload.payment);
  const transport = object(payload.transport);
  const carrier = object(transport.carrier);
  const volume = object(transport.volume);
  const costs = object(payload.additional_costs);
  const additional = object(payload.additional_info);
  const countryCode = text(recipientAddress.country_code);

  return {
    operationNature: text(document.operation_nature),
    presenceIndicator: text(document.presence_indicator),
    intermediaryIndicator: text(document.intermediary_indicator),
    issuerStateRegistration: text(issuer.state_registration),
    supplierLegalName: text(recipient.legal_name),
    supplierForeignId: text(recipient.foreign_id),
    supplierCountryCode: countryCode === "0000" ? "" : countryCode,
    supplierCountryName: text(recipientAddress.country_name),
    supplierCountryIso: text(recipientAddress.country_iso_alpha_2),
    supplierStreet: text(recipientAddress.street),
    supplierNumber: text(recipientAddress.number),
    supplierComplement: text(recipientAddress.complement),
    supplierDistrict: text(recipientAddress.district),
    supplierCity: text(recipientAddress.city_name),
    paymentIndicator: text(payment.payment_indicator || "0"),
    paymentMethod: text(payment.method),
    paymentDescription: text(payment.description),
    paymentValue: text(payment.value),
    freightMode: text(transport.freight_mode || "9"),
    carrierTaxId: text(carrier.tax_id),
    carrierName: text(carrier.name),
    carrierStateRegistration: text(carrier.state_registration),
    carrierAddress: text(carrier.address),
    carrierCity: text(carrier.city_name),
    carrierState: text(carrier.state),
    volumeQuantity: text(volume.quantity),
    volumeSpecies: text(volume.species),
    volumeBrand: text(volume.brand),
    volumeNumbering: text(volume.numbering),
    volumeNetWeight: text(volume.net_weight),
    volumeGrossWeight: text(volume.gross_weight),
    afrmm: text(costs.afrmm),
    siscomexFee: text(costs.siscomex_fee),
    thc: text(costs.thc),
    otherCost: text(costs.other),
    automaticSummary: Boolean(additional.automatic_summary),
    fiscalInfo: text(additional.fiscal),
    complementaryInfo: text(additional.complementary),
    legalText: text(additional.legal_text),
    taxReason: "",
    items: detail.items.map(itemForm),
  };
}

function tabForIssue(issue: NfeValidationIssue): TabKey {
  const field = issue.field ?? "";
  if (field.startsWith("issuer") || field.startsWith("recipient")) return "parties";
  if (field.startsWith("transport")) return "transport";
  if (field.startsWith("additional_info")) return "additional";
  if (field.startsWith("reconciliation") || field.startsWith("authorization")) return "validation";
  if (field.startsWith("tax_") || field.includes("tax_payload")) return "taxes";
  if (field.startsWith("duimp") || field.includes("import_payload") || field.startsWith("additional_costs")) return "import";
  if (field.startsWith("items")) return "items";
  return "general";
}

function issueStatus(issues: Array<NfeValidationIssue & { severity: Severity }>, paths: string[]) {
  const matches = issues.filter((issue) => paths.some((path) => issue.field === path || issue.field?.startsWith(`${path}.`)));
  return {
    severity: matches.some((issue) => issue.severity === "error") ? "error" as const : matches.length ? "warning" as const : null,
    message: matches[0]?.message,
  };
}

export function NfeDraftEditor({ processId, draftId }: { processId: string; draftId: string }) {
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [values, setValues] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const request = useSWR<NfeDraftDetail>(nfeDraftUrl(draftId), bffFetcher, {
    revalidateOnFocus: true,
    onSuccess: (detail) => setValues((current) => current ?? editorState(detail)),
  });

  const issues = useMemo(() => {
    const draft = request.data?.draft;
    return [
      ...(draft?.validation_errors ?? []).map((issue) => ({ ...issue, severity: "error" as const })),
      ...(draft?.validation_warnings ?? []).map((issue) => ({ ...issue, severity: "warning" as const })),
    ];
  }, [request.data]);

  const counts = useMemo(() => Object.fromEntries(tabs.map((tab) => [tab.key, {
    errors: issues.filter((issue) => issue.severity === "error" && tabForIssue(issue) === tab.key).length,
    warnings: issues.filter((issue) => issue.severity === "warning" && tabForIssue(issue) === tab.key).length,
  }])) as Record<TabKey, { errors: number; warnings: number }>, [issues]);

  function setValue<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setValues((current) => current ? { ...current, [key]: value } : current);
    setSuccess(null);
  }

  function setItem(index: number, patch: Partial<ItemForm>) {
    setValues((current) => current ? {
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    } : current);
    setSuccess(null);
  }

  async function reload() {
    const refreshed = await request.mutate();
    if (refreshed) setValues(editorState(refreshed));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values || !request.data) return;
    const changedTaxes = values.items.filter((item) => taxSignature(item) !== item.originalTaxSignature);
    if (changedTaxes.length && values.taxReason.trim().length < 10) {
      setActiveTab("taxes");
      setActionError("Informe uma justificativa com pelo menos 10 caracteres para auditar o ajuste tributário.");
      return;
    }

    setSaving(true);
    setActionError(null);
    setSuccess(null);
    try {
      const carrierFilled = [values.carrierTaxId, values.carrierName, values.carrierStateRegistration, values.carrierAddress, values.carrierCity, values.carrierState].some((value) => value.trim());
      const paymentFilled = values.paymentMethod.trim().length === 2;
      const metadata: UpdateNfeDraftPayload = {
        document: {
          operation_nature: nullable(values.operationNature),
          presence_indicator: nullable(values.presenceIndicator),
          intermediary_indicator: nullable(values.intermediaryIndicator),
        },
        foreign_supplier: {
          legal_name: nullable(values.supplierLegalName),
          foreign_id: nullable(values.supplierForeignId),
          country_code: nullable(values.supplierCountryCode),
          country_name: nullable(values.supplierCountryName),
          country_iso_alpha_2: nullable(values.supplierCountryIso),
          address: {
            street: nullable(values.supplierStreet),
            number: nullable(values.supplierNumber),
            complement: nullable(values.supplierComplement),
            district: nullable(values.supplierDistrict),
            city_name: nullable(values.supplierCity),
          },
        },
        transport: {
          freight_mode: values.freightMode,
          carrier: carrierFilled ? {
            tax_id: nullable(values.carrierTaxId),
            name: nullable(values.carrierName),
            state_registration: nullable(values.carrierStateRegistration),
            address: nullable(values.carrierAddress),
            city_name: nullable(values.carrierCity),
            state: nullable(values.carrierState.toUpperCase()),
          } : null,
          volume: {
            quantity: values.volumeQuantity ? Number(values.volumeQuantity) : null,
            species: nullable(values.volumeSpecies),
            brand: nullable(values.volumeBrand),
            numbering: nullable(values.volumeNumbering),
            net_weight: nullable(values.volumeNetWeight),
            gross_weight: nullable(values.volumeGrossWeight),
          },
        },
        additional_costs: {
          afrmm: values.afrmm || "0",
          siscomex_fee: values.siscomexFee || "0",
          thc: values.thc || "0",
          other: values.otherCost || "0",
        },
        additional_info: {
          automatic_summary: values.automaticSummary,
          fiscal: nullable(values.fiscalInfo),
          complementary: nullable(values.complementaryInfo),
          legal_text: nullable(values.legalText),
        },
      };
      if (values.issuerStateRegistration.trim()) {
        metadata.issuer = { state_registration: values.issuerStateRegistration.trim() };
      }
      if (paymentFilled) metadata.payment = {
        payment_indicator: values.paymentIndicator,
        method: values.paymentMethod,
        description: nullable(values.paymentDescription),
        value: nullable(values.paymentValue),
      };

      await updateNfeDraft(draftId, metadata);
      for (const item of values.items) {
        const itemPayload: UpdateNfeDraftItemPayload = {
          ...(item.productCode.trim() ? { product_code: item.productCode.trim() } : {}),
          description: item.description.trim(),
          ncm: item.ncm.replace(/\D/g, ""),
          cfop: item.cfop.replace(/\D/g, ""),
          cest: nullable(item.cest),
          commercial_unit: item.commercialUnit.trim(),
          commercial_quantity: item.commercialQuantity,
          commercial_unit_value: item.commercialUnitValue,
          taxable_unit: item.taxableUnit.trim(),
          taxable_quantity: item.taxableQuantity,
          taxable_unit_value: item.taxableUnitValue,
          product_value: item.productValue,
          freight_value: item.freightValue || "0",
          insurance_value: item.insuranceValue || "0",
          discount_value: item.discountValue || "0",
          other_value: item.otherValue || "0",
          import_payload: {
            ...item.importPayload,
            addition_number: nullable(item.additionNumber),
            sequence_number: nullable(item.sequenceNumber),
            manufacturer_code: nullable(item.manufacturerCode),
          },
        };
        await updateNfeDraftItem(draftId, item.id, itemPayload);
      }
      for (const item of changedTaxes) {
        await adjustNfeDraftItemTax(draftId, item.id, {
          source: "manual_adjustment",
          reason: values.taxReason.trim(),
          cfop: item.cfop,
          icms: {
            cst: item.icmsCst,
            base: item.icmsBase,
            rate: nullable(item.icmsRate),
            reduction_rate: nullable(item.icmsReductionRate),
            deferment_rate: nullable(item.icmsDefermentRate),
          },
        });
      }
      await validateNfeDraft(draftId);
      const refreshed = await request.mutate();
      if (refreshed) setValues(editorState(refreshed));
      localStorage.setItem("click-nfe:draft-updated", JSON.stringify({ draftId, at: Date.now() }));
      setSuccess("Alterações salvas e rascunho revalidado. Ao retornar ao fluxo, os dados serão atualizados automaticamente.");
    } catch (error) {
      setActionError(bffErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (request.error) return <LoadError message={bffErrorMessage(request.error)} retry={reload} />;
  if (request.isLoading || !request.data || !values) return <div className="surface-card flex items-center justify-center gap-2 p-16 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" size={19} /> Carregando configuração do rascunho...</div>;

  const payload = object(request.data.draft.fiscal_payload);
  const duimp = object(payload.duimp);
  const issuer = object(payload.issuer);

  return (
    <form onSubmit={save} className="mx-auto max-w-[96rem] space-y-6">
      <header className="surface-card p-5 sm:p-7">
        <Link href={`/dashboard/processos/${processId}/emissao#rascunhos-nfe`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><ArrowLeft size={16} /> Voltar ao fluxo da emissão</Link>
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Configuração da NF-e filha</p>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Revisar rascunho</h1>
            <p className="mt-2 text-sm text-muted-foreground">DUIMP {text(duimp.number) || "não informada"} · Série {request.data.draft.series} · Ambiente de produção</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill errors={request.data.draft.validation_errors.length} warnings={request.data.draft.validation_warnings.length} />
            <button type="button" className="button button-secondary" disabled={saving} onClick={reload}><RefreshCw size={16} /> Atualizar</button>
            <button type="submit" className="button button-primary" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{saving ? "Salvando..." : "Salvar e revalidar"}</button>
          </div>
        </div>
      </header>

      <div className="surface-card overflow-hidden">
        <nav className="flex gap-2 overflow-x-auto border-b border-border p-3" aria-label="Categorias do rascunho">
          {tabs.map((tab) => {
            const count = counts[tab.key];
            return <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${activeTab === tab.key ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"}`} aria-current={activeTab === tab.key ? "page" : undefined}>{tab.label}{count.errors ? <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[0.65rem] text-white">{count.errors}</span> : count.warnings ? <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[0.65rem] text-white">{count.warnings}</span> : <CheckCircle2 size={14} />}</button>;
          })}
        </nav>

        <div className="p-5 sm:p-7">
          {activeTab === "general" ? <GeneralTab values={values} setValue={setValue} issues={issues} /> : null}
          {activeTab === "parties" ? <PartiesTab values={values} setValue={setValue} issues={issues} issuer={issuer} registrationDate={text(duimp.registration_date)} saving={saving} /> : null}
          {activeTab === "items" ? <ItemsTab values={values} setItem={setItem} issues={issues} /> : null}
          {activeTab === "taxes" ? <TaxesTab values={values} setValue={setValue} setItem={setItem} issues={issues} /> : null}
          {activeTab === "import" ? <ImportTab values={values} setValue={setValue} setItem={setItem} issues={issues} duimp={duimp} /> : null}
          {activeTab === "transport" ? <TransportTab values={values} setValue={setValue} issues={issues} /> : null}
          {activeTab === "additional" ? <AdditionalTab values={values} setValue={setValue} issues={issues} /> : null}
          {activeTab === "validation" ? <ValidationTab detail={request.data} issues={issues} /> : null}
        </div>
      </div>

      {actionError ? <div className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300" role="alert"><CircleAlert className="mt-0.5 shrink-0" size={18} />{actionError}</div> : null}
      {success ? <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-sage-soft p-4 text-sm text-sage-strong" role="status"><CheckCircle2 className="mt-0.5 shrink-0" size={18} />{success}</div> : null}

      <footer className="sticky bottom-4 z-10 flex justify-end rounded-2xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur">
        <button type="submit" className="button button-primary" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" size={16} /> : <Save size={16} />}{saving ? "Salvando e revalidando..." : "Salvar alterações"}</button>
      </footer>
    </form>
  );
}

type SetValue = <K extends keyof EditorState>(key: K, value: EditorState[K]) => void;
type SetItem = (index: number, patch: Partial<ItemForm>) => void;
type Issue = NfeValidationIssue & { severity: Severity };

function GeneralTab({ values, setValue, issues }: { values: EditorState; setValue: SetValue; issues: Issue[] }) {
  return <TabSection title="Dados gerais da NF-e" description="A numeração e a chave de acesso permanecem protegidas e serão tratadas em uma etapa posterior."><div className="grid gap-5 md:grid-cols-2"><Field label="Natureza da operação" paths={["document.operation_nature"]} issues={issues} wide><input className="field-input" value={values.operationNature} onChange={(event) => setValue("operationNature", event.target.value)} /></Field><Field label="Indicador de presença" paths={["document.presence_indicator"]} issues={issues}><select className="field-input" value={values.presenceIndicator} onChange={(event) => setValue("presenceIndicator", event.target.value)}><option value="">Não informado</option><option value="0">0 — Não se aplica</option><option value="1">1 — Presencial</option><option value="2">2 — Internet</option><option value="9">9 — Outros</option></select></Field><Field label="Indicador de intermediador" paths={["document.intermediary_indicator"]} issues={issues}><select className="field-input" value={values.intermediaryIndicator} onChange={(event) => setValue("intermediaryIndicator", event.target.value)}><option value="">Não informado</option><option value="0">Sem intermediador</option><option value="1">Com intermediador</option></select></Field></div><h3 className="mt-8 border-b border-border pb-2 font-semibold">Pagamento</h3><div className="mt-5 grid gap-5 md:grid-cols-2"><Field label="Método (código com 2 dígitos)" paths={["payment.method"]} issues={issues}><input className="field-input font-mono" maxLength={2} value={values.paymentMethod} onChange={(event) => setValue("paymentMethod", event.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="90" /></Field><Field label="Indicador" paths={["payment.payment_indicator"]} issues={issues}><select className="field-input" value={values.paymentIndicator} onChange={(event) => setValue("paymentIndicator", event.target.value)}><option value="0">Pagamento à vista</option><option value="1">Pagamento a prazo</option></select></Field><Field label="Descrição" paths={["payment.description"]} issues={issues}><input className="field-input" value={values.paymentDescription} onChange={(event) => setValue("paymentDescription", event.target.value)} /></Field><Field label="Valor" paths={["payment.value"]} issues={issues}><input className="field-input" inputMode="decimal" value={values.paymentValue} onChange={(event) => setValue("paymentValue", event.target.value)} /></Field></div></TabSection>;
}

function PartiesTab({ values, setValue, issues, issuer, registrationDate, saving }: { values: EditorState; setValue: SetValue; issues: Issue[]; issuer: JsonObject; registrationDate: string; saving: boolean }) {
  const countryIssue = issueStatus(issues, ["recipient.address.country_code", "recipient.address.country_name"]);
  return <TabSection title="Emitente e fornecedor estrangeiro" description="O país deve ser selecionado no catálogo fiscal para preencher automaticamente o código BACEN."><h3 className="border-b border-border pb-2 font-semibold">Emitente</h3><dl className="mt-4 grid gap-4 rounded-2xl bg-muted/35 p-4 md:grid-cols-2"><Info label="Razão social" value={issuer.legal_name} /><Info label="CNPJ" value={issuer.cnpj} /></dl><div className="mt-5"><Field label="Inscrição estadual" paths={["issuer.state_registration"]} issues={issues}><input className="field-input" value={values.issuerStateRegistration} onChange={(event) => setValue("issuerStateRegistration", event.target.value)} /></Field></div><h3 className="mt-8 border-b border-border pb-2 font-semibold">Fornecedor estrangeiro</h3><div className="mt-5 grid gap-5 md:grid-cols-2"><Field label="Nome / razão social" paths={["recipient.legal_name"]} issues={issues} wide><input className="field-input" value={values.supplierLegalName} onChange={(event) => setValue("supplierLegalName", event.target.value)} /></Field><Field label="Identificação no exterior" paths={["recipient.foreign_id"]} issues={issues}><input className="field-input" value={values.supplierForeignId} onChange={(event) => setValue("supplierForeignId", event.target.value)} /></Field><div className={`md:col-span-2 rounded-xl ${countryIssue.severity === "error" ? "ring-2 ring-destructive/50" : countryIssue.severity === "warning" ? "ring-2 ring-amber-400/50" : ""}`}><CountrySearch value={values.supplierCountryName} selectedCode={values.supplierCountryCode} activeOn={registrationDate} disabled={saving} onQueryChange={(countryName) => { setValue("supplierCountryName", countryName); setValue("supplierCountryCode", ""); setValue("supplierCountryIso", ""); }} onSelect={(country) => { setValue("supplierCountryName", country.name); setValue("supplierCountryCode", country.bacen_code); setValue("supplierCountryIso", country.iso_alpha_2 ?? ""); }} />{countryIssue.message ? <p className={`mt-2 text-xs ${countryIssue.severity === "error" ? "text-destructive" : "text-amber-700 dark:text-amber-300"}`}>{countryIssue.message}</p> : null}</div><Field label="Logradouro" paths={["recipient.address.street"]} issues={issues} wide><input className="field-input" value={values.supplierStreet} onChange={(event) => setValue("supplierStreet", event.target.value)} /></Field><Field label="Número" paths={["recipient.address.number"]} issues={issues}><input className="field-input" value={values.supplierNumber} onChange={(event) => setValue("supplierNumber", event.target.value)} /></Field><Field label="Complemento" paths={["recipient.address.complement"]} issues={issues}><input className="field-input" value={values.supplierComplement} onChange={(event) => setValue("supplierComplement", event.target.value)} /></Field><Field label="Bairro / distrito" paths={["recipient.address.district"]} issues={issues}><input className="field-input" value={values.supplierDistrict} onChange={(event) => setValue("supplierDistrict", event.target.value)} /></Field><Field label="Cidade" paths={["recipient.address.city_name"]} issues={issues}><input className="field-input" value={values.supplierCity} onChange={(event) => setValue("supplierCity", event.target.value)} /></Field></div></TabSection>;
}

function ItemsTab({ values, setItem, issues }: { values: EditorState; setItem: SetItem; issues: Issue[] }) {
  return <TabSection title="Itens da nota" description="Revise os dados comerciais. Os totais serão recalculados pela API."><div className="space-y-5">{values.items.map((item, index) => <details key={item.id} open={values.items.length === 1} className="rounded-2xl border border-border p-4"><summary className="cursor-pointer font-semibold">Item {item.itemNumber} · {item.description || "Sem descrição"}</summary><div className="mt-5 grid gap-5 border-t border-border pt-5 md:grid-cols-2"><Field label="Código do produto" paths={[`items[${index + 1}].product_code`]} issues={issues}><input className="field-input" value={item.productCode} onChange={(event) => setItem(index, { productCode: event.target.value })} /></Field><Field label="Descrição" paths={[`items[${index + 1}].description`]} issues={issues} wide><input className="field-input" value={item.description} onChange={(event) => setItem(index, { description: event.target.value })} /></Field><Field label="NCM" paths={[`items[${index + 1}].ncm`]} issues={issues}><input className="field-input font-mono" inputMode="numeric" maxLength={8} value={item.ncm} onChange={(event) => setItem(index, { ncm: event.target.value.replace(/\D/g, "").slice(0, 8) })} /></Field><Field label="CFOP" paths={[`items[${index + 1}].cfop`]} issues={issues}><input className="field-input font-mono" inputMode="numeric" maxLength={4} value={item.cfop} onChange={(event) => setItem(index, { cfop: event.target.value.replace(/\D/g, "").slice(0, 4) })} /></Field><Field label="CEST" paths={[`items[${index + 1}].cest`]} issues={issues}><input className="field-input font-mono" value={item.cest} onChange={(event) => setItem(index, { cest: event.target.value })} /></Field><Field label="Unidade comercial" paths={[`items[${index + 1}].commercial_unit`]} issues={issues}><input className="field-input" value={item.commercialUnit} onChange={(event) => setItem(index, { commercialUnit: event.target.value })} /></Field><Field label="Quantidade comercial" paths={[`items[${index + 1}].commercial_quantity`]} issues={issues}><input className="field-input" inputMode="decimal" value={item.commercialQuantity} onChange={(event) => setItem(index, { commercialQuantity: event.target.value })} /></Field><Field label="Valor unitário comercial" paths={[`items[${index + 1}].commercial_unit_value`]} issues={issues}><input className="field-input" inputMode="decimal" value={item.commercialUnitValue} onChange={(event) => setItem(index, { commercialUnitValue: event.target.value })} /></Field><Field label="Unidade tributável" paths={[`items[${index + 1}].taxable_unit`]} issues={issues}><input className="field-input" value={item.taxableUnit} onChange={(event) => setItem(index, { taxableUnit: event.target.value })} /></Field><Field label="Quantidade tributável" paths={[`items[${index + 1}].taxable_quantity`]} issues={issues}><input className="field-input" inputMode="decimal" value={item.taxableQuantity} onChange={(event) => setItem(index, { taxableQuantity: event.target.value })} /></Field><Field label="Valor unitário tributável" paths={[`items[${index + 1}].taxable_unit_value`]} issues={issues}><input className="field-input" inputMode="decimal" value={item.taxableUnitValue} onChange={(event) => setItem(index, { taxableUnitValue: event.target.value })} /></Field><Field label="Valor do produto" paths={[`items[${index + 1}].product_value`]} issues={issues}><input className="field-input" inputMode="decimal" value={item.productValue} onChange={(event) => setItem(index, { productValue: event.target.value })} /></Field></div></details>)}</div></TabSection>;
}

function TaxesTab({ values, setValue, setItem, issues }: { values: EditorState; setValue: SetValue; setItem: SetItem; issues: Issue[] }) {
  return <TabSection title="Tributos" description="Ajustes manuais exigem justificativa e ficam registrados na trilha de auditoria."><Field label="Justificativa do ajuste tributário" paths={["tax_rules"]} issues={issues} wide><textarea className="field-input min-h-24 resize-y" value={values.taxReason} onChange={(event) => setValue("taxReason", event.target.value)} placeholder="Explique a razão da alteração manual (mínimo de 10 caracteres)." /></Field><div className="mt-6 space-y-5">{values.items.map((item, index) => <section key={item.id} className="rounded-2xl border border-border p-4"><h3 className="font-semibold">Item {item.itemNumber} · {item.description}</h3><div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3"><Field label="CST do ICMS" paths={[`items[${index + 1}].tax_payload`, "tax_rules"]} issues={issues}><select className="field-input" value={item.icmsCst} onChange={(event) => setItem(index, { icmsCst: event.target.value })}>{icmsCsts.map((cst) => <option key={cst} value={cst}>{cst}</option>)}</select></Field><Field label="Base do ICMS" paths={[`items[${index + 1}].tax_payload.icms.base`]} issues={issues}><input className="field-input" inputMode="decimal" value={item.icmsBase} onChange={(event) => setItem(index, { icmsBase: event.target.value })} /></Field><Field label="Alíquota (%)" paths={[`items[${index + 1}].tax_payload.icms.rate`]} issues={issues}><input className="field-input" inputMode="decimal" value={item.icmsRate} onChange={(event) => setItem(index, { icmsRate: event.target.value })} /></Field><Field label="Redução da base (%)" paths={[`items[${index + 1}].tax_payload.icms.reduction_rate`]} issues={issues}><input className="field-input" inputMode="decimal" value={item.icmsReductionRate} onChange={(event) => setItem(index, { icmsReductionRate: event.target.value })} /></Field><Field label="Diferimento (%)" paths={[`items[${index + 1}].tax_payload.icms.deferment_rate`]} issues={issues}><input className="field-input" inputMode="decimal" value={item.icmsDefermentRate} onChange={(event) => setItem(index, { icmsDefermentRate: event.target.value })} /></Field></div></section>)}</div></TabSection>;
}

function ImportTab({ values, setValue, setItem, issues, duimp }: { values: EditorState; setValue: SetValue; setItem: SetItem; issues: Issue[]; duimp: JsonObject }) {
  return <TabSection title="Importação e despesas" description="Dados da DUIMP permanecem visíveis; despesas e identificadores de adição podem ser ajustados."><dl className="grid gap-4 rounded-2xl bg-muted/35 p-4 md:grid-cols-3"><Info label="Número da DUIMP" value={duimp.number} /><Info label="Registro" value={duimp.registration_date} /><Info label="Desembaraço" value={duimp.clearance_date} /><Info label="Local" value={duimp.clearance_location} /><Info label="UF" value={duimp.clearance_state} /><Info label="Via" value={duimp.transport_mode_code} /></dl><h3 className="mt-8 border-b border-border pb-2 font-semibold">Despesas compartilhadas</h3><div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4"><MoneyField label="AFRMM" value={values.afrmm} onChange={(value) => setValue("afrmm", value)} paths={["additional_costs.afrmm"]} issues={issues} /><MoneyField label="Taxa Siscomex" value={values.siscomexFee} onChange={(value) => setValue("siscomexFee", value)} paths={["additional_costs.siscomex_fee"]} issues={issues} /><MoneyField label="THC" value={values.thc} onChange={(value) => setValue("thc", value)} paths={["additional_costs.thc"]} issues={issues} /><MoneyField label="Outras despesas" value={values.otherCost} onChange={(value) => setValue("otherCost", value)} paths={["additional_costs.other"]} issues={issues} /></div><h3 className="mt-8 border-b border-border pb-2 font-semibold">Adições por item</h3><div className="mt-5 space-y-4">{values.items.map((item, index) => <div key={item.id} className="grid gap-5 rounded-2xl border border-border p-4 md:grid-cols-3"><p className="font-semibold md:col-span-3">Item {item.itemNumber} · {item.description}</p><Field label="Número da adição" paths={[`items[${index + 1}].import_payload.addition_number`]} issues={issues}><input className="field-input" value={item.additionNumber} onChange={(event) => setItem(index, { additionNumber: event.target.value })} /></Field><Field label="Sequência" paths={[`items[${index + 1}].import_payload.sequence_number`]} issues={issues}><input className="field-input" value={item.sequenceNumber} onChange={(event) => setItem(index, { sequenceNumber: event.target.value })} /></Field><Field label="Código do fabricante" paths={[`items[${index + 1}].import_payload.manufacturer_code`]} issues={issues}><input className="field-input" value={item.manufacturerCode} onChange={(event) => setItem(index, { manufacturerCode: event.target.value })} /></Field></div>)}</div></TabSection>;
}

function TransportTab({ values, setValue, issues }: { values: EditorState; setValue: SetValue; issues: Issue[] }) {
  return <TabSection title="Transporte e volumes" description="Complete especialmente quantidade, espécie e peso bruto, atualmente sinalizados pelo validador."><div className="grid gap-5 md:grid-cols-2"><Field label="Modalidade do frete" paths={["transport.freight_mode"]} issues={issues}><select className="field-input" value={values.freightMode} onChange={(event) => setValue("freightMode", event.target.value)}><option value="0">0 — Emitente</option><option value="1">1 — Destinatário</option><option value="2">2 — Terceiros</option><option value="3">3 — Próprio emitente</option><option value="4">4 — Próprio destinatário</option><option value="9">9 — Sem frete</option></select></Field><Field label="Transportadora" paths={["transport.carrier"]} issues={issues}><input className="field-input" value={values.carrierName} onChange={(event) => setValue("carrierName", event.target.value)} /></Field><Field label="CNPJ/CPF" paths={["transport.carrier.tax_id"]} issues={issues}><input className="field-input" value={values.carrierTaxId} onChange={(event) => setValue("carrierTaxId", event.target.value)} /></Field><Field label="Inscrição estadual" paths={["transport.carrier.state_registration"]} issues={issues}><input className="field-input" value={values.carrierStateRegistration} onChange={(event) => setValue("carrierStateRegistration", event.target.value)} /></Field><Field label="Endereço" paths={["transport.carrier.address"]} issues={issues}><input className="field-input" value={values.carrierAddress} onChange={(event) => setValue("carrierAddress", event.target.value)} /></Field><Field label="Cidade" paths={["transport.carrier.city_name"]} issues={issues}><input className="field-input" value={values.carrierCity} onChange={(event) => setValue("carrierCity", event.target.value)} /></Field><Field label="UF" paths={["transport.carrier.state"]} issues={issues}><input className="field-input uppercase" maxLength={2} value={values.carrierState} onChange={(event) => setValue("carrierState", event.target.value.slice(0, 2).toUpperCase())} /></Field></div><h3 className="mt-8 border-b border-border pb-2 font-semibold">Volumes</h3><div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3"><Field label="Quantidade" paths={["transport.volume", "transport.volume.quantity"]} issues={issues}><input className="field-input" type="number" min="1" value={values.volumeQuantity} onChange={(event) => setValue("volumeQuantity", event.target.value)} /></Field><Field label="Espécie" paths={["transport.volume", "transport.volume.species"]} issues={issues}><input className="field-input" value={values.volumeSpecies} onChange={(event) => setValue("volumeSpecies", event.target.value)} /></Field><Field label="Marca" paths={["transport.volume.brand"]} issues={issues}><input className="field-input" value={values.volumeBrand} onChange={(event) => setValue("volumeBrand", event.target.value)} /></Field><Field label="Numeração" paths={["transport.volume.numbering"]} issues={issues}><input className="field-input" value={values.volumeNumbering} onChange={(event) => setValue("volumeNumbering", event.target.value)} /></Field><Field label="Peso líquido" paths={["transport.volume.net_weight"]} issues={issues}><input className="field-input" inputMode="decimal" value={values.volumeNetWeight} onChange={(event) => setValue("volumeNetWeight", event.target.value)} /></Field><Field label="Peso bruto" paths={["transport.volume", "transport.volume.gross_weight"]} issues={issues}><input className="field-input" inputMode="decimal" value={values.volumeGrossWeight} onChange={(event) => setValue("volumeGrossWeight", event.target.value)} /></Field></div></TabSection>;
}

function AdditionalTab({ values, setValue, issues }: { values: EditorState; setValue: SetValue; issues: Issue[] }) {
  return <TabSection title="Informações complementares" description="Textos fiscais e legais são preservados no rascunho e auditados antes da geração do XML."><label className="flex items-center gap-3 rounded-xl bg-muted/40 p-4 text-sm font-semibold"><input type="checkbox" checked={values.automaticSummary} onChange={(event) => setValue("automaticSummary", event.target.checked)} /> Gerar resumo automático da importação</label><div className="mt-5 space-y-5"><Field label="Informações fiscais" paths={["additional_info.fiscal"]} issues={issues} wide><textarea className="field-input min-h-28 resize-y" value={values.fiscalInfo} onChange={(event) => setValue("fiscalInfo", event.target.value)} /></Field><Field label="Informações complementares" paths={["additional_info.complementary"]} issues={issues} wide><textarea className="field-input min-h-28 resize-y" value={values.complementaryInfo} onChange={(event) => setValue("complementaryInfo", event.target.value)} /></Field><Field label="Fundamentação legal / TTD" paths={["additional_info.legal_text"]} issues={issues} wide><textarea className="field-input min-h-28 resize-y" value={values.legalText} onChange={(event) => setValue("legalText", event.target.value)} /></Field></div></TabSection>;
}

function ValidationTab({ detail, issues }: { detail: NfeDraftDetail; issues: Issue[] }) {
  const reconciliation = object(object(detail.draft.fiscal_payload).reconciliation);
  const checks = Array.isArray(reconciliation.checks) ? reconciliation.checks.filter((check): check is JsonObject => Boolean(check) && typeof check === "object") : [];
  return <TabSection title="Validação e reconciliação" description="Erros impedem o avanço. Avisos exigem conferência antes da autorização final.">{issues.length ? <div className="space-y-3">{issues.map((issue, index) => <div key={`${issue.severity}-${index}`} className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${issue.severity === "error" ? "border-red-500/25 bg-red-500/5 text-red-700 dark:text-red-300" : "border-amber-400/30 bg-amber-500/5 text-amber-800 dark:text-amber-300"}`}>{issue.severity === "error" ? <CircleAlert className="mt-0.5 shrink-0" size={17} /> : <AlertTriangle className="mt-0.5 shrink-0" size={17} />}<div><p className="font-semibold">{issue.field || "Validação"}</p><p className="mt-1">{issue.message || issue.code || "Revisão necessária"}</p></div></div>)}</div> : <div className="rounded-2xl border border-primary/20 bg-sage-soft p-5 text-sage-strong"><p className="font-semibold">Rascunho sem erros ou avisos</p><p className="mt-1 text-sm">Os dados estão prontos para o próximo checkpoint.</p></div>}{checks.length ? <div className="mt-8"><h3 className="border-b border-border pb-2 font-semibold">Conferências de totais</h3><div className="mt-4 grid gap-3 md:grid-cols-2">{checks.map((check, index) => <div key={text(check.name) || index} className="rounded-xl bg-muted/40 p-4 text-sm"><p className="font-semibold">{text(check.name) || `Conferência ${index + 1}`}</p><p className="mt-2 text-muted-foreground">Esperado: {text(check.expected)} · Calculado: {text(check.actual || check.allocated)} · Diferença: {text(check.difference)}</p></div>)}</div></div> : null}</TabSection>;
}

function TabSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section><div className="mb-7"><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{description}</p></div>{children}</section>;
}

function Field({ label, paths, issues, children, wide = false }: { label: string; paths: string[]; issues: Issue[]; children: ReactNode; wide?: boolean }) {
  const status = issueStatus(issues, paths);
  return <label className={`${wide ? "md:col-span-2" : ""} block rounded-xl ${status.severity === "error" ? "ring-2 ring-destructive/50" : status.severity === "warning" ? "ring-2 ring-amber-400/50" : ""}`}><span className="field-label">{label}</span>{children}{status.message ? <span className={`mt-2 block px-1 text-xs ${status.severity === "error" ? "text-destructive" : "text-amber-700 dark:text-amber-300"}`}>{status.message}</span> : null}</label>;
}

function MoneyField({ label, value, onChange, paths, issues }: { label: string; value: string; onChange: (value: string) => void; paths: string[]; issues: Issue[] }) {
  return <Field label={label} paths={paths} issues={issues}><input className="field-input" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} /></Field>;
}

function Info({ label, value }: { label: string; value: unknown }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{text(value) || "Não informado"}</dd></div>;
}

function StatusPill({ errors, warnings }: { errors: number; warnings: number }) {
  if (errors) return <span className="rounded-full bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">{errors} erro(s) · {warnings} aviso(s)</span>;
  if (warnings) return <span className="rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">{warnings} aviso(s)</span>;
  return <span className="rounded-full bg-sage-soft px-3 py-2 text-xs font-semibold text-sage-strong">Sem pendências</span>;
}

function LoadError({ message, retry }: { message: string; retry: () => unknown }) {
  return <div className="surface-card p-10 text-center"><CircleAlert className="mx-auto text-destructive" size={28} /><p className="mt-4 text-sm text-destructive">{message}</p><button type="button" className="button button-secondary mt-5" onClick={retry}><RefreshCw size={16} /> Tentar novamente</button></div>;
}
