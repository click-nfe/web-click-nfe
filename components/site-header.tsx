import Link from "next/link";

import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl">
      <div className="page-shell flex h-20 items-center justify-between gap-6">
        <Brand />

        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="Principal">
          <Link href="/#como-funciona" className="nav-link">Como funciona</Link>
          <Link href="/#beneficios" className="nav-link">Benefícios</Link>
          <Link href="/#seguranca" className="nav-link">Segurança</Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="button button-ghost hidden sm:inline-flex">Entrar</Link>
          <Link href="/demonstracao" className="button button-primary">Solicitar demonstração</Link>
        </div>
      </div>
    </header>
  );
}
