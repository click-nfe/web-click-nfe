"use client";

import { ArrowRight, Download, FileSpreadsheet, LoaderCircle, Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";

import type { SimplifiedConfig, SimplifiedItem, SimplifiedSaved } from "@/lib/api/simplified-issuance";
import { routes } from "@/lib/api/routes";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import { saveSimplifiedConfig, startSimplifiedProcess } from "@/lib/bff/simplified-issuance";
import { downloadSimplifiedWorkbook, emptySimplifiedConfig, importSimplifiedWorkbook } from "@/lib/simplified-issuance-import";

const taxFields: Array<[string, string]> = [
  ["ii_rate", "II %"], ["ipi_rate", "IPI %"], ["pis_rate", "PIS %"],
  ["cofins_rate", "COFINS %"], ["icms_cst", "ICMS CST"],
  ["icms_rate", "ICMS %"], ["icms_base_reduction_rate", "Redução da base ICMS %"],
];
const emptyItem = (): SimplifiedItem => ({
  reference: "", product_code: "", description: "", ncm: "", cfop: "", unit: "",
  import_purpose: "", tax_configuration: {},
});

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="block min-w-0"><span className="field-label">{label}</span><input className="field-input" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label>;
}

export function ClientSimplifiedIssuance({ clientId }: { clientId: string }) {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<SimplifiedSaved>(routes.bff.client.simplifiedIssuance(clientId), bffFetcher);
  const [editing, setEditing] = useState<SimplifiedConfig | null>(null);
  const [working, setWorking] = useState(false);
  const [starting, setStarting] = useState(false);
  const [notice, setNotice] = useState("");
  const [issue, setIssue] = useState("");
  const form = editing ?? data?.config ?? emptySimplifiedConfig();

  function section(section: "document" | "transport" | "additional_info", key: string, value: string) {
    setEditing({ ...form, [section]: { ...form[section], [key]: value } });
  }
  function itemChange(index: number, key: keyof SimplifiedItem, value: string) {
    const items = [...form.items];
    items[index] = { ...items[index], [key]: value };
    setEditing({ ...form, items });
  }
  function taxChange(index: number, key: string, value: string) {
    const items = [...form.items];
    items[index] = { ...items[index], tax_configuration: { ...items[index].tax_configuration, [key]: value } };
    setEditing({ ...form, items });
  }

  async function upload(file?: File) {
    if (!file) return;
    setWorking(true); setIssue(""); setNotice("");
    try {
      const imported = await importSimplifiedWorkbook(file);
      setEditing(imported);
      setNotice(`${imported.items.length} produto(s) encontrados. Revise os códigos, tributos e transporte antes de salvar. Campos ausentes ficaram vazios.`);
    } catch (reason) { setIssue(reason instanceof Error ? reason.message : "Não foi possível ler a planilha."); }
    finally { setWorking(false); }
  }

  async function save() {
    setWorking(true); setIssue(""); setNotice("");
    try {
      const saved = await saveSimplifiedConfig(clientId, form);
      setEditing(null);
      await mutate(saved, { revalidate: false });
      setNotice("Configuração salva. Cada nova emissão receberá uma cópia destes dados.");
    } catch (reason) { setIssue(bffErrorMessage(reason)); }
    finally { setWorking(false); }
  }

  async function start() {
    setStarting(true); setIssue("");
    try {
      const process = await startSimplifiedProcess(clientId);
      router.push(`/dashboard/processos/${process.id}/emissao`);
    } catch (reason) { setIssue(bffErrorMessage(reason)); setStarting(false); }
  }

  if (isLoading && !data) return <div className="surface-card mt-8 h-64 animate-pulse" aria-label="Carregando configuração" />;
  if (error && !data) return <div className="surface-card mt-8 p-8 text-destructive">{bffErrorMessage(error)}</div>;

  return <div className="mt-8 space-y-6">
    <section className="surface-card p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><p className="eyebrow">Cadastro reutilizável</p><h2 className="mt-3 text-2xl font-semibold">Emissão simplificada</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Preencha manualmente ou importe uma planilha. Os dados serão usados como ponto de partida em novas emissões deste cliente; DUIMP, quantidades e valores de cada operação serão consultados no processo.</p></div>
        {data?.config ? <button type="button" className="button button-primary" onClick={start} disabled={starting || Boolean(editing)}>
          {starting ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          {starting ? "Iniciando..." : "Iniciar emissão simplificada"}
        </button> : null}
      </div>
      <div className="mt-6 rounded-xl border border-dashed border-border p-5">
        <label className="inline-flex cursor-pointer items-center gap-2 font-semibold text-sage-strong">
          <FileSpreadsheet size={19} /> Importar planilha .xls ou .xlsx
          <input type="file" accept=".xls,.xlsx" className="sr-only" disabled={working} onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
        </label>
        <p className="mt-2 text-sm text-muted-foreground">A planilha preenche o formulário abaixo para revisão. O arquivo não é enviado ao servidor.</p>
        <button type="button" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-sage-strong underline" onClick={() => void downloadSimplifiedWorkbook().catch(() => setIssue("Não foi possível gerar o modelo da planilha."))}><Download size={16} /> Baixar modelo preenchível</button>
      </div>
      {notice ? <p className="mt-5 rounded-xl bg-sage-soft p-4 text-sm text-sage-strong" role="status">{notice}</p> : null}
      {issue ? <p className="mt-5 text-sm text-destructive" role="alert">{issue}</p> : null}
    </section>

    <section className="surface-card p-6 sm:p-8">
      <h3 className="text-lg font-semibold">Dados gerais e transporte</h3>
      <p className="mt-1 text-sm text-muted-foreground">O emitente vem do perfil fiscal do cliente. Campos não preenchidos permanecem em branco.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Natureza da operação" value={form.document.operation_nature ?? ""} onChange={(v) => section("document", "operation_nature", v)} />
        <label><span className="field-label">Modalidade do frete</span><select className="field-input" value={form.transport.freight_mode ?? ""} onChange={(e) => section("transport", "freight_mode", e.target.value)}><option value="">Definir no processo</option><option value="0">0 — Emitente</option><option value="1">1 — Destinatário</option><option value="2">2 — Terceiros</option><option value="3">3 — Próprio emitente</option><option value="4">4 — Próprio destinatário</option><option value="9">9 — Sem frete</option></select></label>
        <Field label="Transportadora" value={form.transport.carrier_name ?? ""} onChange={(v) => section("transport", "carrier_name", v)} />
        <Field label="CNPJ/CPF transportadora" value={form.transport.carrier_tax_id ?? ""} onChange={(v) => section("transport", "carrier_tax_id", v)} />
        <Field label="Inscrição estadual da transportadora" value={form.transport.carrier_state_registration ?? ""} onChange={(v) => section("transport", "carrier_state_registration", v)} />
        <Field label="Endereço da transportadora" value={form.transport.carrier_address ?? ""} onChange={(v) => section("transport", "carrier_address", v)} />
        <Field label="Cidade da transportadora" value={form.transport.carrier_city ?? ""} onChange={(v) => section("transport", "carrier_city", v)} />
        <Field label="UF da transportadora" value={form.transport.carrier_state ?? ""} onChange={(v) => section("transport", "carrier_state", v)} />
        <Field label="Informações complementares" value={form.additional_info.complementary ?? ""} onChange={(v) => section("additional_info", "complementary", v)} />
      </div>
      <details className="mt-5 rounded-xl border border-border p-4"><summary className="cursor-pointer font-semibold">Outras informações recorrentes</summary><div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Informações fiscais adicionais" value={form.additional_info.fiscal ?? ""} onChange={(v) => section("additional_info", "fiscal", v)} />
        <Field label="Fundamento legal" value={form.additional_info.legal_text ?? ""} onChange={(v) => section("additional_info", "legal_text", v)} />
        <label><span className="field-label">Indicador de presença</span><select className="field-input" value={form.document.presence_indicator ?? ""} onChange={(e) => section("document", "presence_indicator", e.target.value)}><option value="">Definir no processo</option>{["0", "1", "2", "3", "4", "5", "9"].map((n) => <option key={n} value={n}>{n}</option>)}</select></label>
        <label><span className="field-label">Indicador de intermediador</span><select className="field-input" value={form.document.intermediary_indicator ?? ""} onChange={(e) => section("document", "intermediary_indicator", e.target.value)}><option value="">Definir no processo</option><option value="0">0</option><option value="1">1</option></select></label>
      </div></details>
    </section>

    <section className="surface-card p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold">Produtos e regras por item</h3>
        <p className="mt-1 text-sm text-muted-foreground">Alíquotas importadas são referências editáveis. Complete o CST e revise o enquadramento antes de emitir.</p></div>
        <button type="button" className="button button-secondary" onClick={() => setEditing({ ...form, items: [...form.items, emptyItem()] })}><Plus size={16} /> Adicionar produto</button></div>
      <div className="mt-5 space-y-3">{form.items.map((item, index) => <details key={index} className="rounded-xl border border-border p-4" open={form.items.length === 1 ? true : undefined}>
        <summary className="cursor-pointer font-semibold">{index + 1}. {item.product_code || item.reference || item.description || "Novo produto"} <span className="ml-2 text-xs font-normal text-muted-foreground">{item.ncm || "NCM pendente"}</span></summary>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Referência na planilha/catálogo" value={item.reference} onChange={(v) => itemChange(index, "reference", v)} />
          <Field label="Código do produto na NF-e" value={item.product_code} onChange={(v) => itemChange(index, "product_code", v)} />
          <Field label="Descrição" value={item.description} onChange={(v) => itemChange(index, "description", v)} />
          <Field label="NCM" value={item.ncm} onChange={(v) => itemChange(index, "ncm", v)} />
          <Field label="CFOP" value={item.cfop} onChange={(v) => itemChange(index, "cfop", v)} />
          <Field label="Unidade" value={item.unit} onChange={(v) => itemChange(index, "unit", v)} />
          <label><span className="field-label">Finalidade</span><select className="field-input" value={item.import_purpose} onChange={(e) => itemChange(index, "import_purpose", e.target.value)}>
            <option value="">Revisar no processo</option><option value="resale">Comercialização</option><option value="industrialization">Industrialização</option><option value="fixed_asset">Ativo imobilizado</option><option value="use_consumption">Uso ou consumo</option>
          </select></label>
          {taxFields.map(([key, label]) => <Field key={key} label={label} value={item.tax_configuration[key] ?? ""} onChange={(v) => taxChange(index, key, v)} />)}
        </div>
        <button type="button" className="mt-5 inline-flex items-center gap-2 text-sm text-destructive" onClick={() => setEditing({ ...form, items: form.items.filter((_, i) => i !== index) })}><Trash2 size={15} /> Remover produto</button>
      </details>)}
      {!form.items.length ? <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">Importe uma planilha ou adicione produtos manualmente.</p> : null}</div>
      <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
        {editing ? <button type="button" className="button button-secondary" onClick={() => { setEditing(null); setNotice(""); }}>Descartar alterações</button> : null}
        <button type="button" className="button button-primary" disabled={working || !form.items.length} onClick={save}>
          {working ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
          {working ? "Salvando..." : "Salvar configuração"}
        </button>
      </div>
    </section>
  </div>;
}
