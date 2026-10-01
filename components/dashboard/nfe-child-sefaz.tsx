"use client";

import { AlertTriangle, Download, LoaderCircle, Radio, RefreshCw } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

import { useDashboardSession } from "@/components/dashboard/dashboard-session-context";
import { NfeSectionHeader } from "@/components/dashboard/nfe-section-header";
import type { NfeDocumentPlan, NfePlannedDocument, NfeSefazStatus } from "@/lib/api/import-process";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import { authorizedDanfeUrl, authorizedNfeUrl, nfeSefazUrl, reconcileNfe, transmitNfe } from "@/lib/bff/import-process";

function supplierName(document: NfePlannedDocument) {
  return document.foreign_supplier?.name || document.foreign_supplier?.legal_name || document.exporter_code || `NF-e filha ${document.ordinal}`;
}

function SefazChild({ document, onChange }: { document: NfePlannedDocument; onChange: () => Promise<unknown> }) {
  const draft = document.draft;
  const { user } = useDashboardSession();
  const { data, error, mutate } = useSWR<NfeSefazStatus>(draft?.signed_xml ? nfeSefazUrl(draft.id) : null, bffFetcher, {
    revalidateOnFocus: true,
  });
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const isAdmin = user.role === "admin";
  const status = data?.status ?? "not_signed";
  const canTransmit = isAdmin && data?.enabled && status === "signed" && !busy;
  const canReconcile = isAdmin && data?.enabled && ["submission_pending", "submitted", "processing"].includes(status) && !busy;

  async function run(action: "transmit" | "reconcile") {
    if (!draft) return;
    if (action === "transmit" && !window.confirm(`Transmitir a NF-e filha ${document.ordinal}, chave ${draft.access_key}, à SEFAZ de PRODUÇÃO? Esta operação pode autorizar uma nota fiscal real.`)) return;
    setBusy(true);
    setActionError(null);
    try {
      if (action === "transmit") await transmitNfe(draft.id);
      else await reconcileNfe(draft.id);
    } catch (cause) {
      setActionError(bffErrorMessage(cause));
    } finally {
      await Promise.allSettled([mutate(), onChange()]);
      setBusy(false);
    }
  }

  return (
    <article className="rounded-2xl border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-semibold">NF-e filha {document.ordinal} · {supplierName(document)}</p>
          <p className="mt-1 break-all text-xs text-muted-foreground">Chave: {draft?.access_key || "aguardando"}</p>
          <p className="mt-2 text-sm">{!draft?.signed_xml ? "Aguardando assinatura" : !data ? "Consultando situação..." : status === "authorized" ? "Autorizada pela SEFAZ" : status === "rejected" ? "Rejeitada pela SEFAZ" : status === "denied" ? "Uso denegado pela SEFAZ" : status === "signed" ? "Assinada, aguardando transmissão" : "Resultado pendente de consulta"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canTransmit ? <button type="button" className="button button-primary" onClick={() => void run("transmit")}><Radio size={16} /> Transmitir à SEFAZ</button> : null}
          {canReconcile ? <button type="button" className="button button-secondary" onClick={() => void run("reconcile")}><RefreshCw size={16} /> Consultar resultado</button> : null}
          {draft && status === "authorized" ? <a className="button button-secondary" href={authorizedNfeUrl(draft.id)}><Download size={16} /> XML autorizado</a> : null}
          {draft && status === "authorized" && data?.authorized_xml_version_id ? <a className="button button-secondary" href={authorizedDanfeUrl(draft.id)}><Download size={16} /> DANFE autorizado</a> : null}
        </div>
      </div>
      {busy ? <p className="mt-3 flex items-center gap-2 text-sm"><LoaderCircle className="animate-spin" size={16} /> Aguardando retorno...</p> : null}
      {draft?.signed_xml && data?.enabled === false ? <p className="mt-3 text-sm text-amber-800 dark:text-amber-300">Transmissão de produção desabilitada na API. Configure os endpoints oficiais antes de emitir.</p> : null}
      {data?.receipt_number ? <p className="mt-3 text-sm">Recibo: <span className="font-mono">{data.receipt_number}</span></p> : null}
      {data?.protocol_number ? <p className="mt-3 text-sm">Protocolo: <span className="font-mono">{data.protocol_number}</span></p> : null}
      {data?.rejection_code ? <p className="mt-3 text-sm text-destructive">Rejeição {data.rejection_code}: {data.rejection_reason}</p> : null}
      {data?.last_error ? <p className="mt-3 text-sm text-amber-800 dark:text-amber-300">{data.last_error}</p> : null}
      {error || actionError ? <p className="mt-3 text-sm text-destructive" role="alert">{actionError || bffErrorMessage(error)}</p> : null}
      {data?.attempts?.length ? <details className="mt-4 text-xs text-muted-foreground"><summary className="cursor-pointer">Histórico de consultas e tentativas</summary><ul className="mt-2 space-y-1">{data.attempts.map((attempt, index) => <li key={`${attempt.started_at}-${index}`}>{new Date(attempt.started_at).toLocaleString("pt-BR")} · {attempt.operation} · {attempt.status} {attempt.response_code ? `· ${attempt.response_code} ${attempt.response_message || ""}` : ""}</li>)}</ul></details> : null}
    </article>
  );
}

export function NfeChildSefazPanel({ plan, onChange }: { plan: NfeDocumentPlan; onChange: () => Promise<unknown> }) {
  return (
    <section id="transmissao-nfe" data-unlocked={plan.progress.all_signed} className="surface-card mt-6 scroll-mt-56 lg:scroll-mt-40">
      <NfeSectionHeader step={9} title="Transmissão e autorização SEFAZ" summary="Uma NF-e real por filha, com protocolo individual" />
      <div className="space-y-4 p-5 sm:p-7">
        <p className="flex items-start gap-2 rounded-2xl border border-amber-400/35 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-300"><AlertTriangle size={18} className="shrink-0" />Esta etapa usa SEFAZ de produção. Cada transmissão pode autorizar uma NF-e real. Se o retorno for incerto, consulte a chave ou o recibo; o sistema bloqueia um segundo envio automático.</p>
        {!plan.progress.all_signed ? <p className="text-sm text-muted-foreground">Assine todas as NF-e filhas na etapa 8 antes de iniciar a transmissão.</p> : null}
        {plan.documents.map((document) => <SefazChild key={document.id} document={document} onChange={onChange} />)}
        <p className="text-xs text-muted-foreground">Após a autorização, baixe o XML com protocolo e o DANFE em PDF da NF-e filha. A prévia da etapa 8 continua identificada como sem valor fiscal.</p>
      </div>
    </section>
  );
}
