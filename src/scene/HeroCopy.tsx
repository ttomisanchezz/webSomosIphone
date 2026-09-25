import type { CSSProperties } from "react";
import { Button } from "@/components/ui";
import {
  ArrowRightIcon, BadgeIcon, CalendarIcon, ChatIcon, LockIcon, ShieldIcon, TransferIcon, TruckIcon, WhatsAppIcon,
} from "@/components/icons";
import { heroBullets, heroStats } from "@/data/content";
import { waLink } from "@/data/site";

/** Textos de la portada (mismo contenido que el Hero anterior), repartidos alrededor de Fran y Tomi. */
const BULLET_ICONS = { calendar: CalendarIcon, transfer: TransferIcon, badge: BadgeIcon, lock: LockIcon, truck: TruckIcon, chat: ChatIcon } as const;

const NQN_GRADIENT: CSSProperties = {
  backgroundImage: "var(--silver-gradient)", WebkitBackgroundClip: "text", backgroundClip: "text",
  color: "transparent", paddingRight: "0.04em",
};

/** Wordmark gigante detrás de ellos. */
export function HeroWordmark() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[13svh] select-none text-center lg:top-[12svh]" aria-hidden="true">
      <span className="font-anton uppercase leading-none text-white/95" style={{ fontSize: "clamp(56px, 13.5vw, 230px)", letterSpacing: "0.01em" }}>
        Somos iPhone <span style={NQN_GRADIENT}>NQN</span>
      </span>
    </div>
  );
}

export function HeroSides() {
  return (
    <>
      {/* Izquierda: badge, titular y botón */}
      <div className="absolute bottom-[4svh] left-4 right-4 flex flex-col lg:bottom-[12svh] lg:left-12 lg:right-auto lg:max-w-[23vw] xl:left-20">
        <span className="hidden w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/90 backdrop-blur-sm lg:inline-flex">
          <ShieldIcon className="h-4 w-4 shrink-0 text-accent-400" />
          Equipos sellados y verificados
        </span>
        <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-white lg:mt-5 lg:text-[2rem]">
          Tu próximo iPhone, en Neuquén
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-300/90 lg:text-base">
          Nuevos sellados y usados verificados. Lo probás antes de pagar.
        </p>
        <Button href={waLink()} target="_blank" variant="primary" className="mt-4 w-full px-6 py-3.5 text-[15px] lg:w-auto lg:self-start">
          <WhatsAppIcon className="h-5 w-5" />
          Consultar por WhatsApp
          <ArrowRightIcon className="h-5 w-5" />
        </Button>
      </div>
      {/* Derecha: beneficios y métricas (solo PC; en celular están en la sección Beneficios) */}
      <div className="absolute bottom-[12svh] right-12 hidden w-[22vw] max-w-sm flex-col gap-2.5 lg:flex xl:right-20">
        {heroBullets.map((b) => {
          const Icon = BULLET_ICONS[b.icon];
          return (
            <div key={b.text} className="flex items-center gap-2.5 rounded-xl border border-card-border bg-card px-3.5 py-3 text-[13px] leading-snug text-card-text backdrop-blur-md">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-700">
                <Icon className="h-3.5 w-3.5 text-silver" />
              </span>
              {b.text}
            </div>
          );
        })}
        <div className="mt-2 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
          {heroStats.map((s, i) => (
            <div key={s.label}>
              <div className={"font-display text-2xl font-semibold leading-none " + (i === 1 ? "text-white" : "text-silver")}>{s.value}</div>
              <div className="mt-1.5 text-[11px] leading-snug text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
