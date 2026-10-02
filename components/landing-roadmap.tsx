import { Check } from "lucide-react";

const milestones = [
  { title: "Importar a DUIMP", detail: "Dados da declaração reunidos" },
  { title: "Conferir itens e tributos", detail: "Classificações e cálculos revisados" },
  { title: "Preparar a NF-e", detail: "Minuta e XML validados" },
  { title: "Assinar o XML", detail: "Certificado A1 do emitente" },
  { title: "Transmitir à SEFAZ", detail: "Envio e consulta do resultado" },
];

export function LandingRoadmap() {
  return (
    <div className="surface-card landing-roadmap relative overflow-hidden p-5 sm:p-7">
      <div className="border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Jornada da importação</p>
        <p className="mt-1.5 font-semibold">Da DUIMP ao retorno da SEFAZ</p>
      </div>

      <div className="relative mt-5">
        <svg
          aria-hidden="true"
          className="landing-roadmap__track"
          viewBox="0 0 100 440"
          preserveAspectRatio="none"
        >
          <path
            className="landing-roadmap__rail"
            d="M 26 44 C 26 85 74 91 74 132 S 26 179 26 220 S 74 267 74 308 S 26 355 26 396"
          />
          <path
            className="landing-roadmap__progress"
            pathLength="100"
            d="M 26 44 C 26 85 74 91 74 132 S 26 179 26 220 S 74 267 74 308 S 26 355 26 396"
          />
        </svg>
        <ol className="relative">
          {milestones.map(({ title, detail }, index) => (
            <li key={title} className="landing-roadmap__stop relative flex h-[88px] items-center pl-[112px]">
              <span className="landing-roadmap__marker absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full border text-xs font-semibold">
                <span className="landing-roadmap__number">{index + 1}</span>
                <Check aria-hidden="true" className="landing-roadmap__check absolute" size={17} strokeWidth={2.6} />
              </span>
              <span className="landing-roadmap__copy min-w-0">
                <span className="block text-sm font-semibold leading-5">{title}</span>
                <span className="mt-1 block text-xs leading-4 text-muted-foreground">{detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
