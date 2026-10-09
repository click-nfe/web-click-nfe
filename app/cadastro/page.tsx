import type { Metadata } from "next";
import { ArrowLeft, Building2, ShieldCheck, UserRoundCheck } from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { RegistrationForm } from "@/components/registration-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Cadastre-se agora",
  description: "Crie a organização e o primeiro acesso de administrador no Click NFe.",
};

export default function CadastroPage() {
  return (
    <main className="min-h-screen">
      <header className="page-shell flex h-20 items-center justify-between"><Brand /><ThemeToggle /></header>
      <div className="page-shell grid gap-14 py-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:py-20">
        <section className="max-w-xl">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft size={16} /> Voltar</Link>
          <p className="eyebrow">Primeiro acesso</p>
          <h1 className="font-display mt-5 text-5xl leading-[1.02] font-semibold tracking-[-0.05em] sm:text-6xl">Sua operação começa aqui.</h1>
          <p className="mt-7 text-lg leading-8 text-muted-foreground">Cadastre sua organização e crie a conta que administrará os acessos da equipe.</p>
          <div className="mt-10 space-y-5">
            {[
              [Building2, "Uma organização para reunir seus processos"],
              [UserRoundCheck, "Acesso inicial com permissões de administrador"],
              [ShieldCheck, "Senha protegida e acesso às informações da sua organização"],
            ].map(([Icon, label]) => {
              const Symbol = Icon as typeof Building2;
              return <div key={label as string} className="flex items-center gap-3 text-sm text-muted-foreground"><span className="grid size-9 place-items-center rounded-xl bg-sage-soft text-sage-strong"><Symbol size={17} /></span>{label as string}</div>;
            })}
          </div>
        </section>
        <section className="surface-card p-6 sm:p-9">
          <p className="text-sm font-semibold">Cadastre-se agora</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Depois do cadastro, entre com o e-mail e a senha informados.</p>
          <RegistrationForm />
          <p className="mt-6 text-sm text-muted-foreground">Já possui acesso? <Link href="/login" className="font-semibold text-sage-strong hover:underline">Entrar</Link></p>
        </section>
      </div>
    </main>
  );
}
