"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileSearch,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import useSWR from "swr";

import {
  ClientIssuanceReadinessPanel,
  useClientIssuanceReadiness,
} from "@/components/dashboard/client-issuance-readiness";
import { NfeContextReview } from "@/components/dashboard/nfe-context-review";
import { DuimpCaptureDetails } from "@/components/dashboard/duimp-capture-details";
import { NfeDocumentPlanPanel } from "@/components/dashboard/nfe-document-plan";
import { NfeIssuanceStepper } from "@/components/dashboard/nfe-issuance-stepper";
import { NfeNumberSequenceSheet } from "@/components/dashboard/nfe-number-sequence-sheet";
import type { ClientRecord } from "@/lib/api/client-record";
import type { ImportProcessRecord, NfeWorkflowState } from "@/lib/api/import-process";
import { routes } from "@/lib/api/routes";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import { fetchProcessDuimp, updateImportProcess } from "@/lib/bff/import-process";
import { formatCnpj } from "@/lib/client-display";
import { formatProcessDate, nextActionLabels } from "@/lib/import-process-display";

function normalizeDuimp(value: string) {
  return value.trim().toUpperCase().replace(/[\s-]/g, "");
}

function isValidDuimp(value: string) {
  return /^[0-9]{2}BR[0-9]{11}$/.test(normalizeDuimp(value));
}

function formattedDuimp(value: string) {
  const compact = normalizeDuimp(value);
  return `${compact.slice(0, -1)}-${compact.slice(-1)}`;
}

