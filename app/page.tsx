import {
  ArrowRight,
  Building2,
  Check,
  FileCheck2,
  Fingerprint,
  Layers3,
  LockKeyhole,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { Brand } from "@/components/brand";
import { SiteHeader } from "@/components/site-header";

const steps = [
  {
    number: "01",
    title: "Reúna a operação",
    description: "Centralize os dados da DUIMP, do importador e dos itens em um processo único.",
    icon: Layers3,
  },
  {
    number: "02",
    title: "Confira com contexto",
    description: "Revise classificações, tributos e documentos com rastreabilidade antes de emitir.",
    icon: ScanSearch,
  },
  {
    number: "03",
    title: "Prepare a NF-e",
    description: "Transforme os dados validados em uma minuta fiscal pronta para a etapa de emissão.",
    icon: FileCheck2,
  },
];

const benefits = [
  "Fluxo orientado à importação via DUIMP",
  "Dados organizados por cliente e processo",
  "Conferência antes da emissão fiscal",
  "Histórico para acompanhar cada decisão",
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden">
      <SiteHeader />

      <main>
        <section className="relative border-b border-border">
          <div className="hero-grid pointer-events-none absolute inset-0 opacity-65" />
          <div className="page-shell relative grid min-h-[calc(100vh-5rem)] items-center gap-14 py-20 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
            <div className="max-w-3xl">
              <div className="eyebrow mb-7">
                <Sparkles size={14} />
                Fiscal de importação, sem ruído
              </div>
              <h1 className="font-display text-5xl leading-[0.97] font-semibold tracking-[-0.055em] text-balance sm:text-6xl lg:text-[5.4rem]">
                Da DUIMP à NF-e, com clareza em cada etapa.
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                O Click NFe organiza sua operação de importação, apoia a conferência fiscal e prepara a emissão com um fluxo simples, seguro e rastreável.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/demonstracao" className="button button-primary min-h-12 px-6">
                  Solicitar demonstração <ArrowRight size={17} />
                </Link>
                <Link href="/login" className="button button-secondary min-h-12 px-6">
                  Já tenho acesso
                </Link>
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                <LockKeyhole size={14} className="text-sage-strong" />
                Novas contas são liberadas após a configuração da organização.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:justify-self-end">
              <div className="absolute -inset-8 rounded-full bg-sage/20 blur-3xl" />
              <div className="surface-card relative overflow-hidden p-5 sm:p-7">
                <div className="flex items-center justify-between border-b border-border pb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Processo de importação</p>
                    <p className="mt-1.5 font-semibold">DUIMP 25BR0000000000</p>
                  </div>
                  <span className="rounded-full bg-sage-soft px-3 py-1.5 text-xs font-semibold text-sage-strong">Em conferência</span>
                </div>

                <div className="space-y-3 py-6">
                  {[
                    ["Dados da declaração", "Conferidos"],
                    ["Itens e classificações", "Em revisão"],
                    ["Minuta da NF-e", "Aguardando"],
                  ].map(([label, status], index) => (
                    <div key={label} className="flex items-center gap-4 rounded-xl border border-border bg-background/65 p-4">
                      <span className={`grid size-8 shrink-0 place-items-center rounded-full ${index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {index === 0 ? <Check size={15} strokeWidth={2.5} /> : index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{status}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-sage-soft p-4 text-sm text-sage-strong">
                  <ShieldCheck size={19} />
                  Dados isolados para a sua organização
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="page-shell py-24 sm:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
            <div>
              <p className="eyebrow">Como funciona</p>
              <h2 className="font-display mt-5 text-4xl leading-tight font-semibold tracking-[-0.04em] sm:text-5xl">Um caminho fiscal que você consegue acompanhar.</h2>
              <p className="mt-6 leading-7 text-muted-foreground">Cada etapa mostra o que já foi conferido, o que exige atenção e o que está pronto para avançar.</p>
            </div>

            <div className="divide-y divide-border border-y border-border">
              {steps.map(({ number, title, description, icon: Icon }) => (
                <article key={number} className="grid gap-5 py-7 sm:grid-cols-[3rem_3rem_1fr] sm:items-start">
                  <span className="font-mono text-xs text-muted-foreground">{number}</span>
                  <span className="grid size-10 place-items-center rounded-xl bg-sage-soft text-sage-strong"><Icon size={19} /></span>
                  <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="mt-2 max-w-xl leading-7 text-muted-foreground">{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="beneficios" className="border-y border-border bg-card/55">
          <div className="page-shell grid gap-14 py-24 lg:grid-cols-2 lg:items-center lg:py-32">
            <div className="surface-card relative min-h-[420px] overflow-hidden bg-[linear-gradient(145deg,var(--sage-soft),var(--card)_62%)] p-7 sm:p-10">
              <div className="absolute right-8 top-8 size-40 rounded-full border border-primary/15" />
              <div className="absolute right-16 top-16 size-24 rounded-full border border-primary/20" />
              <div className="relative flex h-full min-h-[340px] flex-col justify-between">
                <span className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><Fingerprint size={26} /></span>
                <div>
                  <p className="font-display max-w-sm text-3xl leading-tight font-semibold tracking-[-0.035em]">Menos planilhas soltas. Mais contexto para decidir.</p>
                  <p className="mt-4 max-w-sm leading-7 text-muted-foreground">Uma visão compartilhada da operação, do documento original à preparação fiscal.</p>
                </div>
              </div>
            </div>

            <div className="lg:pl-10">
              <p className="eyebrow">Feito para a rotina real</p>
              <h2 className="font-display mt-5 text-4xl leading-tight font-semibold tracking-[-0.04em] sm:text-5xl">A informação certa, no momento certo.</h2>
              <div className="mt-9 space-y-5">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-sage-soft text-sage-strong"><Check size={14} strokeWidth={2.5} /></span>
                    <p className="leading-7 text-muted-foreground">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="seguranca" className="page-shell py-24 sm:py-32">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr] lg:items-end">
            <div>
              <p className="eyebrow">Segurança desde a base</p>
              <h2 className="font-display mt-5 text-4xl leading-tight font-semibold tracking-[-0.04em] sm:text-5xl">Cada organização no seu próprio contexto.</h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground lg:justify-self-end">O acesso é autenticado e os dados operacionais são vinculados à organização do usuário. A arquitetura nasce preparada para evoluir a gestão de credenciais e segredos sem misturar ambientes ou clientes.</p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              [Building2, "Isolamento por organização", "Consultas e operações usam o contexto da conta autenticada."],
              [ShieldCheck, "Acesso controlado", "Novos usuários entram por convite e configuração da organização."],
              [LockKeyhole, "Segredos fora da interface", "Credenciais sensíveis ficam na camada segura do servidor."],
            ].map(([Icon, title, description]) => {
              const IconComponent = Icon as typeof Building2;
              return (
                <article key={title as string} className="surface-card p-6">
                  <IconComponent className="text-sage-strong" size={22} />
                  <h3 className="mt-8 font-semibold">{title as string}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{description as string}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="page-shell pb-24 sm:pb-32">
          <div className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-16 text-background sm:px-12 lg:px-16 dark:bg-card dark:text-card-foreground">
            <div className="absolute -right-16 -top-28 size-72 rounded-full bg-sage/30 blur-3xl" />
            <div className="relative flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage">Acesso inicial acompanhado</p>
                <h2 className="font-display mt-5 text-4xl leading-tight font-semibold tracking-[-0.04em] sm:text-5xl">Vamos entender sua operação?</h2>
                <p className="mt-5 max-w-2xl leading-7 opacity-70">Solicite uma demonstração para conhecermos o seu fluxo e prepararmos o acesso da organização.</p>
              </div>
              <Link href="/demonstracao" className="button min-h-12 shrink-0 bg-sage px-6 text-slate-950 hover:-translate-y-0.5 hover:bg-sage/90">
                Solicitar demonstração <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="page-shell flex flex-col gap-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Brand />
          <p>© {new Date().getFullYear()} Click NFe. Gestão fiscal para operações de importação.</p>
        </div>
      </footer>
    </div>
  );
}
