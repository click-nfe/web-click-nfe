"use client";

import { AlertTriangle, CheckCircle2, Download, FileCode2, LoaderCircle, ShieldAlert } from "lucide-react";
import { useState } from "react";

import type { NfeChildXmlResult, NfeDocumentPlan, NfePlannedDocument } from "@/lib/api/import-process";
import { bffErrorMessage } from "@/lib/bff/client";
import {
  generateNfeChildXmls,
  nfeChildXmlBundleUrl,
  nfeDraftXmlDownloadUrl,
} from "@/lib/bff/import-process";

function supplierName(document: NfePlannedDocument) {
  return document.foreign_supplier?.name
    || document.foreign_supplier?.legal_name
    || document.exporter_code
    || `NF-e filha ${document.ordinal}`;
}

function xmlIsCurrent(document: NfePlannedDocument) {
  const draft = document.draft;
  const xml = draft?.latest_xml;
  if (!draft || !xml) return false;
  const editedAt = Date.parse(draft.updated_at ?? "");
  const generatedAt = Date.parse(xml.generated_at ?? "");
  return !Number.isFinite(editedAt) || (Number.isFinite(generatedAt) && editedAt <= generatedAt);
}

export function NfeChildXmlPanel({
  processId,
  snapshotId,
  plan,
  onPlanChange,
  onWorkflowChange,
}: {
  processId: string;
  snapshotId: string;
  plan: NfeDocumentPlan;
  onPlanChange: (plan: NfeDocumentPlan) => Promise<unknown>;
  onWorkflowChange: () => Promise<unknown>;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NfeChildXmlResult[]>([]);
  const allDraftsReady = plan.progress.all_drafts_created
    && plan.documents.every((document) => document.draft && !(document.draft.validation_errors ?? []).length);
  const allXmlsValid = plan.documents.length > 0
    && plan.documents.every((document) => xmlIsCurrent(document) && document.draft?.latest_xml?.xsd_valid === true);

  async function generate() {
    setGenerating(true);
    setError(null);
    setResults([]);
    try {
      const response = await generateNfeChildXmls(processId, snapshotId);
      setResults(response.results);
      await onPlanChange(response.plan);
      await onWorkflowChange();
    } catch (requestError) {
      setError(bffErrorMessage(requestError));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section id="xmls-nfe" className="surface-card mt-6 scroll-mt-24 overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <p className="eyebrow">Etapa 7</p>
          <h2 className="mt-2 text-2xl font-semibold">Chaves e XMLs das NF-e filhas</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Reserve a numeração de cada filha apenas nesta etapa, gere a chave de acesso e valide o XML NF-e 4.00 não assinado pelo XSD.
          </p>
        </div>
        <button type="button" className="button button-primary" disabled={!allDraftsReady || generating} onClick={generate}>
          {generating ? <LoaderCircle className="animate-spin" size={16} /> : <FileCode2 size={16} />}
          {generating ? "Gerando e validando..." : allXmlsValid ? "Revalidar XMLs" : "Gerar e validar XMLs"}
        </button>
      </div>

      <div className="space-y-4 p-5 sm:p-7">
        {!allDraftsReady ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-400/35 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} />
            Gere e corrija todos os rascunhos na etapa 6 antes de reservar os números.
          </div>
        ) : (
          <div className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${allXmlsValid ? "border-primary/20 bg-sage-soft text-sage-strong" : "border-border bg-muted/35 text-muted-foreground"}`}>
            {allXmlsValid ? <CheckCircle2 className="mt-0.5 shrink-0" size={19} /> : <FileCode2 className="mt-0.5 shrink-0" size={19} />}
            <span>{allXmlsValid
              ? "Todos os XMLs individuais estão válidos no XSD."
              : `${plan.progress.xsd_valid_count} de ${plan.documents.length} XML(s) com validação XSD registrada. Confira cada resultado abaixo.`}</span>
          </div>
        )}

        {plan.documents.map((document) => {
          const draft = document.draft;
          const xml = draft?.latest_xml;
          const current = xmlIsCurrent(document);
          const result = results.find((item) => item.planned_document_id === document.id);
          const xsdErrors = xml?.xsd_errors ?? result?.xsd_errors ?? [];
          const valid = current && xml?.xsd_valid === true;
          return (
            <article key={document.id} className="rounded-2xl border border-border p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">NF-e filha {document.ordinal} · {supplierName(document)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {draft?.number ? `Série ${draft.series} · Número ${draft.number}` : "Numeração ainda não reservada"}
                  </p>
                </div>
                {draft && xml ? (
                  <a className="button button-secondary" href={nfeDraftXmlDownloadUrl(draft.id, xml.id)}>
                    <Download size={16} /> Baixar XML v{xml.version_number}
                  </a>
                ) : null}
              </div>
              {draft?.access_key ? (
                <p className="mt-3 break-all font-mono text-xs">Chave de acesso: {draft.access_key}</p>
              ) : null}
              <div className={`mt-4 flex items-center gap-2 text-sm ${valid ? "text-sage-strong" : "text-muted-foreground"}`}>
                {valid ? <CheckCircle2 size={17} /> : <ShieldAlert size={17} />}
                <span>{!xml ? "XML pendente" : !current ? "XML desatualizado após edição do rascunho" : valid ? "XML não assinado válido no XSD" : xml.xsd_valid === false ? "XML reprovado no XSD" : "Validação XSD pendente"}</span>
              </div>
              {result?.message ? <p className="mt-3 text-sm text-destructive" role="alert">{result.message}</p> : null}
              {xsdErrors.length ? (
                <ul className="mt-3 space-y-1 text-sm text-destructive">
                  {xsdErrors.map((issue, index) => <li key={index}>{issue.line ? `Linha ${issue.line}: ` : ""}{issue.message ?? "Erro de validação XSD"}</li>)}
                </ul>
              ) : null}
            </article>
          );
        })}

        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        {allXmlsValid ? (
          <a className="button button-secondary" href={nfeChildXmlBundleUrl(processId, snapshotId)}>
            <Download size={16} /> Baixar todos os XMLs (.zip)
          </a>
        ) : null}
        <p className="text-xs text-muted-foreground">Os XMLs são diagnósticos e não assinados. A transmissão à SEFAZ permanece indisponível.</p>
      </div>
    </section>
  );
}
