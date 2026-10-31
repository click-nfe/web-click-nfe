"use client";

import Link from "next/link";
import useSWR from "swr";

import type { PortalUnicoAvailability } from "@/lib/api/organization";
import { routes } from "@/lib/api/routes";
import { bffFetcher } from "@/lib/bff/client";

const presentations = {
  available: { label: "Disponível", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-300" },
  unavailable: { label: "Serviço indisponível", dot: "bg-red-500", text: "text-red-700 dark:text-red-300" },
  unknown: { label: "Disponibilidade não confirmada", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-300" },
} as const;

export function usePortalUnicoAvailability() {
  return useSWR<PortalUnicoAvailability>(
    routes.bff.organization.portalUnicoAvailability,
    bffFetcher,
    { refreshInterval: 120_000, dedupingInterval: 30_000 },
  );
}

export function PortalUnicoAvailabilityBadge() {
  const { data, error } = usePortalUnicoAvailability();
  const state = error ? "unknown" : data?.state ?? "unknown";
  const presentation = presentations[state];
  const description = data?.message ?? "Verificando a disponibilidade do Portal Único.";

  return (
    <div className="group relative">
      <span
        tabIndex={0}
        className={`inline-flex cursor-help items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium outline-offset-2 focus-visible:outline ${presentation.text}`}
        aria-label={`Portal Único: ${presentation.label}`}
        title={description}
      >
        <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${presentation.dot}`} />
        <span className="hidden sm:inline">Portal Único</span>
        <span className="sr-only">{presentation.label}</span>
      </span>
      <div
        role="tooltip"
        className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-card p-3 text-sm leading-5 text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <p className="font-semibold">Portal Único · {presentation.label}</p>
        <p className="mt-1 text-muted-foreground">{description}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Verificação do serviço. A chave da organização é validada separadamente.
        </p>
      </div>
    </div>
  );
}

export function PortalUnicoAvailabilityNotice() {
  const { data } = usePortalUnicoAvailability();
  if (data?.state !== "unavailable") return null;

  return (
    <div role="status" className="rounded-2xl border border-red-300/50 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
      <p className="font-semibold">Serviço Indisponível</p>
      <p className="mt-1">{data.message}</p>
      <Link href="https://portalunico.siscomex.gov.br/" target="_blank" rel="noopener noreferrer" className="mt-2 inline-block underline underline-offset-2">
        Consultar o Portal Único
      </Link>
    </div>
  );
}
