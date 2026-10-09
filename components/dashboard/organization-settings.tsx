"use client";

import axios from "axios";
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  PlugZap,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import useSWR from "swr";

import { useDashboardSession } from "@/components/dashboard/dashboard-session-context";
import { Sheet } from "@/components/ui/sheet";
import type { PortalUnicoSettings } from "@/lib/api/organization";
import { routes } from "@/lib/api/routes";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import {
  configurePortalUnico,
  testPortalUnicoConnection,
} from "@/lib/bff/organization";

const statePresentation = {
  not_configured: {
    label: "Não configurado",
    className: "bg-muted text-muted-foreground",
  },
  pending_test: {
    label: "Aguardando teste",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950/55 dark:text-amber-200",
  },
  connected: {
    label: "Conectado",
    className: "bg-sage-soft text-sage-strong",
  },
  error: {
    label: "Com erro",
    className: "bg-red-100 text-red-700 dark:bg-red-950/55 dark:text-red-200",
  },
  inactive: {
    label: "Inativo",
    className: "bg-muted text-muted-foreground",
  },
} as const;

function formatDate(value: string | null) {
  if (!value) return "Ainda não realizado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function storageLabel(value: string | null) {
  if (!value) return "Será definido ao configurar";
  if (value === "local_encrypted_file") return "Cofre local criptografado";
  if (value === "google_secret_manager") return "Google Secret Manager";
  return value;
}

