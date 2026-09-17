"use client";

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import useSWR from "swr";

import type { ClientListResponse } from "@/lib/api/client-record";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import { clientListUrl, updateClient } from "@/lib/bff/clients";
import {
  formatClientDate,
  formatCnpj,
  taxRegimeLabels,
} from "@/lib/client-display";

const PAGE_SIZE = 10;
type ActiveFilter = "all" | "active" | "inactive";

export function ClientList() {
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("active");
  const [offset, setOffset] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const url = useMemo(
    () =>
      clientListUrl({
        query: query || undefined,
        active:
          activeFilter === "all" ? undefined : activeFilter === "active",
        limit: PAGE_SIZE,
        offset,
      }),
    [activeFilter, offset, query],
  );
  const { data, error, isLoading, mutate } = useSWR<ClientListResponse>(
    url,
    bffFetcher,
    { keepPreviousData: true },
  );

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOffset(0);
    setQuery(draftQuery.trim());
  }

  async function toggleClient(id: string, active: boolean) {
    setUpdatingId(id);
    setActionError(null);
    try {
      await updateClient(id, { ativo: !active });
      await mutate();
    } catch (requestError) {
      setActionError(bffErrorMessage(requestError));
    } finally {
      setUpdatingId(null);
    }
  }

  const start = data?.total ? offset + 1 : 0;
  const end = data ? Math.min(offset + PAGE_SIZE, data.total) : 0;
  const canGoBack = offset > 0;
  const canGoForward = Boolean(data && offset + PAGE_SIZE < data.total);

  return (
    <>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Cadastros</p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.04em]">Clientes</h1>
          <p className="mt-2 text-muted-foreground">Gerencie os importadores vinculados à sua organização.</p>
        </div>
        <Link href="/dashboard/clientes/novo" className="button button-primary min-h-11">
          <Plus size={17} /> Novo cliente
        </Link>
      </div>

      <section className="surface-card mt-8 overflow-hidden">
        <div className="border-b border-border p-5 sm:p-6">
          <form onSubmit={search} className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_13rem_auto]">
            <label className="relative">
              <span className="sr-only">Buscar cliente</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
              <input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                className="field-input pl-11"
                placeholder="Razão social, nome ou CNPJ"
              />
            </label>
            <label>
              <span className="sr-only">Filtrar por situação</span>
              <select
                value={activeFilter}
                onChange={(event) => {
                  setActiveFilter(event.target.value as ActiveFilter);
                  setOffset(0);
                }}
                className="field-input"
              >
                <option value="active">Clientes ativos</option>
                <option value="inactive">Clientes inativos</option>
                <option value="all">Todos os clientes</option>
              </select>
            </label>
            <button type="submit" className="button button-secondary min-h-12 px-6">
              <Search size={16} /> Buscar
            </button>
          </form>
          {actionError ? (
            <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
              {actionError}
            </p>
          ) : null}
        </div>

        {error ? (
          <div className="p-10 text-center">
            <p className="text-sm text-destructive">{bffErrorMessage(error)}</p>
            <button type="button" className="button button-secondary mt-4" onClick={() => mutate()}>
              <RefreshCw size={16} /> Tentar novamente
            </button>
          </div>
        ) : isLoading && !data ? (
          <div className="space-y-3 p-6" aria-label="Carregando clientes">
            {[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : data?.items.length ? (
          <div className="overflow-x-auto" aria-busy={isLoading}>
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-muted/55 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Cliente</th>
                  <th className="px-6 py-4 font-semibold">Inscrição estadual</th>
                  <th className="px-6 py-4 font-semibold">Regime tributário</th>
                  <th className="px-6 py-4 font-semibold">Situação</th>
                  <th className="px-6 py-4 font-semibold">Atualizado</th>
                  <th className="px-6 py-4 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((client) => (
                  <tr key={client.id} className="transition hover:bg-muted/30">
                    <td className="max-w-72 px-6 py-5">
                      <p className="truncate font-semibold">{client.nome_resumido || client.razao_social}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{client.razao_social}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">{formatCnpj(client.cnpj)}</p>
                    </td>
                    <td className="px-6 py-5 text-muted-foreground">{client.inscricao_estadual || "Não informada"}</td>
                    <td className="max-w-56 px-6 py-5 text-muted-foreground">
                      {client.regime_tributacao ? taxRegimeLabels[client.regime_tributacao] ?? client.regime_tributacao : "Não informado"}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${client.ativo ? "bg-sage-soft text-sage-strong" : "bg-muted text-muted-foreground"}`}>
                        {client.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-xs text-muted-foreground">
                      <time dateTime={client.updated_at}>{formatClientDate(client.updated_at)}</time>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/clientes/${client.id}`} className="button button-secondary px-3">
                          <Pencil size={15} /> Editar
                        </Link>
                        <button
                          type="button"
                          className="button button-ghost px-3"
                          disabled={updatingId === client.id}
                          onClick={() => toggleClient(client.id, client.ativo)}
                        >
                          {updatingId === client.id ? "Salvando..." : client.ativo ? "Inativar" : "Reativar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Building2 className="mx-auto text-sage-strong" size={30} />
            <p className="mt-4 font-medium">Nenhum cliente encontrado.</p>
            <p className="mt-1 text-sm text-muted-foreground">Cadastre um importador ou ajuste os filtros da consulta.</p>
            <Link href="/dashboard/clientes/novo" className="button button-secondary mt-5">
              <Plus size={16} /> Cadastrar cliente
            </Link>
          </div>
        )}

        <footer className="flex flex-col gap-4 border-t border-border px-5 py-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p aria-live="polite">Exibindo {start}–{end} de {data?.total ?? 0}</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="button button-secondary px-3"
              disabled={!canGoBack || isLoading}
              onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <button
              type="button"
              className="button button-secondary px-3"
              disabled={!canGoForward || isLoading}
              onClick={() => setOffset((current) => current + PAGE_SIZE)}
            >
              Próxima <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>
    </>
  );
}
