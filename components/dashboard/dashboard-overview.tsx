"use client";

import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  FileClock,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { useDashboardSession } from "@/components/dashboard/dashboard-session-context";

import type {
  ImportProcessDashboardSummary,
  ImportProcessListResponse,
} from "@/lib/api/import-process";
import { routes } from "@/lib/api/routes";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import { importProcessListUrl } from "@/lib/bff/import-process";
import {
  formatProcessDate,
  importProcessStatusClass,
  importProcessStatusLabels,
  nextActionLabels,
} from "@/lib/import-process-display";

type Metric = {
  key: keyof Pick<
    ImportProcessDashboardSummary,
    "in_progress" | "ready_for_emission" | "attention_required" | "completed"
  >;
  label: string;
  detail: string;
  icon: LucideIcon;
};

const metrics: Metric[] = [
  {
    key: "in_progress",
    label: "Em andamento",
    detail: "Processos ativos nesta organização.",
    icon: FileClock,
  },
  {
    key: "ready_for_emission",
    label: "Prontos para emissão",
    detail: "Minutas e XMLs que podem avançar.",
    icon: FileCheck2,
  },
  {
    key: "attention_required",
    label: "Exigem atenção",
    detail: "Falhas ou rejeições a serem tratadas.",
    icon: CircleAlert,
  },
  {
    key: "completed",
    label: "Autorizados",
    detail: "Notas autorizadas pela SEFAZ.",
    icon: CheckCircle2,
  },
];

export function DashboardOverview() {
  const { user } = useDashboardSession();
  const canSeeProcesses = user.role === "admin" || user.access_tags?.includes("processos");
  const summary = useSWR<ImportProcessDashboardSummary>(
    canSeeProcesses ? routes.bff.importProcess.dashboardSummary : null,
    bffFetcher,
  );
  const recent = useSWR<ImportProcessListResponse>(
    canSeeProcesses ? importProcessListUrl({ limit: 5, offset: 0 }) : null,
    bffFetcher,
  );

  return (
    <>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Visão geral</p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.04em]">Operação fiscal</h1>
          <p className="mt-2 text-muted-foreground">Acompanhe os processos da sua organização em um só lugar.</p>
        </div>
        {canSeeProcesses && <Link href="/dashboard/processos" className="button button-primary min-h-11">
          Ver processos <ArrowRight size={17} />
        </Link>}
      </div>

      {!canSeeProcesses && <p className="surface-card mt-8 p-6 text-sm text-muted-foreground">Seu usuário não possui a tag Processos. Use o menu para acessar os módulos liberados.</p>}

      {canSeeProcesses && <>

      {summary.error ? (
        <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{bffErrorMessage(summary.error)}</p>
          <button type="button" className="button button-secondary" onClick={() => summary.mutate()}>
            <RefreshCw size={16} /> Tentar novamente
          </button>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 2xl:grid-cols-4" aria-busy={summary.isLoading}>
        {metrics.map(({ key, label, detail, icon: Icon }) => (
          <article key={key} className="surface-card p-6">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-sage-soft text-sage-strong"><Icon size={19} /></span>
              <span className="text-xs font-medium text-muted-foreground">Agora</span>
            </div>
            <p className="mt-7 text-sm text-muted-foreground">{label}</p>
            <p className="font-display mt-2 min-h-11 text-4xl font-semibold">
              {summary.isLoading ? <span className="inline-block h-9 w-12 animate-pulse rounded-lg bg-muted" /> : (summary.data?.[key] ?? "—")}
            </p>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">{detail}</p>
          </article>
        ))}
      </div>

      <section className="surface-card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-base font-semibold">Processos recentes</h2>
            <p className="mt-1 text-sm text-muted-foreground">Últimas movimentações da organização.</p>
          </div>
          <Link href="/dashboard/processos" className="button button-ghost px-3">Ver todos <ArrowRight size={16} /></Link>
        </div>

        {recent.error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-destructive">{bffErrorMessage(recent.error)}</p>
            <button type="button" className="button button-secondary mt-4" onClick={() => recent.mutate()}>
              <RefreshCw size={16} /> Recarregar
            </button>
          </div>
        ) : recent.isLoading ? (
          <div className="space-y-3 p-6 sm:p-8" aria-label="Carregando processos">
            {[0, 1, 2].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : recent.data?.items.length ? (
          <div className="divide-y divide-border">
            {recent.data.items.map((process) => (
              <Link key={process.id} href={`/dashboard/processos/${encodeURIComponent(process.id)}/emissao`} aria-label={`Abrir processo ${process.reference_code}`} className="grid gap-3 px-6 py-5 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary sm:grid-cols-[1fr_auto] sm:items-center sm:px-8">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{process.reference_code}</p>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${importProcessStatusClass(process.status)}`}>
                      {importProcessStatusLabels[process.status]}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{process.importer.name} · {nextActionLabels[process.next_action] ?? process.next_action}</p>
                </div>
                <span className="flex items-center gap-3 text-xs text-muted-foreground"><time dateTime={process.updated_at}>{formatProcessDate(process.updated_at)}</time><ArrowRight size={16} aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <FileClock className="mx-auto text-sage-strong" size={28} />
            <p className="mt-4 font-medium">Nenhum processo cadastrado.</p>
            <p className="mt-1 text-sm text-muted-foreground">A criação do primeiro processo será habilitada no próximo fluxo.</p>
          </div>
        )}
      </section>
      </>}
    </>
  );
}
