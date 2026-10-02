"use client";

import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, ArrowRight, FileClock, RefreshCw } from "lucide-react";
import { useDashboardSession } from "@/components/dashboard/dashboard-session-context";
import type { ImportProcessRecord } from "@/lib/api/import-process";
import { routes } from "@/lib/api/routes";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import { formatProcessDate, importProcessStatusClass, importProcessStatusLabels } from "@/lib/import-process-display";

export function ProcessDetails({ processId }: { processId: string }) {
  const { user } = useDashboardSession();
  const canEmit = user.role === "admin" || user.access_tags?.includes("emissao");
  const { data, error, isLoading, mutate } = useSWR<ImportProcessRecord>(routes.bff.importProcess.detail(processId), bffFetcher);
  return <div className="max-w-4xl">
    <Link href="/dashboard/processos" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Processos</Link>
    {error ? <div role="alert" className="surface-card mt-8 p-8"><p className="text-destructive">{bffErrorMessage(error)}</p><button type="button" className="button button-secondary mt-5" onClick={() => mutate()}><RefreshCw size={16} /> Tentar novamente</button></div> : isLoading || !data ? <div className="surface-card mt-8 h-48 animate-pulse" aria-label="Carregando processo" /> : <>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Processo de importação</p><h1 className="font-display mt-3 text-4xl font-semibold">{data.reference_code}</h1><p className="mt-2 text-muted-foreground">Dados e andamento do processo.</p></div>
      {canEmit && <Link href={`/dashboard/processos/${encodeURIComponent(processId)}/emissao`} className="button button-primary">Abrir emissão <ArrowRight size={17} /></Link>}</div>
      <section className="surface-card mt-8 p-6 sm:p-8"><div className="flex items-center gap-3"><FileClock size={22} className="text-sage-strong" /><h2 className="text-xl font-semibold">Visão do processo</h2></div>
        <dl className="mt-7 grid gap-6 sm:grid-cols-2">
          <div><dt className="text-sm text-muted-foreground">Status</dt><dd className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${importProcessStatusClass(data.status)}`}>{importProcessStatusLabels[data.status]}</dd></div>
          <div><dt className="text-sm text-muted-foreground">DUIMP</dt><dd className="mt-2 font-medium">{data.duimp_number ?? "Ainda não informada"}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Origem</dt><dd className="mt-2 font-medium">{data.source.replaceAll("_", " ")}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Última atualização</dt><dd className="mt-2 font-medium">{formatProcessDate(data.updated_at)}</dd></div>
        </dl>
      </section>
      {!canEmit && <p className="mt-5 text-sm text-muted-foreground">A tag Emissão libera a preparação da NF-e. Solicite esse acesso a um administrador da organização.</p>}
    </>}
  </div>;
}
