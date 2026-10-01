"use client";

import { ChevronDown, Check } from "lucide-react";
import { useEffect, useState } from "react";

const stages = [
  { id: "nfe-cliente", title: "Cliente" },
  { id: "nfe-duimp", title: "Capturar DUIMP" },
  { id: "nfe-contexto", title: "Contexto fiscal" },
  { id: "nfe-finalidades", title: "Finalidades" },
  { id: "plano-de-notas", title: "Plano de notas" },
  { id: "rascunhos-nfe", title: "Rascunhos" },
  { id: "xmls-nfe", title: "XML e XSD" },
  { id: "assinatura-nfe", title: "Assinatura e PDF" },
  { id: "transmissao-nfe", title: "SEFAZ" },
] as const;

export function NfeRoadmap() {
  const [available, setAvailable] = useState<string[]>(["nfe-cliente"]);
  const [current, setCurrent] = useState("nfe-cliente");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const root = document.getElementById("nfe-process-content");
    if (!root) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const enabled = stages.filter(({ id }) => {
          const element = document.getElementById(id);
          return element && element.dataset.unlocked !== "false";
        });
        const ids = enabled.map(({ id }) => id);
        setAvailable((previous) => previous.join("|") === ids.join("|") ? previous : ids);
        const threshold = window.innerWidth < 1024 ? 220 : 160;
        const visible = enabled.filter(({ id }) =>
          (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) <= threshold
        );
        setCurrent(visible.at(-1)?.id ?? enabled[0]?.id ?? "nfe-cliente");
      });
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-unlocked"] });
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function goTo(id: string) {
    if (!available.includes(id)) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
    setCurrent(id);
    setExpanded(false);
  }

  const currentStage = stages.find(({ id }) => id === current) ?? stages[0];
  const list = (
    <ol className="space-y-0.5">
      {stages.map(({ id, title }, index) => {
        const enabled = available.includes(id);
        const active = current === id;
        const completed = enabled && available.indexOf(id) < available.indexOf(current);
        return (
          <li key={id} className={`relative pl-7 pb-2 last:pb-0 ${enabled ? "" : "opacity-40"}`}>
            {index < stages.length - 1 ? (
              <span aria-hidden="true" className={`absolute left-[0.64rem] top-6 h-[calc(100%-0.4rem)] border-l-2 ${enabled && available.includes(stages[index + 1].id) ? "border-primary/50" : "border-dashed border-border"}`} />
            ) : null}
            <span aria-hidden="true" className={`absolute left-0 top-1 grid size-6 place-items-center rounded-full border text-xs font-semibold ${active ? "border-primary bg-primary text-primary-foreground" : enabled ? "border-primary/40 bg-sage-soft text-sage-strong" : "border-border bg-muted text-muted-foreground"}`}>
              {completed ? <Check size={13} /> : index + 1}
            </span>
            {enabled ? (
              <button type="button" onClick={() => goTo(id)} aria-current={active ? "step" : undefined} className={`w-full rounded-md px-1 py-1 text-left text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                {title}
              </button>
            ) : <span className="block px-1 py-1 text-sm text-muted-foreground">{title}</span>}
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      <nav aria-label="Etapas da NF-e" className="fixed right-5 top-28 z-20 hidden w-48 rounded-2xl border border-border bg-card p-4 shadow-lg lg:block">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Navegar pelo processo</p>
        {list}
      </nav>
      <nav aria-label="Etapas da NF-e" className="fixed inset-x-0 top-20 z-[25] border-b border-border bg-card/95 px-5 py-2 shadow-sm backdrop-blur-xl lg:hidden">
        <button type="button" className="flex w-full items-center gap-2 text-left" aria-expanded={expanded} aria-controls="nfe-mobile-roadmap" onClick={() => setExpanded((value) => !value)}>
          <span className="grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{stages.indexOf(currentStage) + 1}</span>
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{currentStage.title}</span>
          <span className="text-xs text-muted-foreground">Etapas</span>
          <ChevronDown size={16} className={expanded ? "rotate-180" : ""} />
        </button>
        {expanded ? <div id="nfe-mobile-roadmap" className="max-h-[60vh] overflow-y-auto border-t border-border pt-3 mt-2">{list}</div> : null}
      </nav>
    </>
  );
}