export function OrganizationSettings() {
  const { user, organization } = useDashboardSession();
  const canManage = user.role.toLowerCase() === "admin";
  const [sheetOpen, setSheetOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState<
    { kind: "success" | "error"; message: string } | null
  >(null);
  const { data, error, isLoading, mutate } = useSWR<PortalUnicoSettings>(
    routes.bff.organization.portalUnico,
    bffFetcher,
  );

  const state = data ? statePresentation[data.state] : null;

  function resetCredentials() {
    setClientId("");
    setClientSecret("");
  }

  function handleSheetChange(open: boolean) {
    setSheetOpen(open);
    if (!open && !saving) resetCredentials();
  }

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const updated = await configurePortalUnico({
        client_id: clientId.trim(),
        client_secret: clientSecret,
      });
      await mutate(updated, { revalidate: false });
      resetCredentials();
      setSheetOpen(false);
      setNotice({
        kind: "success",
        message: "Credenciais armazenadas. Teste a conexão para liberar a consulta de DUIMP.",
      });
    } catch (submitError) {
      setNotice({ kind: "error", message: bffErrorMessage(submitError) });
    } finally {
      setClientSecret("");
      setSaving(false);
    }
  }

  async function testConnection() {
    setTesting(true);
    setNotice(null);
    try {
      const updated = await testPortalUnicoConnection();
      await mutate(updated, { revalidate: false });
      setNotice({
        kind: "success",
        message: "Conexão validada. A organização está pronta para consultar DUIMPs.",
      });
    } catch (testError) {
      if (
        axios.isAxiosError<PortalUnicoSettings>(testError) &&
        testError.response?.status === 422 &&
        testError.response.data?.state === "error"
      ) {
        await mutate(testError.response.data, { revalidate: false });
      } else {
        await mutate();
      }
      setNotice({ kind: "error", message: bffErrorMessage(testError) });
    } finally {
      setTesting(false);
    }
  }

  return (
    <>
      <div>
        <Link href="/dashboard/configuracoes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Configurações</Link>
        <p className="eyebrow">Organização</p>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.04em]">
          Portal Único
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Gerencie as conexões usadas por {organization.nome} para consultar dados
          aduaneiros e preparar a emissão de notas fiscais.
        </p>
      </div>

      {notice ? (
        <div
          className={`mt-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
            notice.kind === "success"
              ? "border-primary/20 bg-sage-soft text-sage-strong"
              : "border-destructive/25 bg-destructive/8 text-destructive"
          }`}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          {notice.kind === "success" ? (
            <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
          ) : (
            <AlertCircle className="mt-0.5 shrink-0" size={18} />
          )}
          <p>{notice.message}</p>
        </div>
      ) : null}

      <section className="surface-card mt-8 overflow-hidden">
        <div className="flex flex-col gap-5 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sage-soft text-sage-strong">
              <PlugZap size={22} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold">Portal Único Siscomex</h2>
                {state ? (
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${state.className}`}>
                    {state.label}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Credenciais organizacionais usadas para autenticar a captura das
                DUIMPs. Elas não substituem o certificado eCNPJ A1 de cada cliente.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              className="button button-secondary"
              disabled={!canManage || !data?.configured || testing}
              onClick={testConnection}
              title={!canManage ? "Apenas administradores podem testar a integração." : undefined}
            >
              {testing ? <LoaderCircle className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              {testing ? "Testando..." : "Testar conexão"}
            </button>
            <button
              type="button"
              className="button button-primary"
              disabled={!canManage}
              onClick={() => {
                setNotice(null);
                setSheetOpen(true);
              }}
              title={!canManage ? "Apenas administradores podem alterar credenciais." : undefined}
            >
              <KeyRound size={16} />
              {data?.configured ? "Substituir credenciais" : "Configurar credenciais"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto text-destructive" size={28} />
            <p className="mt-3 text-sm text-destructive">{bffErrorMessage(error)}</p>
            <button type="button" className="button button-secondary mt-5" onClick={() => mutate()}>
              <RefreshCw size={16} /> Tentar novamente
            </button>
          </div>
        ) : isLoading || !data ? (
          <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4" aria-label="Carregando integração">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="p-5 sm:p-7">
            <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ambiente</dt>
                <dd className="mt-2 text-sm font-medium">Produção</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Perfil de acesso</dt>
                <dd className="mt-2 text-sm font-medium">{data.role_type}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Client-Id</dt>
                <dd className="mt-2 font-mono text-sm font-medium">{data.client_id_hint ?? "Não cadastrado"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Último teste</dt>
                <dd className="mt-2 text-sm font-medium">{formatDate(data.last_healthcheck_at)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Armazenamento protegido</dt>
                <dd className="mt-2 text-sm font-medium">{storageLabel(data.credential_storage_provider)}</dd>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  O contrato já permite trocar o cofre local pelo Google Secret Manager sem alterar esta tela.
                </p>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Consulta de DUIMP</dt>
                <dd className="mt-2 flex items-center gap-2 text-sm font-medium">
                  {data.ready_for_duimp ? (
                    <CheckCircle2 className="text-sage-strong" size={17} />
                  ) : (
                    <AlertCircle className="text-amber-600 dark:text-amber-300" size={17} />
                  )}
                  {data.ready_for_duimp ? "Liberada" : "Bloqueada até a validação"}
                </dd>
              </div>
            </dl>

            {data.blockers.length ? (
              <div className="mt-7 rounded-2xl border border-amber-300/55 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/35 dark:text-amber-100">
                <p className="font-semibold">Pendências da integração</p>
                <ul className="mt-2 space-y-1.5">
                  {data.blockers.map((blocker) => (
                    <li key={blocker.code} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      <span>{blocker.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-7 flex items-start gap-3 rounded-2xl border border-primary/20 bg-sage-soft p-4 text-sm text-sage-strong">
                <ShieldCheck className="mt-0.5 shrink-0" size={18} />
                <p>A autenticação foi validada e a organização está pronta para a etapa de captura da DUIMP.</p>
              </div>
            )}

            {!canManage ? (
              <p className="mt-5 text-xs text-muted-foreground">
                Você pode consultar o estado da integração. Somente administradores podem alterar ou testar as credenciais.
              </p>
            ) : null}
          </div>
        )}
      </section>

      <Sheet
        open={sheetOpen}
        onOpenChange={handleSheetChange}
        title={data?.configured ? "Substituir credenciais" : "Configurar Portal Único"}
        description="Informe o Client-Id e o Client-Secret da organização. Salvar um novo par substitui imediatamente o anterior."
      >
        <form onSubmit={submitCredentials} className="py-6">
          <div className="rounded-2xl border border-primary/15 bg-sage-soft p-4 text-sm leading-6 text-sage-strong">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 shrink-0" size={18} />
              <p>
                O Client-Secret é enviado diretamente à API, criptografado no cofre configurado e nunca devolvido ao navegador.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="field-label">Client-Id *</span>
              <input
                className="field-input font-mono"
                value={clientId}
                onChange={(event) => setClientId(event.target.value)}
                autoComplete="off"
                maxLength={512}
                placeholder={data?.client_id_hint ?? "Identificador fornecido pelo Portal Único"}
                required
                disabled={saving}
              />
            </label>
            <label className="block">
              <span className="field-label">Client-Secret *</span>
              <input
                className="field-input font-mono"
                type="password"
                value={clientSecret}
                onChange={(event) => setClientSecret(event.target.value)}
                autoComplete="new-password"
                maxLength={2048}
                placeholder="Cole o segredo da integração"
                required
                disabled={saving}
              />
              <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                Por segurança, o valor atual não pode ser recuperado. Para alterar o Client-Id, informe também um novo Client-Secret.
              </span>
            </label>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="button button-secondary"
              disabled={saving}
              onClick={() => handleSheetChange(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="button button-primary"
              disabled={saving || !clientId.trim() || !clientSecret.trim()}
            >
              {saving ? <LoaderCircle className="animate-spin" size={16} /> : <KeyRound size={16} />}
              {saving ? "Salvando..." : "Salvar credenciais"}
            </button>
          </div>
        </form>
      </Sheet>
    </>
  );
}
