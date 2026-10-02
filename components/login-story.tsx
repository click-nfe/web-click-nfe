"use client";

import { FileCheck2, Fingerprint, ScanSearch, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

const stories = [
  {
    quote: "Clareza para conferir. Segurança para emitir.",
    detail: "Acesso autenticado e permissões para as operações fiscais.",
    icon: ShieldCheck,
  },
  {
    quote: "Da DUIMP à NF-e, cada etapa à vista.",
    detail: "Dados e classificações reunidos para uma conferência cuidadosa.",
    icon: ScanSearch,
  },
  {
    quote: "O XML assinado segue com você até o protocolo.",
    detail: "A transmissão e o retorno da SEFAZ ficam vinculados à nota.",
    icon: FileCheck2,
  },
  {
    quote: "O certificado do emitente tem seu lugar seguro.",
    detail: "O A1 é armazenado no cofre do servidor para assinatura e comunicação fiscal.",
    icon: Fingerprint,
  },
];

export function LoginStory() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let changeTimer: number | undefined;
    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setVisible(false);
      changeTimer = window.setTimeout(() => {
        setActive((current) => (current + 1) % stories.length);
        setVisible(true);
      }, 320);
    }, 6000);
    return () => {
      window.clearInterval(interval);
      if (changeTimer) window.clearTimeout(changeTimer);
    };
  }, []);

  const story = stories[active];
  const Icon = story.icon;

  return (
    <>
      <blockquote className="relative flex min-h-[245px] max-w-2xl flex-col justify-center">
        <div className={`transition duration-300 ease-out motion-reduce:transition-none ${visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
          <p className="font-display text-4xl leading-[1.08] font-semibold tracking-[-0.045em] xl:text-5xl">“{story.quote}”</p>
          <footer className="mt-8 flex items-start gap-3 text-sm leading-6 opacity-75">
            <Icon aria-hidden="true" size={19} className="mt-0.5 shrink-0 text-sage" />
            <span>{story.detail}</span>
          </footer>
        </div>
      </blockquote>
      <div className="relative flex gap-2" aria-label={`Mensagem ${active + 1} de ${stories.length}`}>
        {stories.map((item, index) => (
          <span
            key={item.quote}
            aria-hidden="true"
            className={`h-1 rounded-full transition-all duration-300 motion-reduce:transition-none ${index === active ? "w-14 bg-sage" : "w-5 bg-white/20"}`}
          />
        ))}
      </div>
    </>
  );
}