export function NfeIssuanceProcess({ processId }: { processId: string }) {
  const processUrl = routes.bff.importProcess.detail(processId);
  const workflowUrl = routes.bff.importProcess.workflowState(processId);
  const processRequest = useSWR<ImportProcessRecord>(processUrl, bffFetcher);
  const workflowRequest = useSWR<NfeWorkflowState>(workflowUrl, bffFetcher);
  const clientId = processRequest.data?.importer_id;
  const clientRequest = useSWR<ClientRecord>(clientId ? routes.bff.client.detail(clientId) : null, bffFetcher);
  const readiness = useClientIssuanceReadiness(clientId);
  const [sequenceSheetOpen, setSequenceSheetOpen] = useState(false);
  const [duimpNumber, setDuimpNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const workflow = workflowRequest.data;
  const process = processRequest.data;
  const client = clientRequest.data;
  const hasSnapshot = Boolean(workflow?.latest_snapshot);
  const canFetch = readiness.hasFiscalProfile && Boolean(readiness.activeSequence) && readiness.hasPortalConnection && !readiness.hasError;
  const currentDuimpNumber = duimpNumber || process?.duimp_number || "";

  async function submitDuimp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidDuimp(currentDuimpNumber)) {
      setError("Informe a DUIMP no formato 00BR0000000000-0.");
      return;
    }
    if (!canFetch) {
      setError("Conclua os requisitos obrigatórios antes de consultar a DUIMP.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const normalized = formattedDuimp(currentDuimpNumber);
      await updateImportProcess(processId, { duimp_number: normalized, source: "portal_unico" });
      await fetchProcessDuimp(processId);
      setDuimpNumber(normalized);
      await Promise.all([processRequest.mutate(), workflowRequest.mutate()]);
    } catch (requestError) {
      setError(bffErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if ((processRequest.isLoading || workflowRequest.isLoading) && !process && !workflow) {
    return <div className="space-y-5" aria-label="Carregando processo"><div className="h-32 animate-pulse rounded-2xl bg-muted" /><div className="h-80 animate-pulse rounded-2xl bg-muted" /></div>;
  }

  if (processRequest.error || workflowRequest.error || !process || !workflow) {
    return (
      <div className="surface-card p-10 text-center">
        <AlertTriangle className="mx-auto text-destructive" size={30} />
        <p className="mt-4 text-sm text-destructive">{bffErrorMessage(processRequest.error ?? workflowRequest.error)}</p>
        <button type="button" className="button button-secondary mt-5" onClick={() => Promise.all([processRequest.mutate(), workflowRequest.mutate()])}>
          <RefreshCw size={16} /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      <Link href="/dashboard/processos" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} /> Voltar para processos
      </Link>

      <header className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Emissão de NF-e</p>
          <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.04em]">{process.reference_code}</h1>
          <p className="mt-2 text-muted-foreground">
            {client ? `${client.nome_resumido || client.razao_social} · ${formatCnpj(client.cnpj)}` : "Carregando cliente..."}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">Atualizado em {formatProcessDate(process.updated_at)}</p>
      </header>

      <div className="mt-8"><NfeIssuanceStepper steps={workflow.steps} /></div>

      {!hasSnapshot && clientId ? (
        <div className="mt-8">
          <ClientIssuanceReadinessPanel clientId={clientId} readiness={readiness} onConfigureSequence={() => setSequenceSheetOpen(true)} />
        </div>
      ) : null}

      <section className="surface-card mt-6 overflow-hidden">
        <div className="border-b border-border p-5 sm:p-6">
          <p className="eyebrow">Etapa 2</p>
          <h2 className="mt-2 text-2xl font-semibold">Capturar dados da DUIMP</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A consulta usa as credenciais organizacionais do Portal Único e vincula o retorno a este processo.
          </p>
        </div>

        {hasSnapshot && workflow.latest_snapshot ? (
          <div className="p-6 sm:p-8">
            <div className="rounded-2xl border border-primary/20 bg-sage-soft p-5 text-sage-strong">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0" size={21} />
                <div>
                  <p className="font-semibold">DUIMP capturada com sucesso</p>
                  <p className="mt-1 font-mono text-sm">{workflow.latest_snapshot.duimp_number}</p>
                  <p className="mt-2 text-sm">
                    Próxima ação: {nextActionLabels[workflow.next_action] ?? workflow.next_action}.
                  </p>
                </div>
              </div>
              <DuimpCaptureDetails processId={processId} snapshotId={workflow.latest_snapshot.id} />
            </div>
          </div>
        ) : (
          <form onSubmit={submitDuimp} className="p-6 sm:p-8">
            <label className="block max-w-xl">
              <span className="field-label">Número da DUIMP *</span>
              <input
                className="field-input font-mono uppercase"
                value={currentDuimpNumber}
                onChange={(event) => { setDuimpNumber(event.target.value); setError(null); }}
                placeholder="00BR0000000000-0"
                autoCapitalize="characters"
                disabled={submitting}
              />
              <span className="mt-1.5 block text-xs text-muted-foreground">Aceitamos o número com ou sem hífen.</span>
            </label>

            {!canFetch ? (
              <div className="mt-5 flex max-w-2xl items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                Conclua perfil fiscal, sequência NF-e e conexão com o Portal Único. Regras tributárias e certificado serão cobrados somente nas etapas em que forem necessários.
              </div>
            ) : null}
            {error ? <p className="mt-4 text-sm text-destructive" role="alert">{error}</p> : null}

            <button type="submit" className="button button-primary mt-6 min-h-12 px-6" disabled={submitting || !canFetch || !isValidDuimp(currentDuimpNumber)}>
              {submitting ? <LoaderCircle className="animate-spin" size={17} /> : <FileSearch size={17} />}
              {submitting ? "Consultando Portal Único..." : "Consultar e importar DUIMP"}
            </button>
          </form>
        )}
      </section>

      {workflow.latest_snapshot && clientId ? (
        <NfeContextReview
          processId={processId}
          clientId={clientId}
          snapshotId={workflow.latest_snapshot.id}
          onWorkflowChange={() => workflowRequest.mutate()}
        />
      ) : null}

      {workflow.latest_snapshot && workflow.prerequisites.item_classification_ready ? (
        <NfeDocumentPlanPanel
          processId={processId}
          snapshotId={workflow.latest_snapshot.id}
          requiresRebuild={workflow.next_action === "create_document_plan" && workflow.prerequisites.has_document_plan}
          onWorkflowChange={() => workflowRequest.mutate()}
        />
      ) : null}

      {clientId ? (
        <NfeNumberSequenceSheet
          open={sequenceSheetOpen}
          onOpenChange={setSequenceSheetOpen}
          clientId={clientId}
          sequence={readiness.activeSequence}
          onSaved={async (sequence) => {
            await readiness.setSequence(sequence);
            await workflowRequest.mutate();
          }}
        />
      ) : null}
    </>
  );
}
