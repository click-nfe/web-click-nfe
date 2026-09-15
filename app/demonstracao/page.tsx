import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Clock3 } from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Solicitar demonstração",
  description: "Conte um pouco sobre sua operação de importação e conheça o Click NFe.",
};

export default function DemonstracaoPage() {
  const requestUrl = process.env.NEXT_PUBLIC_DEMO_REQUEST_URL;

  return (
    <main className="min-h-screen">
      <header className="page-shell flex h-20 items-center justify-between">
        <Brand />
        <ThemeToggle />
      </header>

      <div className="page-shell grid gap-14 py-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:py-20">
        <section className="max-w-xl">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft size={16} /> Voltar</Link>
          <p className="eyebrow">Acesso acompanhado</p>
          <h1 className="font-display mt-5 text-5xl leading-[1.02] font-semibold tracking-[-0.05em] sm:text-6xl">Conheça o Click NFe na sua rotina.</h1>
          <p className="mt-7 text-lg leading-8 text-muted-foreground">Conte um pouco sobre a sua operação. A demonstração nos ajuda a preparar o contexto da organização antes de liberar os primeiros acessos.</p>

          <div className="mt-10 space-y-5">
            {[
              [Clock3, "Conversa objetiva sobre o fluxo atual"],
              [Building2, "Configuração separada por organização"],
              [CheckCircle2, "Acesso liberado após alinhamento"],
            ].map(([Icon, text]) => {
              const IconComponent = Icon as typeof Clock3;
              return (
                <div key={text as string} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="grid size-9 place-items-center rounded-xl bg-sage-soft text-sage-strong"><IconComponent size={17} /></span>
                  {text as string}
                </div>
              );
            })}
          </div>
        </section>

        <section className="surface-card p-6 sm:p-9">
          <div>
            <p className="text-sm font-semibold">Solicite uma conversa</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Preencha seus dados para encaminhar a solicitação ao canal comercial.</p>
          </div>

          <form action={requestUrl} method="post" className="mt-8 grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="field-label">Nome</label>
              <input id="name" name="name" required autoComplete="name" className="field-input" placeholder="Seu nome" />
            </div>
            <div>
              <label htmlFor="company" className="field-label">Empresa</label>
              <input id="company" name="company" required autoComplete="organization" className="field-input" placeholder="Nome da empresa" />
            </div>
            <div>
              <label htmlFor="email" className="field-label">E-mail corporativo</label>
              <input id="email" name="email" type="email" required autoComplete="email" className="field-input" placeholder="voce@empresa.com.br" />
            </div>
            <div>
              <label htmlFor="phone" className="field-label">Telefone</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" className="field-input" placeholder="(00) 00000-0000" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="volume" className="field-label">Volume aproximado de processos por mês</label>
              <select id="volume" name="volume" className="field-input" defaultValue="">
                <option value="" disabled>Selecione uma faixa</option>
                <option value="1-10">1 a 10</option>
                <option value="11-50">11 a 50</option>
                <option value="51-200">51 a 200</option>
                <option value="201+">Mais de 200</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="message" className="field-label">O que você gostaria de melhorar?</label>
              <textarea id="message" name="message" rows={4} className="field-input h-auto resize-y py-3" placeholder="Conte brevemente sobre seu fluxo atual." />
            </div>

            <div className="sm:col-span-2">
              <button type="submit" disabled={!requestUrl} className="button button-primary min-h-12 w-full sm:w-auto sm:px-7">
                Enviar solicitação <ArrowRight size={17} />
              </button>
              {!requestUrl && (
                <p className="mt-3 text-xs leading-5 text-muted-foreground">O formulário visual está pronto. Defina <code className="rounded bg-muted px-1.5 py-0.5">NEXT_PUBLIC_DEMO_REQUEST_URL</code> para habilitar o envio ao canal comercial escolhido.</p>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
