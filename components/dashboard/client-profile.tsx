"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileClock,
  FileKey2,
  FilePenLine,
  Hash,
  History,
  PlugZap,
  RefreshCw,
  Scale,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

import { ClientForm } from "@/components/dashboard/client-form";
import { ClientCertificates } from "@/components/dashboard/client-certificates";
import { ClientFiscalProfileSection } from "@/components/dashboard/client-fiscal-profile-form";
import { ClientTaxRules } from "@/components/dashboard/client-tax-rules";
import type { ClientRecord } from "@/lib/api/client-record";
import type { ImportProcessListResponse } from "@/lib/api/import-process";
import { routes } from "@/lib/api/routes";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import { importProcessListUrl } from "@/lib/bff/import-process";
import {
  formatClientDate,
  formatCnpj,
  taxRegimeLabels,
} from "@/lib/client-display";
import type { ClientProfileSection } from "@/lib/client-profile";
import {
  formatProcessDate,
  importProcessStatusClass,
  importProcessStatusLabels,
  nextActionLabels,
} from "@/lib/import-process-display";

const navigation: Array<{
  value: ClientProfileSection;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "overview", label: "Visão geral", icon: Building2 },
  { value: "registration", label: "Dados cadastrais", icon: FilePenLine },
  { value: "certificates", label: "Certificados eCNPJ", icon: FileKey2 },
  { value: "fiscal-profile", label: "Perfil fiscal", icon: SlidersHorizontal },
  { value: "tax-rules", label: "Regras tributárias", icon: Scale },
  { value: "processes", label: "Processos", icon: History },
];

function profileHref(clientId: string, section: ClientProfileSection) {
  return section === "overview"
    ? `/dashboard/clientes/${clientId}`
    : `/dashboard/clientes/${clientId}?section=${section}`;
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium">{value}</dd>
    </div>
  );
}

function ConfigurationCard({
  clientId,
  section,
  icon: Icon,
  title,
  description,
  status,
  available = false,
}: {
  clientId: string;
  section: ClientProfileSection;
  icon: LucideIcon;
  title: string;
  description: string;
  status: string;
  available?: boolean;
}) {
  return (
    <Link
      href={profileHref(clientId, section)}
      className="surface-card group flex min-h-52 flex-col p-6 transition hover:-translate-y-0.5 hover:border-primary/35"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-11 place-items-center rounded-xl bg-sage-soft text-sage-strong">
          <Icon size={21} />
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            available
              ? "bg-sage-soft text-sage-strong"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {status}
        </span>
      </div>
      <h3 className="mt-5 font-semibold">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sage-strong">
        Abrir seção
        <ArrowRight className="transition group-hover:translate-x-1" size={16} />
      </span>
    </Link>
  );
}

