"use client";

import { ArrowRight, Building2, PlugZap, UsersRound } from "lucide-react";
import Link from "next/link";
import { useDashboardSession } from "@/components/dashboard/dashboard-session-context";

const cards = [
  { title: "Organização", description: "Atualize o nome, CNPJ e dados de contato da organização.", href: "/dashboard/configuracoes/organizacao", icon: Building2, admin: true },
  { title: "Usuários e acessos", description: "Cadastre usuários e atribua tags de acesso por módulo.", href: "/dashboard/configuracoes/usuarios", icon: UsersRound, admin: true },
  { title: "Portal Único", description: "Configure credenciais e acompanhe a conexão com o Siscomex.", href: "/dashboard/configuracoes/portal-unico", icon: PlugZap, admin: false },
];
export default function SettingsPage() {
  const { user } = useDashboardSession();
  const admin = user.role === "admin";
  if (!admin && !user.access_tags?.includes("configuracoes")) return <p className="surface-card p-6">Seu usuário não tem acesso às configurações.</p>;
  return <>
    <p className="eyebrow">Painel</p>
    <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.04em]">Configurações</h1>
    <p className="mt-2 text-muted-foreground">Escolha o que deseja administrar na sua organização.</p>
    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.filter((card) => admin || !card.admin).map(({ title, description, href, icon: Icon }) => <Link key={href} href={href} className="surface-card group flex min-h-48 flex-col p-6 transition hover:border-primary/50 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-primary">
        <Icon size={23} className="text-sage-strong" aria-hidden="true" />
        <h2 className="mt-6 text-lg font-semibold">{title}</h2>
        <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
        <span className="mt-5 flex items-center gap-2 text-sm font-semibold text-sage-strong">Abrir <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
      </Link>)}
    </div>
  </>;
}
