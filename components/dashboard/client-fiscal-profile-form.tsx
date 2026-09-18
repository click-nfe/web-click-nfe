"use client";

import axios from "axios";
import { CheckCircle2, RefreshCw, Save, Search } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

import type {
  ClientFiscalProfile,
  UpsertClientFiscalProfilePayload,
} from "@/lib/api/client-fiscal-profile";
import type { ClientRecord } from "@/lib/api/client-record";
import { bffErrorMessage } from "@/lib/bff/client";
import {
  getClientFiscalProfile,
  upsertClientFiscalProfile,
} from "@/lib/bff/client-fiscal-profile";
import { lookupClientCompany } from "@/lib/bff/clients";
import { cnpjCharacters, formatCnpj } from "@/lib/client-display";

type FiscalProfileValues = {
  legal_name: string;
  trade_name: string;
  cnpj: string;
  state_registration: string;
  tax_regime: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city_code: string;
  city_name: string;
  state: string;
  zip_code: string;
  country_code: string;
  country_name: string;
  phone: string;
  email: string;
};

type ApiErrorBody = {
  message?: string;
  messages?: Record<string, string[]>;
};

const requiredFields: Array<keyof FiscalProfileValues> = [
  "legal_name",
  "cnpj",
  "tax_regime",
  "street",
  "number",
  "district",
  "city_code",
  "city_name",
  "state",
  "zip_code",
  "country_code",
  "country_name",
];

function nullable(value: string) {
  return value.trim() || null;
}

function digits(value: string, limit: number) {
  return value.replace(/\D/g, "").slice(0, limit);
}

function valuesFrom(
  client: ClientRecord,
  profile: ClientFiscalProfile | null,
): FiscalProfileValues {
  return {
    legal_name: profile?.legal_name ?? client.razao_social,
    trade_name: profile?.trade_name ?? client.nome_resumido ?? "",
    cnpj: profile?.cnpj ?? client.cnpj,
    state_registration:
      profile?.state_registration ?? client.inscricao_estadual ?? "",
    tax_regime: profile?.tax_regime ?? client.regime_tributacao ?? "",
    street: profile?.street ?? "",
    number: profile?.number ?? "",
    complement: profile?.complement ?? "",
    district: profile?.district ?? "",
    city_code: profile?.city_code ?? "",
    city_name: profile?.city_name ?? "",
    state: profile?.state ?? "",
    zip_code: profile?.zip_code ?? "",
    country_code: profile?.country_code ?? "1058",
    country_name: profile?.country_name ?? "Brasil",
    phone: profile?.phone ?? "",
    email: profile?.email ?? "",
  };
}

