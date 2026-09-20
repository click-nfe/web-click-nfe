"use client";

import {
  CheckCircle2,
  FileKey2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Upload,
  Plus,
} from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import useSWR from "swr";

import type {
  FiscalCertificateEnvironment,
  FiscalCertificateRecord,
  FiscalCertificateStatus,
} from "@/lib/api/fiscal-certificate";
import { routes } from "@/lib/api/routes";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import {
  activateFiscalCertificate,
  uploadFiscalCertificate,
  validateFiscalCertificate,
} from "@/lib/bff/fiscal-certificate";
import { formatCnpj } from "@/lib/client-display";
import { Sheet } from "@/components/ui/sheet";

const statusLabels: Record<FiscalCertificateStatus, string> = {
  pending_validation: "Validado, aguardando ativação",
  active: "Ativo",
  expired: "Expirado",
  revoked: "Revogado",
  disabled: "Inativo",
  invalid: "Inválido",
};

const environmentLabels: Record<FiscalCertificateEnvironment, string> = {
  homologation: "Homologação",
  production: "Produção",
};

function formatDate(value: string | null) {
  if (!value) return "Não informada";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function storageLabel(provider: FiscalCertificateRecord["provider"]) {
  if (provider === "local_encrypted_file") return "Cofre local criptografado";
  if (provider === "gcp_secret_manager") return "Google Secret Manager";
  return "Google Cloud Storage";
}

function statusClass(status: FiscalCertificateStatus) {
  if (status === "active") return "bg-sage-soft text-sage-strong";
  if (status === "invalid" || status === "expired" || status === "revoked") {
    return "bg-destructive/10 text-destructive";
  }
  return "bg-muted text-muted-foreground";
}

export function ClientCertificates({ clientId }: { clientId: string }) {
  const url = routes.bff.client.fiscalCertificates(clientId);
  const { data, error, isLoading, mutate } = useSWR<FiscalCertificateRecord[]>(
    url,
    bffFetcher,
  );
  const fileInput = useRef<HTMLInputElement>(null);
  const [environment, setEnvironment] =
    useState<FiscalCertificateEnvironment>("homologation");
  const [password, setPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setFormError("Selecione um certificado .pfx ou .p12.");
      return;
    }
    if (!password) {
      setFormError("Informe a senha do certificado.");
      return;
    }
    setUploading(true);
    setFormError(null);
    setNotice(null);
    try {
      await uploadFiscalCertificate(clientId, file, password, environment);
      setPassword("");
      if (fileInput.current) fileInput.current.value = "";
      setNotice(
        "Certificado validado e armazenado. Ative-o quando quiser usá-lo na assinatura.",
      );
      await mutate();
      setSheetOpen(false);
    } catch (uploadError) {
      setPassword("");
      setFormError(bffErrorMessage(uploadError));
      await mutate().catch(() => undefined);
    } finally {
      setUploading(false);
    }
  }

  async function runAction(
    certificate: FiscalCertificateRecord,
    action: "validate" | "activate",
  ) {
    setActionId(certificate.id);
    setFormError(null);
    setNotice(null);
    try {
      if (action === "activate") {
        await activateFiscalCertificate(clientId, certificate.id);
        setNotice(`Certificado de ${environmentLabels[certificate.environment]} ativado.`);
      } else {
        await validateFiscalCertificate(clientId, certificate.id);
        setNotice("Certificado validado novamente com sucesso.");
      }
      await mutate();
    } catch (actionError) {
      setFormError(bffErrorMessage(actionError));
      await mutate();
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-border p-6 sm:p-8">
          <div>
            <p className="eyebrow">Assinatura digital</p>
            <h2 className="mt-3 text-2xl font-semibold">Certificados eCNPJ A1</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Certificados cadastrados para homologação e produção. Somente um pode ficar ativo por ambiente.
            </p>
          </div>
          <button type="button" className="button button-primary shrink-0" onClick={() => { setFormError(null); setSheetOpen(true); }}>
            <Plus size={16} /> Adicionar certificado
          </button>
        </div>

        {notice ? (
          <p className="mx-6 mt-6 flex items-center gap-2 rounded-xl bg-sage-soft p-4 text-sm text-sage-strong sm:mx-8" role="status">
            <CheckCircle2 size={16} /> {notice}
          </p>
        ) : null}
        {!sheetOpen && formError ? (
          <p className="mx-6 mt-6 rounded-xl bg-destructive/10 p-4 text-sm text-destructive sm:mx-8" role="alert">{formError}</p>
        ) : null}

        {error ? (
          <div className="p-10 text-center">
            <p className="text-sm text-destructive">{bffErrorMessage(error)}</p>
            <button type="button" className="button button-secondary mt-4" onClick={() => mutate()}>
              <RefreshCw size={16} /> Tentar novamente
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3 p-6" aria-label="Carregando certificados">
            {[0, 1].map((item) => (
              <div key={item} className="h-32 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : data?.length ? (
          <div className="divide-y divide-border">
            {data.map((certificate) => (
              <article key={certificate.id} className="p-6 sm:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {environmentLabels[certificate.environment]}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(certificate.status)}`}>
                        {statusLabels[certificate.status]}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm text-muted-foreground">
                      {certificate.subject_name || "Titular não informado"}
                    </p>
                    <dl className="mt-5 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
                      <div><dt className="text-xs text-muted-foreground">CNPJ</dt><dd className="mt-1 font-medium">{formatCnpj(certificate.issuer_cnpj)}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Válido até</dt><dd className="mt-1 font-medium">{formatDate(certificate.valid_until)}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Armazenamento</dt><dd className="mt-1 font-medium">{storageLabel(certificate.provider)}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Impressão SHA-256</dt><dd className="mt-1 font-mono text-xs">{certificate.certificate_fingerprint_sha256?.slice(-16) || "Não informada"}</dd></div>
                    </dl>
                    {certificate.validation_error ? (
                      <p className="mt-4 text-sm text-destructive">{certificate.validation_error}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      className="button button-secondary"
                      disabled={actionId !== null || uploading}
                      onClick={() => runAction(certificate, "validate")}
                    >
                      <RefreshCw className={actionId === certificate.id ? "animate-spin" : ""} size={16} />
                      Validar
                    </button>
                    {!certificate.is_active ? (
                      <button
                        type="button"
                        className="button button-primary"
                        disabled={actionId !== null || uploading}
                        onClick={() => runAction(certificate, "activate")}
                      >
                        <ShieldCheck size={16} /> Ativar
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileKey2 className="mx-auto text-sage-strong" size={32} />
            <p className="mt-4 font-medium">Nenhum certificado cadastrado.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Adicione o primeiro eCNPJ A1 para preparar a assinatura das notas.
            </p>
          </div>
        )}
      </section>

      <Sheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Adicionar certificado eCNPJ A1"
        description="O arquivo e a senha são validados antes do armazenamento. A senha nunca retorna pela API."
      >
        <form onSubmit={handleUpload} className="space-y-6 py-7">
          <label className="grid gap-2 text-sm font-semibold">
            Certificado A1
            <input
              ref={fileInput}
              type="file"
              name="certificate"
              accept=".pfx,.p12,application/x-pkcs12"
              className="min-h-12 rounded-xl border border-border bg-background px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-sage-soft file:px-3 file:py-1.5 file:font-semibold file:text-sage-strong"
              disabled={uploading || actionId !== null}
              required
            />
            <span className="text-xs font-normal text-muted-foreground">Formatos .pfx ou .p12, com até 2 MB.</span>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Senha do certificado
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" className="field-input" disabled={uploading || actionId !== null} required />
            <span className="text-xs font-normal text-muted-foreground">A senha não retorna pela API nem é armazenada no banco.</span>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Ambiente
            <select value={environment} onChange={(event) => setEnvironment(event.target.value as FiscalCertificateEnvironment)} className="field-input" disabled={uploading || actionId !== null}>
              <option value="homologation">Homologação</option>
              <option value="production">Produção</option>
            </select>
          </label>
          {formError ? <p className="text-sm text-destructive" role="alert">{formError}</p> : null}
          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-background py-5">
            <button type="button" className="button button-secondary" onClick={() => setSheetOpen(false)} disabled={uploading}>Cancelar</button>
            <button type="submit" className="button button-primary" disabled={uploading || actionId !== null}>
              {uploading ? <><LoaderCircle className="animate-spin" size={16} /> Validando...</> : <><Upload size={16} /> Enviar e validar</>}
            </button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
