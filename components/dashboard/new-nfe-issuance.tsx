"use client";

import { ArrowLeft, ArrowRight, Building2, Download, FileSpreadsheet, LoaderCircle, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import useSWR from "swr";

import {
  ClientIssuanceReadinessPanel,
  useClientIssuanceReadiness,
} from "@/components/dashboard/client-issuance-readiness";
import { ClientForm } from "@/components/dashboard/client-form";
import { NfeIssuanceStepper } from "@/components/dashboard/nfe-issuance-stepper";
import { NfeNumberSequenceSheet } from "@/components/dashboard/nfe-number-sequence-sheet";
import { Sheet } from "@/components/ui/sheet";
import type { ClientListResponse, ClientRecord } from "@/lib/api/client-record";
import type { SimplifiedOperation, SimplifiedTemplate, SimplifiedTemplateList } from "@/lib/api/simplified-issuance";
import { routes } from "@/lib/api/routes";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import { clientListUrl } from "@/lib/bff/clients";
import { createImportProcess } from "@/lib/bff/import-process";
import { prepareSimplifiedProcess, startSimplifiedProcess } from "@/lib/bff/simplified-issuance";
import { getClientFiscalProfile } from "@/lib/bff/client-fiscal-profile";
import { downloadSimplifiedWorkbook, importSimplifiedWorkbook, type ImportedSimplifiedWorkbook } from "@/lib/simplified-issuance-import";
import { formatCnpj } from "@/lib/client-display";

export function NewNfeIssuance({ initialClientId }: { initialClientId?: string }) {
  const router = useRouter();
  const url = clientListUrl({ active: true, limit: 100, offset: 0 });
  const { data, error, isLoading, mutate } = useSWR<ClientListResponse>(url, bffFetcher);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId ?? "");
  const [search, setSearch] = useState("");
  const [clientSheetOpen, setClientSheetOpen] = useState(false);
  const [sequenceSheetOpen, setSequenceSheetOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const readiness = useClientIssuanceReadiness(selectedClientId || undefined);
  const { data: templates, isLoading: templatesLoading, error: templatesError } = useSWR<SimplifiedTemplateList>(selectedClientId ? routes.bff.client.simplifiedTemplates(selectedClientId) : null, bffFetcher);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [uploaded, setUploaded] = useState<ImportedSimplifiedWorkbook | null>(null);
  const [workbookError, setWorkbookError] = useState("");
  const [processingWorkbook, setProcessingWorkbook] = useState(false);
  const [createdProcessId, setCreatedProcessId] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const { data: selectedTemplate, error: templateError } = useSWR<SimplifiedTemplate>(selectedClientId && selectedTemplateId ? routes.bff.client.simplifiedTemplate(selectedClientId, selectedTemplateId) : null, bffFetcher);

  function chooseClient(id: string) {
    setSelectedClientId(id); setSelectedTemplateId(""); setUploaded(null); setCreatedProcessId(""); setWorkbookError("");
  }

  async function uploadWorkbook(file?: File) {
    if (!file) return;
    setWorkbookError(""); setUploaded(null); setCreatedProcessId("");
    try {
      const workbook = await importSimplifiedWorkbook(file);
      if (selectedTemplateId && !selectedTemplate) throw new Error("Aguarde carregar o modelo selecionado antes de importar.");
      if (workbook.client.cnpj && workbook.client.cnpj.replace(/\D/g, "") !== selectedClient?.cnpj.replace(/\D/g, "")) throw new Error("O CNPJ da planilha não corresponde ao cliente selecionado.");
      if (workbook.fiscalProfile.cnpj && workbook.fiscalProfile.cnpj.replace(/\D/g, "") !== selectedClient?.cnpj.replace(/\D/g, "")) throw new Error("O CNPJ do perfil fiscal na planilha difere do cliente selecionado.");
      if (!workbook.operation.duimp_number) throw new Error("Informe a DUIMP na aba Operação para consultar ou reaproveitar sua captura.");
      const profile = await getClientFiscalProfile(selectedClient!.id);
      const changedProfile = Object.entries(workbook.fiscalProfile).filter(([key, value]) => value && String(profile?.[key as keyof typeof profile] ?? "") !== value);
      if (changedProfile.length) throw new Error(`Os dados do perfil fiscal da planilha diferem do cadastro (${changedProfile.map(([key]) => key).join(", ")}). Atualize o perfil do cliente antes de criar o processo.`);
      const changedClient = Object.entries(workbook.client).filter(([key, value]) => value && String(selectedClient?.[key as keyof ClientRecord] ?? "") !== value);
      if (changedClient.length) throw new Error(`Os dados do cliente diferem do cadastro (${changedClient.map(([key]) => key).join(", ")}). Atualize o cadastro do cliente antes de criar o processo.`);
      setUploaded(workbook);
    } catch (reason) { setWorkbookError(reason instanceof Error ? reason.message : "Não foi possível ler a planilha."); }
  }

  async function generateFromWorkbook() {
    if (!selectedClient || !uploaded) return;
    setProcessingWorkbook(true); setWorkbookError(""); setResultMessage("");
    let id = createdProcessId;
    try {
      const options: SimplifiedOperation = uploaded.operation;
      if (options.number && (!/^\d{1,9}$/.test(options.number) || Number(options.number) < 1)) throw new Error("Número da NF-e inválido na planilha.");
      if (!id) {
        const process = await startSimplifiedProcess(selectedClient.id, { ...(selectedTemplate ? { template_id: selectedTemplate.id } : {}), duimp_number: uploaded.operation.duimp_number, config: uploaded.config });
        id = process.id;
        setCreatedProcessId(id);
      }
      const result = await prepareSimplifiedProcess(id, { sign: options.sign, duimp_overrides: options.duimp_overrides, foreign_supplier: options.foreign_supplier,
        additional_costs: options.additional_costs, ...(options.number ? { number: Number(options.number) } : {}), ...(!options.consult_portal && uploaded.manualPayload ? { manual_payload: uploaded.manualPayload } : {}) });
      setResultMessage(result.status === "validated" ? "XML diagnóstico validado no XSD. Confira o processo." : result.status === "signed" ? "XML assinado. Confira o processo." : result.message || "Há pendências no processo. Revise as associações, dados fiscais e plano de notas.");
    } catch (reason) { setWorkbookError(`${reason instanceof Error && !('response' in reason) ? reason.message : bffErrorMessage(reason)}${id ? " O processo foi criado e pode ser retomado abaixo." : ""}`); }
    finally { setProcessingWorkbook(false); }
  }

  const clients = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("pt-BR");
    if (!normalized) return data?.items ?? [];
    return (data?.items ?? []).filter((client) =>
      [client.razao_social, client.nome_resumido ?? "", client.cnpj]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(normalized.replace(/\D/g, "") || normalized) ||
      [client.razao_social, client.nome_resumido ?? ""]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(normalized),
    );
  }, [data?.items, search]);

  const selectedClient = data?.items.find((client) => client.id === selectedClientId);

  async function startProcess() {
    if (!selectedClientId) return;
    setCreating(true);
    setCreateError(null);
    try {
      const process = await createImportProcess({
        importer_id: selectedClientId,
        source: "portal_unico",
      });
      router.push(`/dashboard/processos/${process.id}/emissao`);
    } catch (requestError) {
      setCreateError(bffErrorMessage(requestError));
      setCreating(false);
    }
  }

  function clientCreated(client: ClientRecord) {
    mutate(
      (current) => current
        ? { ...current, items: [client, ...current.items], total: current.total + 1 }
        : { items: [client], total: 1, limit: 100, offset: 0 },
      { revalidate: false },
    );
    chooseClient(client.id);
    setClientSheetOpen(false);
  }

  return (
    <>
      <Link href="/dashboard/processos" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Voltar para processos
      </Link>

      <header className="mt-6">
        <p className="eyebrow">Nova emissão</p>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.04em]">Preparar NF-e de importação</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Selecione o cliente e escolha como preparar a emissão: use um modelo e uma planilha, ou continue pelo formulário. A consulta à DUIMP no Portal Único é opcional quando a planilha contém todos os dados da operação.
        </p>
      </header>

      <div className="mt-8"><NfeIssuanceStepper /></div>

      <section className="surface-card mt-8 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-xl font-semibold">1. Selecione o cliente</h2>
            <p className="mt-1 text-sm text-muted-foreground">Apenas clientes ativos da organização são exibidos.</p>
          </div>
          <button type="button" className="button button-secondary" onClick={() => setClientSheetOpen(true)}>
            <Plus size={16} /> Cadastrar cliente
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <label className="relative block">
            <span className="sr-only">Buscar cliente</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
            <input className="field-input pl-11" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por razão social, nome ou CNPJ" />
          </label>

          {error ? <p className="mt-5 text-sm text-destructive">{bffErrorMessage(error)}</p> : null}
          {isLoading ? (
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {[0, 1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-muted" />)}
            </div>
          ) : clients.length ? (
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {clients.map((client) => {
                const selected = client.id === selectedClientId;
                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => chooseClient(client.id)}
                    className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition ${selected ? "border-primary bg-sage-soft ring-1 ring-primary" : "border-border bg-card hover:border-primary/40"}`}
                  >
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}><Building2 size={19} /></span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{client.nome_resumido || client.razao_social}</span>
                      <span className="mt-1 block truncate text-sm text-muted-foreground">{client.razao_social}</span>
                      <span className="mt-1 block font-mono text-xs text-muted-foreground">{formatCnpj(client.cnpj)}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="font-medium">Nenhum cliente ativo encontrado.</p>
              <p className="mt-1 text-sm text-muted-foreground">Cadastre o importador sem sair desta etapa.</p>
            </div>
          )}
        </div>
      </section>

      {selectedClient ? <section className="surface-card mt-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="text-xl font-semibold">2. Escolha um modelo de emissão</h2><p className="mt-1 text-sm text-muted-foreground">Opcional. Os dados recorrentes serão copiados para este processo.</p></div>
          <Link className="button button-secondary" href={`/dashboard/clientes/${selectedClient.id}/emissoes-simplificadas/novo`}><Plus size={16} /> Cadastrar modelo</Link>
        </div>
        {templatesError ? <p role="alert" className="mt-4 text-sm text-destructive">{bffErrorMessage(templatesError)}</p> : null}
        {templatesLoading ? <div className="mt-4 h-20 animate-pulse rounded-xl bg-muted" /> :
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button type="button" aria-pressed={!selectedTemplateId} className={`rounded-xl border p-4 text-left ${!selectedTemplateId ? "border-primary bg-sage-soft" : "border-border"}`} onClick={() => { setSelectedTemplateId(""); setUploaded(null); setCreatedProcessId(""); }}>
              <span className="font-semibold">Sem modelo</span><span className="mt-1 block text-sm text-muted-foreground">Preencher as etapas do processo manualmente.</span>
            </button>
            {templates?.items.map((item) => <button key={item.id} type="button" aria-pressed={selectedTemplateId === item.id} className={`rounded-xl border p-4 text-left ${selectedTemplateId === item.id ? "border-primary bg-sage-soft" : "border-border"}`} onClick={() => { setSelectedTemplateId(item.id); setUploaded(null); setCreatedProcessId(""); }}>
              <span className="font-semibold">{item.name}</span><span className="mt-1 block text-sm text-muted-foreground">{item.description || `${item.item_count} produto(s) configurados`}</span>
            </button>)}
          </div>}
      </section> : null}

      {selectedClient ? <section className="surface-card mt-6 border-dashed p-5 sm:p-6" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void uploadWorkbook(event.dataTransfer.files[0]); }}>
        <h2 className="flex items-center gap-2 text-xl font-semibold"><FileSpreadsheet size={21} /> Planilha desta operação</h2>
        <p className="mt-2 text-sm text-muted-foreground">Baixe a planilha, ajuste a aba Operação e os dados que mudaram, depois importe. Para não consultar o Portal Único, preencha também todos os itens e valores na aba Itens da operação.</p>
        {templateError ? <p role="alert" className="mt-3 text-sm text-destructive">{bffErrorMessage(templateError)}</p> : null}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" className="button button-secondary" disabled={Boolean(selectedTemplateId && !selectedTemplate)} onClick={() => void getClientFiscalProfile(selectedClient.id).then(profile => downloadSimplifiedWorkbook(selectedTemplate?.config, undefined, selectedClient as unknown as Record<string, unknown>, (profile ?? {}) as Record<string, unknown>)).catch(() => setWorkbookError("Não foi possível baixar a planilha."))}><Download size={16} /> {selectedTemplateId ? "Baixar planilha preenchida" : "Baixar planilha vazia"}</button>
          <label className="button button-secondary cursor-pointer"><FileSpreadsheet size={16} /> Importar planilha .xlsx
            <input className="sr-only" type="file" accept=".xlsx,.xls" onChange={(event) => { void uploadWorkbook(event.target.files?.[0]); event.target.value = ""; }} />
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Também é possível arrastar o arquivo .xlsx até esta área.</p>
        {workbookError ? <p role="alert" className="mt-4 text-sm text-destructive">{workbookError}</p> : null}
        {uploaded ? <div className="mt-5 rounded-xl border border-border p-4">
          <p className="font-medium">{uploaded.config.items.length} produtos · DUIMP {uploaded.operation.duimp_number} · {uploaded.operation.consult_portal ? "Consulta ao Portal" : "Dados manuais da planilha"} · {uploaded.operation.number ? `NF-e nº ${uploaded.operation.number}` : "Numeração pela sequência"} · {uploaded.operation.sign ? "Assinatura solicitada" : "Sem assinatura"}</p>
          <p className="mt-2 text-sm text-muted-foreground">Os dados da planilha substituirão o modelo apenas neste processo. Confira valores, tributação e número antes de continuar.</p>
          <button className="button button-primary mt-4" type="button" disabled={processingWorkbook} onClick={() => void generateFromWorkbook()}>{processingWorkbook ? <LoaderCircle className="animate-spin" size={16} /> : <ArrowRight size={16} />}{processingWorkbook ? "Preparando..." : createdProcessId ? "Tentar preparar novamente" : "Criar processo e preparar XML"}</button>
          {resultMessage ? <p role="status" className="mt-3 text-sm">{resultMessage}</p> : null}
          {createdProcessId ? <Link className="mt-3 block text-sm font-semibold text-sage-strong underline" href={`/dashboard/processos/${createdProcessId}/emissao`}>Abrir processo para revisão</Link> : null}
        </div> : null}
      </section> : null}

      {selectedClient ? (
        <div className="mt-6">
          <ClientIssuanceReadinessPanel
            clientId={selectedClient.id}
            readiness={readiness}
            onConfigureSequence={() => setSequenceSheetOpen(true)}
          />
        </div>
      ) : null}

      <div className="mt-8 flex flex-col items-end gap-3 border-t border-border pt-6">
        {createError ? <p className="text-sm text-destructive" role="alert">{createError}</p> : null}
        <button type="button" className="button button-primary min-h-12 px-6" disabled={!selectedClientId || creating} onClick={async () => {
          if (selectedTemplateId) {
            setCreating(true); setCreateError(null);
            try { const process = await startSimplifiedProcess(selectedClientId, { template_id: selectedTemplateId }); router.push(`/dashboard/processos/${process.id}/emissao`); }
            catch (reason) { setCreateError(bffErrorMessage(reason)); setCreating(false); }
          } else void startProcess();
        }}>
          {creating ? <LoaderCircle className="animate-spin" size={17} /> : <ArrowRight size={17} />}
          {creating ? "Criando processo..." : "Continuar pelo formulário"}
        </button>
      </div>

      <Sheet open={clientSheetOpen} onOpenChange={setClientSheetOpen} title="Cadastrar cliente" description="Crie o importador agora e retorne automaticamente para o fluxo de emissão.">
        <ClientForm onCreated={clientCreated} onCancel={() => setClientSheetOpen(false)} />
      </Sheet>

      {selectedClient ? (
        <NfeNumberSequenceSheet
          open={sequenceSheetOpen}
          onOpenChange={setSequenceSheetOpen}
          clientId={selectedClient.id}
          sequence={readiness.activeSequence}
          onSaved={(sequence) => readiness.setSequence(sequence)}
        />
      ) : null}
    </>
  );
}
