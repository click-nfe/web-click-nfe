import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Building2,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  FileClock,
  LayoutDashboard,
  Menu,
  Settings2,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { getCurrentUser, type UserIdentity } from "@/lib/api/auth";
import { hasApiStatus, logApiError } from "@/lib/api/errors";
import { getCurrentOrganization, type Organization } from "@/lib/api/organization";

export const metadata: Metadata = {
  title: "Visão geral",
  description: "Acompanhe sua operação no Click NFe.",
};

type DashboardSession =
  | { state: "ready"; user: UserIdentity; organization: Organization }
  | { state: "unavailable" };

async function getDashboardSession(): Promise<DashboardSession> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    redirect("/api/auth/refresh?next=/dashboard");
  }

  try {
    const [user, organization] = await Promise.all([
      getCurrentUser(accessToken),
      getCurrentOrganization(accessToken),
    ]);
    return { state: "ready", user, organization };
  } catch (error) {
    logApiError("dashboard.session", error);

    if (hasApiStatus(error, 401, 403)) {
      redirect("/api/auth/refresh?next=/dashboard");
    }

    return { state: "unavailable" };
  }
}

const navItems = [
  { label: "Visão geral", icon: LayoutDashboard, active: true },
  { label: "Processos", icon: FileClock },
  { label: "Clientes", icon: UsersRound },
  { label: "Configurações", icon: Settings2 },
];

export default async function DashboardPage() {
  const session = await getDashboardSession();

  if (session.state === "unavailable") {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="surface-card max-w-md p-8 text-center">
          <CircleHelp className="mx-auto text-sage-strong" size={30} />
          <h1 className="font-display mt-5 text-3xl font-semibold tracking-tight">Não foi possível carregar o painel.</h1>
          <p className="mt-3 leading-7 text-muted-foreground">Confirme se a API e o PostgreSQL estão em execução e tente novamente.</p>
          <Link href="/dashboard" className="button button-primary mt-7">Tentar novamente</Link>
        </div>
      </main>
    );
  }

  const { user, organization } = session;
  const firstName = user.nome.trim().split(/\s+/)[0];

  return (
    <div className="min-h-screen bg-muted/35 lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="hidden border-r border-border bg-card lg:flex lg:min-h-screen lg:flex-col lg:p-5">
        <Brand />

        <div className="mt-8 rounded-xl bg-sage-soft p-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Building2 size={17} /></span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{organization.nome}</p>
              <p className="truncate text-xs text-muted-foreground">{organization.slug}</p>
            </div>
          </div>
        </div>

        <nav className="mt-7 space-y-1" aria-label="Dashboard">
          {navItems.map(({ label, icon: Icon, active }) => (
            <span key={label} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`} aria-current={active ? "page" : undefined}>
              <Icon size={17} /> {label}
            </span>
          ))}
        </nav>

        <div className="mt-auto border-t border-border pt-4">
          <div className="mb-3 px-3">
            <p className="truncate text-sm font-medium">{user.nome}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="min-w-0">
        <header className="flex h-20 items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <button type="button" className="icon-button" aria-label="Abrir menu"><Menu size={18} /></button>
            <Brand compact />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm text-muted-foreground">Organização</p>
            <p className="text-sm font-semibold">{organization.nome}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{firstName.slice(0, 1).toUpperCase()}</div>
          </div>
        </header>

        <div className="p-5 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Visão geral</p>
              <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.04em]">Olá, {firstName}.</h1>
              <p className="mt-2 text-muted-foreground">Este é o ponto de partida da sua operação fiscal.</p>
            </div>
            <button type="button" disabled className="button button-primary min-h-11">Novo processo <ChevronRight size={17} /></button>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              [FileClock, "Processos em andamento", "—", "Os dados aparecerão ao conectar os processos."],
              [FileCheck2, "Prontos para emissão", "—", "Minutas validadas serão exibidas aqui."],
              [ShieldCheck, "Pendências de conferência", "—", "Alertas fiscais ficarão centralizados neste card."],
            ].map(([Icon, title, value, detail]) => {
              const IconComponent = Icon as typeof FileClock;
              return (
                <article key={title as string} className="surface-card p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid size-10 place-items-center rounded-xl bg-sage-soft text-sage-strong"><IconComponent size={19} /></span>
                    <span className="text-xs font-medium text-muted-foreground">Em breve</span>
                  </div>
                  <p className="mt-7 text-sm text-muted-foreground">{title as string}</p>
                  <p className="font-display mt-2 text-4xl font-semibold">{value as string}</p>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">{detail as string}</p>
                </article>
              );
            })}
          </div>

          <section className="surface-card mt-6 p-6 sm:p-8">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold">Prepare o primeiro processo</p>
                <p className="mt-2 leading-7 text-muted-foreground">A base do dashboard já reconhece seu usuário e sua organização. A entrada de DUIMP será conectada no próximo checkpoint funcional.</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="size-2 rounded-full bg-sage" /> Ambiente autenticado</div>
            </div>
          </section>

          <div className="mt-6 lg:hidden">
            <LogoutButton />
          </div>
        </div>
      </main>
    </div>
  );
}
