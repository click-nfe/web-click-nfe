"use client";

import { ArrowLeft, ArrowRight, Building2, LoaderCircle, Plus, Search } from "lucide-react";
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
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import { clientListUrl } from "@/lib/bff/clients";
import { createImportProcess } from "@/lib/bff/import-process";
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
    setSelectedClientId(client.id);
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
          Selecione o importador e valide as configurações necessárias. O processo continuará salvo quando você avançar para a DUIMP.
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
                    onClick={() => setSelectedClientId(client.id)}
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
        <button type="button" className="button button-primary min-h-12 px-6" disabled={!selectedClientId || creating} onClick={startProcess}>
          {creating ? <LoaderCircle className="animate-spin" size={17} /> : <ArrowRight size={17} />}
          {creating ? "Criando processo..." : "Criar processo e informar DUIMP"}
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
