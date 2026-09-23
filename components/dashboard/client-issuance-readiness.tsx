"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

import type { ClientImportTaxRuleDiagnostics } from "@/lib/api/client-import-tax-rule";
import type { FiscalCertificateRecord } from "@/lib/api/fiscal-certificate";
import type { NfeNumberSequence } from "@/lib/api/nfe-number-sequence";
import type { PortalUnicoSettings } from "@/lib/api/organization";
import { routes } from "@/lib/api/routes";
import { bffFetcher } from "@/lib/bff/client";
import { getClientFiscalProfile } from "@/lib/bff/client-fiscal-profile";
import { listNfeNumberSequences } from "@/lib/bff/nfe-number-sequence";

export function useClientIssuanceReadiness(clientId?: string) {
  const fiscalProfile = useSWR(
    clientId ? ["issuance-fiscal-profile", clientId] : null,
    () => getClientFiscalProfile(clientId as string),
  );
  const certificates = useSWR<FiscalCertificateRecord[]>(
    clientId ? routes.bff.client.fiscalCertificates(clientId) : null,
    bffFetcher,
  );
  const taxRules = useSWR<ClientImportTaxRuleDiagnostics>(
    clientId ? routes.bff.client.importTaxRuleDiagnostics(clientId) : null,
    bffFetcher,
  );
  const numberSequences = useSWR(
    clientId ? ["issuance-number-sequences", clientId] : null,
    () => listNfeNumberSequences(clientId as string),
  );
  const portal = useSWR<PortalUnicoSettings>(
    clientId ? routes.bff.organization.portalUnico : null,
    bffFetcher,
  );

  const activeSequence = numberSequences.data?.find(
    (item) => item.environment === "production" && item.model === "55" && item.status === "active",
  );
  const activeCertificate = certificates.data?.find(
    (item) => item.environment === "production" && item.status === "active" && item.is_active,
  );
  const errors = [fiscalProfile.error, certificates.error, taxRules.error, numberSequences.error, portal.error].filter(Boolean);

  return {
    hasFiscalProfile: Boolean(fiscalProfile.data),
    activeSequence,
    hasPortalConnection: Boolean(portal.data?.ready_for_duimp),
    activeTaxRules: taxRules.data?.summary.active ?? 0,
    taxRuleConflicts: taxRules.data?.summary.conflict_count ?? 0,
    activeCertificate,
    loading: [fiscalProfile, certificates, taxRules, numberSequences, portal].some(
      (request) => request.isLoading,
    ),
    hasError: errors.length > 0,
    refresh: async () => {
      await Promise.all([
        fiscalProfile.mutate(),
        certificates.mutate(),
        taxRules.mutate(),
        numberSequences.mutate(),
        portal.mutate(),
      ]);
    },
    setSequence: (sequence: NfeNumberSequence) => numberSequences.mutate(
      (current) => [sequence, ...(current ?? []).filter((item) => item.id !== sequence.id)],
      { revalidate: false },
    ),
  };
}

export type ClientIssuanceReadiness = ReturnType<typeof useClientIssuanceReadiness>;

type ReadinessRowProps = {
  ready: boolean;
  warning?: boolean;
  title: string;
  detail: string;
  action: React.ReactNode;
};

function ReadinessRow({ ready, warning = false, title, detail, action }: ReadinessRowProps) {
  const Icon = ready ? CheckCircle2 : warning ? AlertTriangle : Circle;
  return (
    <li className="flex flex-col gap-3 border-b border-border py-4 last:border-0 sm:flex-row sm:items-center">
      <Icon className={`shrink-0 ${ready ? "text-sage-strong" : warning ? "text-amber-600" : "text-muted-foreground"}`} size={20} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </li>
  );
}

function ProfileLink({ clientId, section, children }: { clientId: string; section: string; children: React.ReactNode }) {
  return (
    <Link
      href={`/dashboard/clientes/${clientId}?section=${section}`}
      target="_blank"
      className="button button-secondary min-h-9 px-3 text-xs"
    >
      {children} <ExternalLink size={13} />
    </Link>
  );
}

export function ClientIssuanceReadinessPanel({
  clientId,
  readiness,
  onConfigureSequence,
}: {
  clientId: string;
  readiness: ClientIssuanceReadiness;
  onConfigureSequence: () => void;
}) {
  if (readiness.loading) {
    return <div className="h-80 animate-pulse rounded-2xl bg-muted" aria-label="Verificando configuração do cliente" />;
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Prontidão para emissão</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Os requisitos são liberados conforme cada etapa do processo. Links abrem em uma nova guia para preservar este fluxo.
          </p>
        </div>
        <button type="button" className="button button-secondary min-h-9 px-3 text-xs" onClick={() => readiness.refresh()}>
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {readiness.hasError ? (
        <p className="mt-4 rounded-xl bg-destructive/5 p-3 text-sm text-destructive">
          Parte das configurações não pôde ser consultada. Atualize a verificação antes de continuar.
        </p>
      ) : null}

      <ul className="mt-3">
        <ReadinessRow
          ready={readiness.hasFiscalProfile}
          title="Perfil fiscal"
          detail={readiness.hasFiscalProfile ? "Dados fiscais prontos para consultar a DUIMP." : "Obrigatório antes da consulta da DUIMP."}
          action={<ProfileLink clientId={clientId} section="fiscal-profile">{readiness.hasFiscalProfile ? "Revisar" : "Configurar"}</ProfileLink>}
        />
        <ReadinessRow
          ready={Boolean(readiness.activeSequence)}
          title="Sequência NF-e"
          detail={readiness.activeSequence ? `Série ${readiness.activeSequence.series}; próximo número após ${readiness.activeSequence.current_number}.` : "Obrigatória antes da consulta da DUIMP."}
          action={<button type="button" className="button button-secondary min-h-9 px-3 text-xs" onClick={onConfigureSequence}>{readiness.activeSequence ? "Revisar" : "Configurar"}</button>}
        />
        <ReadinessRow
          ready={readiness.hasPortalConnection}
          title="Portal Único Siscomex"
          detail={readiness.hasPortalConnection ? "Conexão validada para captura da DUIMP." : "Obrigatório antes da consulta da DUIMP."}
          action={<Link href="/dashboard/configuracoes" target="_blank" className="button button-secondary min-h-9 px-3 text-xs">{readiness.hasPortalConnection ? "Revisar" : "Conectar"} <ExternalLink size={13} /></Link>}
        />
        <ReadinessRow
          ready={readiness.activeTaxRules > 0 && readiness.taxRuleConflicts === 0}
          warning={readiness.activeTaxRules === 0 || readiness.taxRuleConflicts > 0}
          title="Regras tributárias"
          detail={readiness.activeTaxRules > 0 ? `${readiness.activeTaxRules} regra(s) ativa(s)${readiness.taxRuleConflicts ? ` e ${readiness.taxRuleConflicts} conflito(s)` : " sem conflitos"}. Necessárias na classificação.` : "Serão exigidas na classificação dos itens, após a captura."}
          action={<ProfileLink clientId={clientId} section="tax-rules">Configurar</ProfileLink>}
        />
        <ReadinessRow
          ready={Boolean(readiness.activeCertificate)}
          warning={!readiness.activeCertificate}
          title="Certificado eCNPJ A1"
          detail={readiness.activeCertificate ? "Certificado de produção ativo para a futura assinatura." : "Será exigido na assinatura do XML, em uma etapa posterior."}
          action={<ProfileLink clientId={clientId} section="certificates">Configurar</ProfileLink>}
        />
      </ul>
    </section>
  );
}