function FiscalProfileForm({
  client,
  initialProfile,
  onSaved,
}: {
  client: ClientRecord;
  initialProfile: ClientFiscalProfile | null;
  onSaved: (profile: ClientFiscalProfile) => void;
}) {
  const [values, setValues] = useState(() => valuesFrom(client, initialProfile));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  function setValue<K extends keyof FiscalProfileValues>(
    field: K,
    value: FiscalProfileValues[K],
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

  async function fillFromPublicData() {
    setLookingUp(true);
    setFormError(null);
    setNotice(null);
    try {
      const company = await lookupClientCompany(client.cnpj);
      setValues((current) => ({
        ...current,
        legal_name: company.legal_name || current.legal_name,
        trade_name: company.trade_name || current.trade_name,
        tax_regime: company.tax_regime_suggestion || current.tax_regime,
        street: company.address.street || current.street,
        number: company.address.number || current.number,
        complement: company.address.complement || current.complement,
        district: company.address.district || current.district,
        city_code: company.address.city_code || current.city_code,
        city_name: company.address.city || current.city_name,
        state: company.address.state || current.state,
        zip_code: company.address.zip_code || current.zip_code,
      }));
      setNotice(
        "Dados públicos aplicados ao perfil. Confira o endereço, a inscrição estadual e o regime antes de salvar.",
      );
    } catch (error) {
      setFormError(bffErrorMessage(error));
    } finally {
      setLookingUp(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setNotice(null);

    const errors: Record<string, string> = {};
    for (const field of requiredFields) {
      if (!values[field].trim()) errors[field] = "Campo obrigatório.";
    }
    if (values.city_code && digits(values.city_code, 7).length !== 7) {
      errors.city_code = "Informe os 7 dígitos do código IBGE.";
    }
    if (values.zip_code && digits(values.zip_code, 8).length !== 8) {
      errors.zip_code = "Informe os 8 dígitos do CEP.";
    }
    if (values.state && values.state.trim().length !== 2) {
      errors.state = "Informe a sigla da UF com 2 letras.";
    }
    if (!["1", "2", "3"].includes(values.tax_regime)) {
      errors.tax_regime = "Selecione o regime tributário.";
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    const payload: UpsertClientFiscalProfilePayload = {
      legal_name: values.legal_name.trim(),
      trade_name: nullable(values.trade_name),
      cnpj: cnpjCharacters(values.cnpj),
      state_registration: nullable(values.state_registration),
      tax_regime: values.tax_regime as "1" | "2" | "3",
      street: values.street.trim(),
      number: values.number.trim(),
      complement: nullable(values.complement),
      district: values.district.trim(),
      city_code: digits(values.city_code, 7),
      city_name: values.city_name.trim(),
      state: values.state.trim().toUpperCase(),
      zip_code: digits(values.zip_code, 8),
      country_code: values.country_code.trim(),
      country_name: values.country_name.trim(),
      phone: nullable(values.phone),
      email: nullable(values.email),
      is_default: true,
    };

    setSaving(true);
    try {
      const saved = await upsertClientFiscalProfile(client.id, payload);
      onSaved(saved);
      setNotice("Perfil fiscal salvo com sucesso.");
      setFieldErrors({});
    } catch (error) {
      if (axios.isAxiosError<ApiErrorBody>(error)) {
        const body = error.response?.data;
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
        setFormError(body?.message ?? bffErrorMessage(error));
      } else {
        setFormError(bffErrorMessage(error));
      }
    } finally {
      setSaving(false);
    }
  }

  const inputError = (field: keyof FiscalProfileValues) =>
    fieldErrors[field] ? (
      <span className="mt-1.5 block text-xs text-destructive">
        {fieldErrors[field]}
      </span>
    ) : null;

  return (
    <form onSubmit={submit} className="mt-8 space-y-6" noValidate>
      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-start sm:justify-between sm:p-8">
          <div>
            <p className="eyebrow">Parâmetros do emitente</p>
            <h2 className="mt-3 text-2xl font-semibold">Perfil fiscal</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Estes dados identificam o emitente nos rascunhos e no XML da NF-e. O perfil também é necessário antes de cadastrar o eCNPJ.
            </p>
          </div>
          <button
            type="button"
            className="button button-secondary w-fit shrink-0"
            disabled={lookingUp}
            onClick={fillFromPublicData}
          >
            <Search size={16} />
            {lookingUp ? "Consultando..." : "Usar dados do CNPJ"}
          </button>
        </div>

        <div className="space-y-8 p-6 sm:p-8">
          {notice ? (
            <div className="flex items-start gap-3 rounded-xl bg-sage-soft px-4 py-3 text-sm text-sage-strong" role="status">
              <CheckCircle2 className="mt-0.5 shrink-0" size={17} /> {notice}
            </div>
          ) : null}
          {formError ? (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}

          <fieldset>
            <legend className="text-base font-semibold">Identificação fiscal</legend>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label>
                <span className="field-label">Razão social *</span>
                <input value={values.legal_name} onChange={(event) => setValue("legal_name", event.target.value)} className="field-input" />
                {inputError("legal_name")}
              </label>
              <label>
                <span className="field-label">Nome fantasia</span>
                <input value={values.trade_name} onChange={(event) => setValue("trade_name", event.target.value)} className="field-input" />
              </label>
              <label>
                <span className="field-label">CNPJ</span>
                <input value={formatCnpj(values.cnpj)} className="field-input bg-muted" readOnly />
                <span className="mt-1.5 block text-xs text-muted-foreground">O CNPJ deve ser o mesmo do cadastro do cliente.</span>
              </label>
              <label>
                <span className="field-label">Inscrição estadual</span>
                <input value={values.state_registration} onChange={(event) => setValue("state_registration", event.target.value)} className="field-input" />
              </label>
              <label>
                <span className="field-label">Regime tributário *</span>
                <select value={values.tax_regime} onChange={(event) => setValue("tax_regime", event.target.value)} className="field-input">
                  <option value="">Selecione</option>
                  <option value="1">Simples Nacional</option>
                  <option value="2">Simples Nacional — excesso de sublimite</option>
                  <option value="3">Regime Normal</option>
                </select>
                {inputError("tax_regime")}
              </label>
            </div>
          </fieldset>

          <fieldset className="border-t border-border pt-8">
            <legend className="text-base font-semibold">Endereço fiscal</legend>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              <label className="lg:col-span-2">
                <span className="field-label">Logradouro *</span>
                <input value={values.street} onChange={(event) => setValue("street", event.target.value)} className="field-input" />
                {inputError("street")}
              </label>
              <label>
                <span className="field-label">Número *</span>
                <input value={values.number} onChange={(event) => setValue("number", event.target.value)} className="field-input" />
                {inputError("number")}
              </label>
              <label>
                <span className="field-label">Complemento</span>
                <input value={values.complement} onChange={(event) => setValue("complement", event.target.value)} className="field-input" />
              </label>
              <label>
                <span className="field-label">Bairro *</span>
                <input value={values.district} onChange={(event) => setValue("district", event.target.value)} className="field-input" />
                {inputError("district")}
              </label>
              <label>
                <span className="field-label">CEP *</span>
                <input value={values.zip_code} onChange={(event) => setValue("zip_code", digits(event.target.value, 8))} inputMode="numeric" className="field-input" placeholder="00000000" />
                {inputError("zip_code")}
              </label>
              <label>
                <span className="field-label">Município *</span>
                <input value={values.city_name} onChange={(event) => setValue("city_name", event.target.value)} className="field-input" />
                {inputError("city_name")}
              </label>
              <label>
                <span className="field-label">Código IBGE *</span>
                <input value={values.city_code} onChange={(event) => setValue("city_code", digits(event.target.value, 7))} inputMode="numeric" className="field-input" placeholder="0000000" />
                {inputError("city_code")}
              </label>
              <label>
                <span className="field-label">UF *</span>
                <input value={values.state} onChange={(event) => setValue("state", event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))} className="field-input" placeholder="PR" />
                {inputError("state")}
              </label>
              <label>
                <span className="field-label">Código do país *</span>
                <input value={values.country_code} onChange={(event) => setValue("country_code", digits(event.target.value, 4))} inputMode="numeric" className="field-input" />
                {inputError("country_code")}
              </label>
              <label>
                <span className="field-label">País *</span>
                <input value={values.country_name} onChange={(event) => setValue("country_name", event.target.value)} className="field-input" />
                {inputError("country_name")}
              </label>
            </div>
          </fieldset>

          <fieldset className="border-t border-border pt-8">
            <legend className="text-base font-semibold">Contato fiscal</legend>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label>
                <span className="field-label">Telefone</span>
                <input value={values.phone} onChange={(event) => setValue("phone", event.target.value)} className="field-input" />
              </label>
              <label>
                <span className="field-label">E-mail</span>
                <input type="email" value={values.email} onChange={(event) => setValue("email", event.target.value)} className="field-input" />
              </label>
            </div>
          </fieldset>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" className="button button-primary min-h-11 min-w-44" disabled={saving}>
          <Save size={17} /> {saving ? "Salvando..." : initialProfile ? "Salvar perfil fiscal" : "Criar perfil fiscal"}
        </button>
      </div>
    </form>
  );
}

export function ClientFiscalProfileSection({ client }: { client: ClientRecord }) {
  const { data, error, isLoading, mutate } = useSWR(
    ["client-fiscal-profile", client.id],
    () => getClientFiscalProfile(client.id),
  );

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4" aria-label="Carregando perfil fiscal">
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        <div className="h-56 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface-card mt-8 p-10 text-center">
        <p className="text-sm text-destructive">{bffErrorMessage(error)}</p>
        <button type="button" className="button button-secondary mt-4" onClick={() => mutate()}>
          <RefreshCw size={16} /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <FiscalProfileForm
      key={data?.updated_at ?? "new"}
      client={client}
      initialProfile={data ?? null}
      onSaved={(profile) => mutate(profile, { revalidate: false })}
    />
  );
}
