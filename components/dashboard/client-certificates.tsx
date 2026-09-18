"use client";

import {
  CheckCircle2,
  FileKey2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Upload,
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
    } catch (uploadError) {
      setPassword("");
      setFormError(bffErrorMessage(uploadError));
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
        <div className="border-b border-border p-6 sm:p-8">
          <p className="eyebrow">Assinatura digital</p>
          <h2 className="mt-3 text-2xl font-semibold">Certificados eCNPJ A1</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Envie um arquivo .pfx ou .p12. O CNPJ, a senha, a validade e a chave de
            assinatura são conferidos antes do armazenamento.
          </p>
        </div>

        <form onSubmit={handleUpload} className="grid gap-5 p-6 sm:p-8 lg:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Certificado A1
            <input
              ref={fileInput}
              type="file"
              name="certificate"
              accept=".pfx,.p12,application/x-pkcs12"
              className="min-h-12 rounded-xl border border-border bg-background px-4 py-3 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-sage-soft file:px-3 file:py-1.5 file:font-semibold file:text-sage-strong"
              disabled={uploading}
              required
            />
            <span className="text-xs font-normal text-muted-foreground">
              Tamanho máximo: 2 MB.
            </span>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Senha do certificado
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              className="min-h-12 rounded-xl border border-border bg-background px-4 outline-none ring-primary/20 focus:ring-4"
              disabled={uploading}
              required
            />
            <span className="text-xs font-normal text-muted-foreground">
              A senha não retorna pela API nem é armazenada no banco.
            </span>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Ambiente
            <select
              value={environment}
              onChange={(event) =>
                setEnvironment(event.target.value as FiscalCertificateEnvironment)
              }
              className="min-h-12 rounded-xl border border-border bg-background px-4 outline-none ring-primary/20 focus:ring-4"
              disabled={uploading}
            >
              <option value="homologation">Homologação</option>
              <option value="production">Produção</option>
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" className="button button-primary" disabled={uploading}>
              {uploading ? (
                <><LoaderCircle className="animate-spin" size={16} /> Validando...</>
              ) : (
                <><Upload size={16} /> Enviar e validar</>
              )}
            </button>
          </div>
          {formError ? (
            <p className="text-sm text-destructive lg:col-span-2" role="alert">
              {formError}
            </p>
          ) : null}
          {notice ? (
            <p className="flex items-center gap-2 text-sm text-sage-strong lg:col-span-2" role="status">
              <CheckCircle2 size={16} /> {notice}
            </p>
          ) : null}
        </form>
      </section>

      <section className="surface-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-border p-6 sm:p-8">
          <div>
            <h2 className="text-lg font-semibold">Certificados cadastrados</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Somente um certificado pode ficar ativo por ambiente.
            </p>
          </div>
          <ShieldCheck className="shrink-0 text-sage-strong" size={24} />
        </div>

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
                      disabled={actionId === certificate.id}
                      onClick={() => runAction(certificate, "validate")}
                    >
                      <RefreshCw className={actionId === certificate.id ? "animate-spin" : ""} size={16} />
                      Validar
                    </button>
                    {!certificate.is_active ? (
                      <button
                        type="button"
                        className="button button-primary"
                        disabled={actionId === certificate.id}
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
              Use o formulário acima para enviar o primeiro eCNPJ A1.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