function ClientOverview({ client }: { client: ClientRecord }) {
  return (
    <div className="mt-8 space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Resumo cadastral</p>
            <h2 className="mt-3 text-xl font-semibold">Informações do importador</h2>
          </div>
          <Link
            href={profileHref(client.id, "registration")}
            className="button button-secondary w-fit"
          >
            <FilePenLine size={16} /> Editar dados
          </Link>
        </div>
        <dl className="mt-7 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          <DataItem label="Razão social" value={client.razao_social} />
          <DataItem label="CNPJ" value={formatCnpj(client.cnpj)} />
          <DataItem
            label="Regime tributário"
            value={
              client.regime_tributacao
                ? taxRegimeLabels[client.regime_tributacao] ?? client.regime_tributacao
                : "Não informado"
            }
          />
          <DataItem
            label="Inscrição estadual"
            value={client.inscricao_estadual || "Não informada"}
          />
          <DataItem
            label="CNAE principal"
            value={client.cnae_principal || "Não informado"}
          />
          <DataItem
            label="Última atualização"
            value={formatClientDate(client.updated_at)}
          />
        </dl>
      </section>

      <section>
        <div>
          <p className="eyebrow">Configuração</p>
          <h2 className="mt-3 text-xl font-semibold">Preparação para emissão</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Centralize neste perfil tudo o que será necessário para gerar, assinar e acompanhar as NF-e do cliente.
          </p>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ConfigurationCard
            clientId={client.id}
            section="certificates"
            icon={FileKey2}
            title="Certificados eCNPJ"
            description="Upload, validação, vigência e ativação do certificado A1 utilizado na assinatura."
            status="Disponível"
            available
          />
          <ConfigurationCard
            clientId={client.id}
            section="fiscal-profile"
            icon={SlidersHorizontal}
            title="Perfil fiscal"
            description="Dados do emitente, ambiente, endereço fiscal e parâmetros padrão de emissão."
            status="Disponível"
            available
          />
          <ConfigurationCard
            clientId={client.id}
            section="tax-rules"
            icon={Scale}
            title="Regras tributárias"
            description="Regras por NCM, UF, modalidade, finalidade e enquadramento tributário."
            status="Disponível"
            available
          />
          <ConfigurationCard
            clientId={client.id}
            section="processes"
            icon={FileClock}
            title="Histórico de processos"
            description="Processos e DUIMPs vinculados ao cliente, com status e próxima etapa."
            status="Disponível"
            available
          />
          <div className="surface-card flex min-h-52 flex-col p-6 md:col-span-2 xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <span className="grid size-11 place-items-center rounded-xl bg-sage-soft text-sage-strong">
                <Settings2 size={21} />
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                Planejado
              </span>
            </div>
            <h3 className="mt-5 font-semibold">Demais configurações da NF-e</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              A sequência numérica do modelo 55 e a conexão com o Portal Único entrarão neste mesmo perfil em checkpoints próprios.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
                <Hash size={14} /> Numeração NF-e
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
                <PlugZap size={14} /> Portal Único
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="surface-card p-6 sm:p-8">
        <h2 className="text-base font-semibold">Contatos do cliente</h2>
        {client.contatos.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {client.contatos.map((contact) => (
              <article key={contact.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{contact.nome}</p>
                  {contact.principal ? (
                    <span className="rounded-full bg-sage-soft px-2 py-0.5 text-xs font-semibold text-sage-strong">
                      Principal
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[contact.cargo_departamento, contact.email, contact.telefone]
                    .filter(Boolean)
                    .join(" · ") || "Sem meios de contato informados"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Nenhum contato foi vinculado a este cliente.
          </p>
        )}
      </section>
    </div>
  );
}

function ClientProcessHistory({ clientId }: { clientId: string }) {
  const url = importProcessListUrl({ importerId: clientId, limit: 10, offset: 0 });
  const { data, error, isLoading, mutate } = useSWR<ImportProcessListResponse>(
    url,
    bffFetcher,
  );

  return (
    <section className="surface-card mt-8 overflow-hidden">
      <div className="border-b border-border p-6 sm:p-8">
        <p className="eyebrow">Histórico operacional</p>
        <h2 className="mt-3 text-2xl font-semibold">Processos do cliente</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Consulte os processos de importação e DUIMPs vinculados a este cadastro.
        </p>
      </div>
      {error ? (
        <div className="p-10 text-center">
          <p className="text-sm text-destructive">{bffErrorMessage(error)}</p>
          <button type="button" className="button button-secondary mt-4" onClick={() => mutate()}>
            <RefreshCw size={16} /> Tentar novamente
          </button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3 p-6" aria-label="Carregando processos do cliente">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : data?.items.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/55 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Processo</th>
                <th className="px-6 py-4 font-semibold">DUIMP</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Próxima etapa</th>
                <th className="px-6 py-4 font-semibold">Atualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((process) => (
                <tr key={process.id}>
                  <td className="px-6 py-5 font-semibold">{process.reference_code}</td>
                  <td className="px-6 py-5 font-mono text-xs">{process.duimp_number ?? "Não informada"}</td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${importProcessStatusClass(process.status)}`}>
                      {importProcessStatusLabels[process.status]}
                    </span>
                  </td>
                  <td className="max-w-64 px-6 py-5 text-muted-foreground">
                    {nextActionLabels[process.next_action] ?? process.next_action}
                  </td>
                  <td className="whitespace-nowrap px-6 py-5 text-xs text-muted-foreground">
                    <time dateTime={process.updated_at}>{formatProcessDate(process.updated_at)}</time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center">
          <FileClock className="mx-auto text-sage-strong" size={30} />
          <p className="mt-4 font-medium">Nenhum processo vinculado.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Os próximos processos criados para este cliente aparecerão aqui.
          </p>
        </div>
      )}
    </section>
  );
}

export function ClientProfile({
  clientId,
  section,
  created = false,
}: {
  clientId: string;
  section: ClientProfileSection;
  created?: boolean;
}) {
  const url = routes.bff.client.detail(clientId);
  const { data: client, error, isLoading, mutate } = useSWR<ClientRecord>(
    url,
    bffFetcher,
  );

  if (isLoading) {
    return (
      <div className="mt-8 space-y-4" aria-label="Carregando cliente">
        <div className="h-44 animate-pulse rounded-2xl bg-muted" />
        <div className="h-14 animate-pulse rounded-2xl bg-muted" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="surface-card mt-8 p-10 text-center">
        <p className="text-sm text-destructive">{bffErrorMessage(error)}</p>
        <button type="button" className="button button-primary mt-5" onClick={() => mutate()}>
          <RefreshCw size={16} /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      {created ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/20 bg-sage-soft px-5 py-4 text-sm text-sage-strong" role="status">
          <CheckCircle2 size={18} />
          Cliente cadastrado com sucesso. Agora você pode completar sua configuração fiscal e operacional.
        </div>
      ) : null}

      <header className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="eyebrow">Perfil do cliente</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${client.ativo ? "bg-sage-soft text-sage-strong" : "bg-muted text-muted-foreground"}`}>
              {client.ativo ? "Ativo" : "Inativo"}
            </span>
          </div>
          <h1 className="font-display mt-3 truncate text-4xl font-semibold tracking-[-0.04em]">
            {client.nome_resumido || client.razao_social}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {client.razao_social} · <span className="font-mono text-sm">{formatCnpj(client.cnpj)}</span>
          </p>
        </div>
        {section !== "registration" ? (
          <Link href={profileHref(client.id, "registration")} className="button button-secondary w-fit">
            <FilePenLine size={16} /> Editar cadastro
          </Link>
        ) : null}
      </header>

      <nav className="mt-8 overflow-x-auto rounded-2xl border border-border bg-card p-2" aria-label="Seções do cliente">
        <div className="flex min-w-max gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = item.value === section;
            return (
              <Link
                key={item.value}
                href={profileHref(client.id, item.value)}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {section === "overview" ? <ClientOverview client={client} /> : null}
      {section === "registration" ? (
        <ClientForm
          initialClient={client}
          onUpdated={(updated) => mutate(updated, { revalidate: false })}
        />
      ) : null}
      {section === "certificates" ? <ClientCertificates clientId={client.id} /> : null}
      {section === "tax-rules" ? <ClientTaxRules client={client} /> : null}
      {section === "fiscal-profile" ? (
        <ClientFiscalProfileSection client={client} />
      ) : null}
      {section === "processes" ? <ClientProcessHistory clientId={client.id} /> : null}
    </>
  );
}
