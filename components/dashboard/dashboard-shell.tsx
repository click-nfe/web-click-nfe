"use client";

import {
  Building2,
  FileClock,
  LayoutDashboard,
  Menu,
  Settings2,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Brand } from "@/components/brand";
import { DashboardSessionProvider } from "@/components/dashboard/dashboard-session-context";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { UserIdentity } from "@/lib/api/auth";
import type { Organization } from "@/lib/api/organization";

type NavItem = {
  label: string;
  icon: LucideIcon;
  href?: string;
  tag?: string;
};

const navItems: NavItem[] = [
  { label: "Visão geral", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Processos", icon: FileClock, href: "/dashboard/processos", tag: "processos" },
  { label: "Clientes", icon: UsersRound, href: "/dashboard/clientes", tag: "clientes" },
  { label: "Configurações", icon: Settings2, href: "/dashboard/configuracoes", tag: "configuracoes" },
];

function DashboardNav({ user, onNavigate }: { user: UserIdentity; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1" aria-label="Dashboard">
      {navItems.filter((item) => user.role === "admin" || !item.tag || user.access_tags?.includes(item.tag) || (item.tag === "processos" && user.access_tags?.includes("emissao"))).map(({ label, icon: Icon, href }) => {
        const active = href
          ? href === "/dashboard"
            ? pathname === href
            : pathname.startsWith(href)
          : false;
        const className = `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`;

        if (!href) {
          return (
            <span key={label} className={`${className} cursor-not-allowed opacity-65`}>
              <Icon size={17} />
              <span>{label}</span>
              <span className="ml-auto text-[0.65rem] font-semibold uppercase tracking-wide">Em breve</span>
            </span>
          );
        }

        return (
          <Link
            key={label}
            href={href}
            className={className}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
          >
            <Icon size={17} /> {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  user,
  organization,
  children,
}: {
  user: UserIdentity;
  organization: Organization;
  children: ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const firstName = user.nome.trim().split(/\s+/)[0];

  return (
    <DashboardSessionProvider value={{ user, organization }}>
      <div className="min-h-screen bg-muted/35 lg:grid lg:grid-cols-[17rem_1fr]">
        <aside className="hidden border-r border-border bg-card lg:sticky lg:top-0 lg:flex lg:h-screen lg:self-start lg:flex-col lg:overflow-y-auto lg:p-5">
          <Brand />

        <div className="mt-8 rounded-xl bg-sage-soft p-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Building2 size={17} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{organization.nome}</p>
              <p className="truncate text-xs text-muted-foreground">{organization.slug}</p>
            </div>
          </div>
        </div>

        <div className="mt-7">
          <DashboardNav user={user} />
        </div>

        <div className="mt-auto border-t border-border pt-4">
          <div className="mb-3 px-3">
            <p className="truncate text-sm font-medium">{user.nome}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <LogoutButton />
        </div>
        </aside>

        <main className="min-w-0">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              className="icon-button"
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <Brand compact />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm text-muted-foreground">Organização</p>
            <p className="text-sm font-semibold">{organization.nome}</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div
              className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
              title={firstName}
            >
              {firstName.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        {mobileMenuOpen ? (
          <div className="fixed inset-x-0 top-20 z-20 border-b border-border bg-card p-5 shadow-xl lg:hidden">
            <DashboardNav user={user} onNavigate={() => setMobileMenuOpen(false)} />
            <div className="mt-5 border-t border-border pt-4">
              <p className="px-3 text-sm font-medium">{user.nome}</p>
              <p className="mb-2 px-3 text-xs text-muted-foreground">{organization.nome}</p>
              <LogoutButton />
            </div>
          </div>
        ) : null}

        <div className="p-5 sm:p-8 lg:p-10">{children}</div>
        </main>
      </div>
    </DashboardSessionProvider>
  );
}
