"use client";

import {
  ChevronLeft,
  ChevronRight,
  FileClock,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import useSWR from "swr";
import { useDashboardSession } from "@/components/dashboard/dashboard-session-context";

import {
  importProcessStatuses,
  type ImportProcessListResponse,
  type ImportProcessStatus,
} from "@/lib/api/import-process";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import { importProcessListUrl } from "@/lib/bff/import-process";
import {
  formatProcessDate,
  importProcessStatusClass,
  importProcessStatusLabels,
  nextActionLabels,
} from "@/lib/import-process-display";

const PAGE_SIZE = 10;

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 14) return value;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function ImportProcessList() {
  const { user } = useDashboardSession();
  const canCreate = user.role === "admin" || user.access_tags?.includes("processos");
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ImportProcessStatus | "">("");
  const [createdByMe, setCreatedByMe] = useState(false);
  const [offset, setOffset] = useState(0);

  const url = useMemo(
    () => importProcessListUrl({
      query: query || undefined,
      status: status || undefined,
      createdByMe,
      limit: PAGE_SIZE,
      offset,
    }),
    [createdByMe, offset, query, status],
  );
  const { data, error, isLoading, mutate } = useSWR<ImportProcessListResponse>(url, bffFetcher, {
    keepPreviousData: true,
  });

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOffset(0);
    setQuery(draftQuery.trim());
  }

  const start = data?.total ? offset + 1 : 0;
  const end = data ? Math.min(offset + PAGE_SIZE, data.total) : 0;
  const canGoBack = offset > 0;
  const canGoForward = Boolean(data && offset + PAGE_SIZE < data.total);

  return (
    <>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Operação</p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.04em]">Processos</h1>
          <p className="mt-2 text-muted-foreground">Consulte os processos de importação disponíveis para a sua organização.</p>
        </div>
        {canCreate && <Link href="/dashboard/processos/novo" className="button button-primary min-h-11">
          <Plus size={16} /> Novo processo
        </Link>}
      </div>

      <section className="surface-card mt-8 overflow-hidden">
        <div className="border-b border-border p-5 sm:p-6">
          <form onSubmit={search} className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_15rem_auto]">
            <label className="relative">
              <span className="sr-only">Buscar processo</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
              <input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                className="field-input pl-11"
                placeholder="Referência, DUIMP, cliente ou CNPJ"
              />
            </label>
            <label>
              <span className="sr-only">Filtrar por status</span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as ImportProcessStatus | "");
                  setOffset(0);
                }}
                className="field-input"
              >
                <option value="">Todos os status</option>
                {importProcessStatuses.map((value) => (
                  <option key={value} value={value}>{importProcessStatusLabels[value]}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="button button-secondary min-h-12 px-6">
              <Search size={16} /> Buscar
            </button>
          </form>
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={createdByMe}
              onChange={(event) => {
                setCreatedByMe(event.target.checked);
                setOffset(0);
              }}
              className="size-4 rounded border-input accent-primary"
            />
            Exibir somente processos criados por mim
          </label>
        </div>

        {error ? (
          <div className="p-10 text-center">
            <p className="text-sm text-destructive">{bffErrorMessage(error)}</p>
            <button type="button" className="button button-secondary mt-4" onClick={() => mutate()}>
              <RefreshCw size={16} /> Tentar novamente
            </button>
          </div>
        ) : isLoading && !data ? (
          <div className="space-y-3 p-6" aria-label="Carregando processos">
            {[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : data?.items.length ? (
          <div className="overflow-x-auto" aria-busy={isLoading}>
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-muted/55 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Processo</th>
                  <th className="px-6 py-4 font-semibold">Cliente</th>
                  <th className="px-6 py-4 font-semibold">DUIMP</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Próxima etapa</th>
                  <th className="px-6 py-4 font-semibold">Atualizado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((process) => (
                  <tr key={process.id} className="transition hover:bg-muted/30">
                    <td className="px-6 py-5">
                      <Link href={`/dashboard/processos/${process.id}`} className="font-semibold underline-offset-4 hover:underline">{process.reference_code}</Link>
                      <p className="mt-1 text-xs text-muted-foreground">{process.source.replaceAll("_", " ")}</p>
                    </td>
                    <td className="max-w-64 px-6 py-5">
                      <p className="truncate font-medium">{process.importer.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatCnpj(process.importer.cnpj)}</p>
                    </td>
                    <td className="px-6 py-5 font-mono text-xs">{process.duimp_number ?? "Não informada"}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${importProcessStatusClass(process.status)}`}>
                        {importProcessStatusLabels[process.status]}
                      </span>
                    </td>
                    <td className="max-w-56 px-6 py-5 text-muted-foreground">{nextActionLabels[process.next_action] ?? process.next_action}</td>
                    <td className="whitespace-nowrap px-6 py-5 text-xs text-muted-foreground">
                      <time dateTime={process.updated_at}>{formatProcessDate(process.updated_at)}</time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileClock className="mx-auto text-sage-strong" size={30} />
            <p className="mt-4 font-medium">Nenhum processo encontrado.</p>
            <p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou aguarde o primeiro processo da organização.</p>
            {canCreate && <Link href="/dashboard/processos/novo" className="button button-primary mt-5">
              <Plus size={16} /> Iniciar primeira emissão
            </Link>}
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
