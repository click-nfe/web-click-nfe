"use client";

import axios from "axios";
import { ArrowLeft, CheckCircle2, RefreshCw, Save, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import useSWR from "swr";

import type {
  ClientRecord,
  CreateClientPayload,
  UpdateClientPayload,
} from "@/lib/api/client-record";
import { routes } from "@/lib/api/routes";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import {
  createClient,
  lookupClientCompany,
  updateClient,
} from "@/lib/bff/clients";
import {
  cnpjCharacters,
  formatCnae,
  formatCnpj,
  isValidCnpj,
} from "@/lib/client-display";

type ClientFormValues = {
  cnpj: string;
  razao_social: string;
  nome_resumido: string;
  inscricao_estadual: string;
  inscricao_municipal: string;
  regime_tributacao: string;
  cnae_principal: string;
  cnae_secundario: string;
  endereco_completo_escritorio: string;
  endereco_completo_armazem: string;
  ativo: boolean;
};

type ClientErrorBody = {
  error?: string;
  message?: string;
  messages?: Record<string, string[]>;
  client_id?: string;
};

const emptyValues: ClientFormValues = {
  cnpj: "",
  razao_social: "",
  nome_resumido: "",
  inscricao_estadual: "",
  inscricao_municipal: "",
  regime_tributacao: "",
  cnae_principal: "",
  cnae_secundario: "",
  endereco_completo_escritorio: "",
  endereco_completo_armazem: "",
  ativo: true,
};

function valuesFromClient(client: ClientRecord): ClientFormValues {
  return {
    cnpj: formatCnpj(client.cnpj),
    razao_social: client.razao_social,
    nome_resumido: client.nome_resumido ?? "",
    inscricao_estadual: client.inscricao_estadual ?? "",
    inscricao_municipal: client.inscricao_municipal ?? "",
    regime_tributacao: client.regime_tributacao ?? "",
    cnae_principal: client.cnae_principal ?? "",
    cnae_secundario: client.cnae_secundario ?? "",
    endereco_completo_escritorio: client.endereco_completo_escritorio ?? "",
    endereco_completo_armazem: client.endereco_completo_armazem ?? "",
    ativo: client.ativo,
  };
}

function nullable(value: string) {
  return value.trim() || null;
}

function payloadFromValues(values: ClientFormValues): CreateClientPayload {
  return {
    cnpj: cnpjCharacters(values.cnpj),
    razao_social: values.razao_social.trim(),
    nome_resumido: nullable(values.nome_resumido),
    inscricao_estadual: nullable(values.inscricao_estadual),
    inscricao_municipal: nullable(values.inscricao_municipal),
    regime_tributacao: nullable(values.regime_tributacao),
    cnae_principal: nullable(values.cnae_principal),
    cnae_secundario: nullable(values.cnae_secundario),
    endereco_completo_escritorio: nullable(values.endereco_completo_escritorio),
    endereco_completo_armazem: nullable(values.endereco_completo_armazem),
    ativo: values.ativo,
  };
}

function ClientForm({
  initialClient,
  initialNotice,
  onUpdated,
}: {
  initialClient?: ClientRecord;
  initialNotice?: string;
  onUpdated?: (client: ClientRecord) => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ClientFormValues>(() =>
    initialClient ? valuesFromClient(initialClient) : emptyValues,
  );
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [notice, setNotice] = useState<string | null>(initialNotice ?? null);
  const [lookupNotice, setLookupNotice] = useState<string | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [existingClientId, setExistingClientId] = useState<string | null>(null);
  const editing = Boolean(initialClient);

  function setValue<K extends keyof ClientFormValues>(
    field: K,
    value: ClientFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setNotice(null);
  }

  async function lookupCnpj() {
    setFormError(null);
    setExistingClientId(null);
    setLookupNotice(null);
    setRegistrationStatus(null);
    if (!isValidCnpj(values.cnpj)) {
      setFieldErrors((current) => ({
        ...current,
        cnpj: "Informe um CNPJ válido antes de consultar.",
      }));
      return;
    }

    setLookingUp(true);
    try {
      const company = await lookupClientCompany(cnpjCharacters(values.cnpj));
      setValues((current) => ({
        ...current,
        razao_social: company.legal_name || current.razao_social,
        nome_resumido: company.trade_name || current.nome_resumido,
        regime_tributacao:
          company.tax_regime_suggestion || current.regime_tributacao,
        cnae_principal: company.main_activity
          ? formatCnae(
              company.main_activity.code,
              company.main_activity.description,
            )
          : current.cnae_principal,
        cnae_secundario: company.secondary_activities.length
          ? company.secondary_activities
              .map((activity) => formatCnae(activity.code, activity.description))
              .join("\n")
          : current.cnae_secundario,
        endereco_completo_escritorio:
          company.formatted_address || current.endereco_completo_escritorio,
      }));
      setFieldErrors((current) => {
        const next = { ...current };
        delete next.cnpj;
        delete next.razao_social;
        return next;
      });
      setRegistrationStatus(company.registration_status || "Não informada");
      setLookupNotice(
        "Dados públicos preenchidos pela BrasilAPI. Revise as informações antes de salvar; a inscrição estadual continua manual.",
      );
    } catch (requestError) {
      setFormError(bffErrorMessage(requestError));
    } finally {
      setLookingUp(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setExistingClientId(null);
    setNotice(null);

    const validationErrors: Record<string, string> = {};
    if (!editing && !isValidCnpj(values.cnpj)) {
      validationErrors.cnpj = "Informe um CNPJ válido, com 14 caracteres e verificadores corretos.";
    }
    if (!values.razao_social.trim()) {
      validationErrors.razao_social = "Informe a razão social.";
    }
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const fullPayload = payloadFromValues(values);
      if (initialClient) {
        const payload: UpdateClientPayload = {
          razao_social: fullPayload.razao_social,
          nome_resumido: fullPayload.nome_resumido,
          inscricao_estadual: fullPayload.inscricao_estadual,
          inscricao_municipal: fullPayload.inscricao_municipal,
          regime_tributacao: fullPayload.regime_tributacao,
          cnae_principal: fullPayload.cnae_principal,
          cnae_secundario: fullPayload.cnae_secundario,
          endereco_completo_escritorio: fullPayload.endereco_completo_escritorio,
          endereco_completo_armazem: fullPayload.endereco_completo_armazem,
          ativo: fullPayload.ativo,
        };
        const updated = await updateClient(
          initialClient.id,
          payload,
        );
        onUpdated?.(updated);
        setNotice("Alterações salvas com sucesso.");
      } else {
        const created = await createClient(fullPayload);
        router.push(`/dashboard/clientes/${created.id}?created=1`);
      }
    } catch (requestError) {
      if (axios.isAxiosError<ClientErrorBody>(requestError)) {
        const body = requestError.response?.data;
        if (body?.messages) {
          setFieldErrors(
            Object.fromEntries(
              Object.entries(body.messages).map(([field, messages]) => [
                field,
                messages[0] ?? "Valor inválido.",
              ]),
            ),
          );
        }
        if (body?.client_id) setExistingClientId(body.client_id);
        setFormError(body?.message ?? bffErrorMessage(requestError));
      } else {
        setFormError(bffErrorMessage(requestError));
      }
    } finally {
      setSaving(false);
    }
  }

  const inputError = (field: keyof ClientFormValues) =>
    fieldErrors[field] ? (
      <span className="mt-1.5 block text-xs text-destructive">{fieldErrors[field]}</span>
    ) : null;

  return (
    <form onSubmit={submit} className="mt-8 space-y-6" noValidate>
      {notice ? (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-sage-soft px-5 py-4 text-sm text-sage-strong" role="status">
          <CheckCircle2 size={18} /> {notice}
        </div>
      ) : null}
      {lookupNotice ? (
        <div className="rounded-2xl border border-primary/20 bg-sage-soft px-5 py-4 text-sm text-sage-strong" role="status">
          <div className="flex flex-wrap items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{lookupNotice}</span>
            {registrationStatus ? (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${registrationStatus === "ATIVA" ? "bg-primary text-primary-foreground" : "bg-destructive/10 text-destructive"}`}>
                Receita: {registrationStatus}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      {formError ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-5 py-4 text-sm text-destructive" role="alert">
          <p>{formError}</p>
          {existingClientId ? (
            <Link href={`/dashboard/clientes/${existingClientId}`} className="mt-2 inline-flex font-semibold underline underline-offset-4">
              Abrir cliente já cadastrado
            </Link>
          ) : null}
        </div>
      ) : null}

      <section className="surface-card p-6 sm:p-8">
        <div>
          <h2 className="text-base font-semibold">Identificação</h2>
          <p className="mt-1 text-sm text-muted-foreground">Dados cadastrais utilizados para localizar o importador.</p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label>
            <span className="field-label">CNPJ *</span>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={values.cnpj}
                onChange={(event) => setValue("cnpj", formatCnpj(event.target.value))}
                className="field-input"
                placeholder="00.000.000/0000-00"
                disabled={editing}
                autoCapitalize="characters"
                required
              />
              {!editing ? (
                <button
                  type="button"
                  className="button button-secondary min-h-12 shrink-0 px-4"
                  disabled={lookingUp || !isValidCnpj(values.cnpj)}
                  onClick={lookupCnpj}
                >
                  <Search size={16} /> {lookingUp ? "Consultando..." : "Consultar e preencher"}
                </button>
              ) : null}
            </div>
            {editing ? <span className="mt-1.5 block text-xs text-muted-foreground">O CNPJ identifica o cadastro e não pode ser alterado.</span> : inputError("cnpj")}
          </label>
          <label>
            <span className="field-label">Razão social *</span>
            <input
              value={values.razao_social}
              onChange={(event) => setValue("razao_social", event.target.value)}
              className="field-input"
              maxLength={255}
              required
            />
            {inputError("razao_social")}
          </label>
          <label>
            <span className="field-label">Nome resumido</span>
            <input
              value={values.nome_resumido}
              onChange={(event) => setValue("nome_resumido", event.target.value)}
              className="field-input"
              maxLength={255}
              placeholder="Nome usado nas listagens"
            />
            {inputError("nome_resumido")}
          </label>
          <label>
            <span className="field-label">Regime tributário</span>
            <select
              value={values.regime_tributacao}
              onChange={(event) => setValue("regime_tributacao", event.target.value)}
              className="field-input"
            >
              <option value="">Não informado</option>
              <option value="1">Simples Nacional</option>
              <option value="2">Simples Nacional — excesso de sublimite</option>
              <option value="3">Regime Normal</option>
            </select>
            {inputError("regime_tributacao")}
          </label>
          <label>
            <span className="field-label">Inscrição estadual</span>
            <input
              value={values.inscricao_estadual}
              onChange={(event) => setValue("inscricao_estadual", event.target.value)}
              className="field-input"
              maxLength={64}
            />
            {inputError("inscricao_estadual")}
          </label>
          <label>
            <span className="field-label">Inscrição municipal</span>
            <input
              value={values.inscricao_municipal}
              onChange={(event) => setValue("inscricao_municipal", event.target.value)}
              className="field-input"
              maxLength={64}
            />
            {inputError("inscricao_municipal")}
          </label>
        </div>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <div>
          <h2 className="text-base font-semibold">Atividade econômica</h2>
          <p className="mt-1 text-sm text-muted-foreground">Informações auxiliares para a configuração fiscal posterior.</p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label>
            <span className="field-label">CNAE principal</span>
            <input
              value={values.cnae_principal}
              onChange={(event) => setValue("cnae_principal", event.target.value)}
              className="field-input"
              placeholder="Código e descrição"
            />
            {inputError("cnae_principal")}
          </label>
          <label>
            <span className="field-label">CNAEs secundários</span>
            <textarea
              value={values.cnae_secundario}
              onChange={(event) => setValue("cnae_secundario", event.target.value)}
              className="field-input min-h-28 resize-y py-3"
              placeholder="Um código e descrição por linha"
            />
            {inputError("cnae_secundario")}
          </label>
        </div>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <div>
          <h2 className="text-base font-semibold">Endereços de referência</h2>
          <p className="mt-1 text-sm text-muted-foreground">O endereço fiscal estruturado será configurado na preparação da NF-e.</p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label>
            <span className="field-label">Escritório</span>
            <textarea
              value={values.endereco_completo_escritorio}
              onChange={(event) => setValue("endereco_completo_escritorio", event.target.value)}
              className="field-input min-h-28 resize-y py-3"
              placeholder="Logradouro, número, complemento, bairro, cidade e CEP"
            />
            {inputError("endereco_completo_escritorio")}
          </label>
          <label>
            <span className="field-label">Armazém</span>
            <textarea
              value={values.endereco_completo_armazem}
              onChange={(event) => setValue("endereco_completo_armazem", event.target.value)}
              className="field-input min-h-28 resize-y py-3"
              placeholder="Logradouro, número, complemento, bairro, cidade e CEP"
            />
            {inputError("endereco_completo_armazem")}
          </label>
        </div>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={values.ativo}
            onChange={(event) => setValue("ativo", event.target.checked)}
            className="mt-1 size-4 rounded border-input accent-primary"
          />
          <span>
            <span className="block text-sm font-semibold">Cliente ativo</span>
            <span className="mt-1 block text-sm text-muted-foreground">Clientes inativos permanecem no histórico, mas não devem ser usados em novos processos.</span>
          </span>
        </label>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/dashboard/clientes" className="button button-secondary min-h-11">Cancelar</Link>
        <button type="submit" disabled={saving} className="button button-primary min-h-11 sm:min-w-40">
          <Save size={17} /> {saving ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar cliente"}
        </button>
      </div>
    </form>
  );
}

export function NewClientForm() {
  return <ClientForm />;
}

export function ClientEditor({
  clientId,
  created,
}: {
  clientId: string;
  created?: boolean;
}) {
  const url = routes.bff.client.detail(clientId);
  const { data, error, isLoading, mutate } = useSWR<ClientRecord>(url, bffFetcher);

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4" aria-label="Carregando cliente">
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="surface-card mt-8 p-10 text-center">
        <p className="text-sm text-destructive">{bffErrorMessage(error)}</p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/dashboard/clientes" className="button button-secondary"><ArrowLeft size={16} /> Voltar</Link>
          <button type="button" className="button button-primary" onClick={() => mutate()}><RefreshCw size={16} /> Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <ClientForm
      initialClient={data}
      initialNotice={created ? "Cliente cadastrado com sucesso." : undefined}
      onUpdated={(updated) => mutate(updated, { revalidate: false })}
    />
  );
}
