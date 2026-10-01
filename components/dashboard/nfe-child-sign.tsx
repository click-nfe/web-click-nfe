"use client";

import { AlertTriangle, CheckCircle2, Download, FileSignature, LoaderCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useClientIssuanceReadiness } from "@/components/dashboard/client-issuance-readiness";
import { useDashboardSession } from "@/components/dashboard/dashboard-session-context";
import { xmlIsCurrent } from "@/components/dashboard/nfe-child-xml";
import { NfeSectionHeader } from "@/components/dashboard/nfe-section-header";
import type { NfeDocumentPlan, NfePlannedDocument } from "@/lib/api/import-process";
import { bffErrorMessage } from "@/lib/bff/client";
import { danfePreviewUrl, nfeDraftXmlDownloadUrl, signNfeDraftXml } from "@/lib/bff/import-process";

function supplierName(document: NfePlannedDocument) {
  return document.foreign_supplier?.name
    || document.foreign_supplier?.legal_name
    || document.exporter_code
    || `NF-e filha ${document.ordinal}`;
}

export function NfeChildSignPanel({
  clientId,
  plan,
  onPlanRefresh,
  onWorkflowChange,
}: {
  clientId: string;
  plan: NfeDocumentPlan;
  onPlanRefresh: () => Promise<unknown>;
  onWorkflowChange: () => Promise<unknown>;
}) {
  const { user } = useDashboardSession();
  const readiness = useClientIssuanceReadiness(clientId);
  const certificate = readiness.activeCertificate;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const canAdminSign = user.role === "admin";
  const allXmlsReady = plan.documents.length > 0 && plan.documents.every((document) =>
    document.draft?.latest_xml?.xsd_valid === true && xmlIsCurrent(document)
  );
  const pending = plan.documents.filter((document) => !document.draft?.signed_xml);
  const canSign = allXmlsReady && canAdminSign && certificate?.status === "active" && !readiness.hasError;
  const allSigned = plan.documents.length > 0 && pending.length === 0;

  async function sign(document: NfePlannedDocument) {
    const draft = document.draft;
    const xml = draft?.latest_xml;
    if (!canSign || !certificate || !draft || !xml || draft.signed_xml || busyId) return;
    setBusyId(document.id);
    setErrors((current) => ({ ...current, [document.id]: "" }));
    try {
      await signNfeDraftXml(draft.id, xml.id, certificate.id);
      await Promise.all([onPlanRefresh(), onWorkflowChange()]);
    } catch (error) {
      setErrors((current) => ({ ...current, [document.id]: bffErrorMessage(error) }));
    } finally {
      setBusyId(null);
    }
  }

  async function signAll() {
    if (!canSign || !certificate || busyId || !pending.length) return;
    if (!window.confirm("Assinar as NF-e filhas com o A1 ativo? Após a assinatura os rascunhos não poderão mais ser editados.")) return;
    setBusyId("all");
    const failures: Record<string, string> = {};
    try {
      for (const document of pending) {
        const draft = document.draft;
        if (!draft?.latest_xml) continue;
        try {
          await signNfeDraftXml(draft.id, draft.latest_xml.id, certificate.id);
        } catch (error) {
          failures[document.id] = bffErrorMessage(error);
        }
      }
      setErrors(failures);
      await Promise.all([onPlanRefresh(), onWorkflowChange()]);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section id="assinatura-nfe" data-unlocked={allXmlsReady} className="surface-card mt-6 scroll-mt-56 lg:scroll-mt-40">
      <NfeSectionHeader
        step={8}
        title="Assinatura e prévia da DANFE"
        summary={`${plan.progress.signed_count ?? 0} de ${plan.documents.length} NF-e assinada(s)`}
        actions={pending.length ? (
          <button type="button" className="button button-primary" disabled={!canSign || Boolean(busyId)} onClick={signAll}>
            {busyId === "all" ? <LoaderCircle className="animate-spin" size={16} /> : <FileSignature size={16} />}
            {busyId === "all" ? "Assinando..." : "Assinar todas"}
          </button>
        ) : null}
      />
      <div className="space-y-4 p-5 sm:p-7">
        <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${allSigned ? "border-primary/20 bg-sage-soft text-sage-strong" : "border-border bg-muted/35"}`}>
          {allSigned ? <CheckCircle2 className="mt-0.5 shrink-0" size={19} /> : <ShieldCheck className="mt-0.5 shrink-0" size={19} />}
          <div>
            <p className="font-semibold">{allSigned ? "Todas as NF-e filhas foram assinadas" : "Assinatura digital com certificado A1 do emitente"}</p>
            <p className="mt-1">O XML assinado passa por verificação criptográfica e nova validação XSD. A assinatura não envia a NF-e à SEFAZ.</p>
          </div>
        </div>

        {!allXmlsReady ? <p className="text-sm text-amber-800 dark:text-amber-300">Gere e valide todos os XMLs na etapa 7 antes de assinar.</p> : null}
        {!canAdminSign && !allSigned ? <p className="text-sm text-amber-800 dark:text-amber-300">Somente administradores podem assinar as NF-e.</p> : null}
        {!certificate && !readiness.loading && !allSigned ? (
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Ative o certificado A1 de produção do cliente. <Link className="underline" href={`/dashboard/clientes/${clientId}?section=certificates`} target="_blank">Abrir certificados</Link>
          </p>
        ) : null}
        {certificate ? <p className="text-xs text-muted-foreground">A1 ativo: CNPJ {certificate.issuer_cnpj} · Validade até {certificate.valid_until ? new Date(certificate.valid_until).toLocaleDateString("pt-BR") : "não informada"}.</p> : null}

        {plan.documents.map((document) => {
          const draft = document.draft;
          const signed = draft?.signed_xml;
          return (
            <article key={document.id} className="rounded-2xl border border-border p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">NF-e filha {document.ordinal} · {supplierName(document)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{signed ? `Assinado · XML versão ${signed.version_number}` : "Aguardando assinatura"}</p>
                </div>
                {draft && signed ? (
                  <div className="flex flex-wrap gap-2">
                    <a className="button button-secondary" href={nfeDraftXmlDownloadUrl(draft.id, signed.id)}><Download size={16} /> XML assinado</a>
                    <a className="button button-secondary" href={danfePreviewUrl(draft.id, signed.id)}><Download size={16} /> Prévia PDF</a>
                  </div>
                ) : (
                  <button type="button" className="button button-secondary" disabled={!canSign || Boolean(busyId) || !draft?.latest_xml} onClick={() => {
                    if (window.confirm(`Assinar a NF-e filha ${document.ordinal}? O rascunho não poderá mais ser editado.`)) void sign(document);
                  }}>
                    {busyId === document.id ? <LoaderCircle className="animate-spin" size={16} /> : <FileSignature size={16} />}
                    {busyId === document.id ? "Assinando..." : "Assinar esta NF-e"}
                  </button>
                )}
              </div>
              {errors[document.id] ? <p className="mt-3 text-sm text-destructive" role="alert">{errors[document.id]}</p> : null}
            </article>
          );
        })}
        <p className="flex items-start gap-2 text-xs text-muted-foreground"><AlertTriangle size={15} className="shrink-0" />O PDF é uma prévia de conferência sem valor fiscal e sem protocolo. O DANFE definitivo será disponibilizado após a autorização da SEFAZ.</p>
      </div>
    </section>
  );
}
