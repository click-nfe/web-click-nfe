import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { LoginStory } from "@/components/login-story";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua organização no Click NFe.",
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function safeNextPath(value: string | string[] | undefined) {
  const path = Array.isArray(value) ? value[0] : value;
  return path?.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const sessionMessage = params.registered
    ? "Cadastro concluído. Entre com o e-mail e a senha que você criou."
    : params.expired
    ? "Sua sessão expirou. Entre novamente para continuar."
    : params.unavailable
      ? "A API está temporariamente indisponível. Tente novamente."
      : null;

  return (
    <main className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between">
          <Brand />
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-16">
          <p className="eyebrow"><LockKeyhole size={14} /> Acesso seguro</p>
          <h1 className="font-display mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Bem-vindo de volta.</h1>
          <p className="mt-4 leading-7 text-muted-foreground">Entre com seu e-mail e senha para acessar sua organização.</p>

          {sessionMessage && (
            <p className="mt-6 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">{sessionMessage}</p>
          )}

          <LoginForm nextPath={nextPath} />

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Ainda não possui acesso?{" "}
            <Link href="/cadastro" className="font-semibold text-sage-strong hover:underline">Cadastre-se agora</Link>
          </p>
        </div>

        <Link href="/" className="text-sm text-muted-foreground transition hover:text-foreground">← Voltar para o site</Link>
      </section>

      <aside className="relative hidden overflow-hidden bg-foreground p-12 text-background lg:flex lg:flex-col lg:justify-between dark:bg-card dark:text-card-foreground">
        <div className="absolute -right-20 -top-20 size-96 rounded-full bg-sage/25 blur-3xl" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-sage">Click NFe</p>
        <LoginStory />
      </aside>
    </main>
  );
}
