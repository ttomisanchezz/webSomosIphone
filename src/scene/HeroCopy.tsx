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
  backgroundImage: "linear-gradient(180deg, var(--blue-light) 0%, var(--blue) 100%)", WebkitBackgroundClip: "text", backgroundClip: "text",
  color: "transparent", paddingRight: "0.04em",
};
/** Separa las letras del fondo y de los iPhones: sombra oscura + brillo azul + filo claro. */
const WORD_FX: CSSProperties = {
  filter: "drop-shadow(0 12px 28px rgba(0,0,0,.85)) drop-shadow(0 0 36px rgba(46,123,255,.45))",
  WebkitTextStroke: "1px rgba(255,255,255,.35)",
};
const TEXT_SHADOW: CSSProperties = { textShadow: "0 2px 18px rgba(0,0,0,.9), 0 0 2px rgba(0,0,0,.8)" };

/** Wordmark gigante detrás de ellos. */
export function HeroWordmark() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[13svh] select-none text-center lg:top-[12svh]" aria-hidden="true">
      <span className="inline-block font-anton uppercase leading-none" style={{ fontSize: "clamp(56px, 13.5vw, 230px)", letterSpacing: "0.01em", ...WORD_FX }}>
        <span style={{ backgroundImage: "linear-gradient(180deg,#ffffff 0%,#e2e3e5 55%,#9a9da1 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Somos iPhone </span>
        <span style={NQN_GRADIENT}>NQN</span>
      </span>
    </div>
  );
}

export function HeroSides() {
  return (
    <>
      {/* Izquierda: badge, titular y botón */}
      <div className="absolute bottom-[4svh] left-4 right-4 flex flex-col lg:bottom-[12svh] lg:left-12 lg:right-auto lg:max-w-[23vw] xl:left-20">
        <span className="hidden w-fit items-center gap-2 rounded-full border border-[var(--blue)]/60 bg-[var(--blue)]/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--blue-light)] shadow-[0_0_24px_rgba(46,123,255,.35)] backdrop-blur-md lg:inline-flex">
          <ShieldIcon className="h-4 w-4 shrink-0 text-[var(--blue-light)]" />
          Equipos sellados y verificados
        </span>
        <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight text-white lg:mt-5 lg:text-[2rem]" style={TEXT_SHADOW}>
          Tu próximo iPhone, en Neuquén
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--silver-light)] lg:text-base" style={TEXT_SHADOW}>
          Nuevos sellados y usados verificados. Lo probás antes de pagar.
        </p>
        <Button href={waLink()} target="_blank" variant="primary" className="mt-4 w-full px-6 py-3.5 text-[15px] lg:w-auto lg:self-start">
          <WhatsAppIcon className="h-5 w-5" />
          Consultar por WhatsApp
          <ArrowRightIcon className="h-5 w-5" />
        </Button>
      </div>
      {/* Derecha: beneficios y métricas (solo PC; en celular están en la sección Beneficios) */}
      <div className="absolute bottom-[12svh] right-12 hidden w-[22vw] max-w-sm flex-col gap-4 lg:flex xl:right-20">
        {heroBullets.map((b, i) => {
          const Icon = BULLET_ICONS[b.icon];
          return (
            <div
              key={b.text}
              className="hero-float flex items-center gap-3 text-[15px] font-medium leading-snug text-white"
              style={{ ...TEXT_SHADOW, animationDelay: `${i * -0.7}s`, marginLeft: `${(i % 2) * 1.5}rem` }}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--blue)]/60 bg-[var(--blue)]/20 shadow-[0_0_18px_rgba(46,123,255,.45)] backdrop-blur-md">
                <Icon className="h-4 w-4 text-[var(--blue-light)]" />
              </span>
              {b.text}
            </div>
          );
        })}
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/15 pt-4" style={TEXT_SHADOW}>
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
