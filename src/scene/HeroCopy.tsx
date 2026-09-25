import type { CSSProperties } from "react";
import { Button } from "@/components/ui";
import {
  ArrowRightIcon, BadgeIcon, CalendarIcon, ChatIcon, LockIcon, ShieldIcon, TransferIcon, TruckIcon, WhatsAppIcon,
} from "@/components/icons";
import { heroBullets, heroStats } from "@/data/content";
import { waLink } from "@/data/site";

/** Texto del home (mismo contenido que el Hero anterior). */
const BULLET_ICONS = { calendar: CalendarIcon, transfer: TransferIcon, badge: BadgeIcon, lock: LockIcon, truck: TruckIcon, chat: ChatIcon } as const;

const NQN_GRADIENT: CSSProperties = {
  backgroundImage: "var(--silver-gradient)", WebkitBackgroundClip: "text", backgroundClip: "text",
  color: "transparent", paddingBottom: "0.1em", paddingRight: "0.06em",
};
const WORDMARK: CSSProperties = { fontSize: "clamp(34px, 6.4vw, 96px)", lineHeight: 0.98, letterSpacing: "0.01em" };

export function HeroCopy() {
  return (
    <div className="flex h-full flex-col justify-end px-5 pb-6 pt-6 sm:px-8 lg:justify-center lg:px-12 lg:pb-8 xl:px-20">
      <div className="max-w-[56%] lg:max-w-none">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/90 backdrop-blur-sm sm:px-4 sm:py-2 sm:text-[11px]">
          <ShieldIcon className="h-3.5 w-3.5 shrink-0 text-accent-400 sm:h-4 sm:w-4" />
          Equipos sellados y verificados
        </span>
        <div className="mt-4 select-none sm:mt-6">
          <span className="block font-anton uppercase text-white" style={WORDMARK}>Somos</span>
          <span className="block font-anton uppercase text-white" style={WORDMARK}>iPhone</span>
          <span className="block font-anton uppercase" style={{ ...WORDMARK, ...NQN_GRADIENT }}>NQN</span>
        </div>
      </div>
      <h1 className="mt-4 font-display text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl lg:text-[1.75rem] xl:text-[2rem]">
        Tu próximo iPhone, en Neuquén
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-slate-300/90 sm:text-sm lg:max-w-md lg:text-base">
        Nuevos sellados y usados verificados. Lo probás antes de pagar.
      </p>
      <ul className="mt-5 grid max-w-2xl grid-cols-2 gap-2 sm:gap-2.5">
        {heroBullets.map((b) => {
          const Icon = BULLET_ICONS[b.icon];
          return (
            <li key={b.text} className="flex items-center gap-2 rounded-xl border border-card-border bg-card px-2.5 py-2 text-[11px] leading-snug text-card-text backdrop-blur-sm sm:gap-2.5 sm:px-3.5 sm:py-3 sm:text-[13px]">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-700">
                <Icon className="h-3.5 w-3.5 text-silver" />
              </span>
              {b.text}
            </li>
          );
        })}
      </ul>
      <Button href={waLink()} target="_blank" variant="primary" className="pointer-events-auto mt-5 w-full px-6 py-3.5 text-[15px] lg:w-auto lg:self-start">
        <WhatsAppIcon className="h-5 w-5" />
        Consultar por WhatsApp
        <ArrowRightIcon className="h-5 w-5" />
      </Button>
      <div className="mt-6 hidden grid-cols-2 gap-3 border-t border-white/10 pt-4 lg:grid lg:max-w-md">
        {heroStats.map((s, i) => (
          <div key={s.label}>
            <div className={"font-display text-lg font-semibold leading-none sm:text-xl lg:text-2xl " + (i === 1 ? "text-white" : "text-silver")}>{s.value}</div>
            <div className="mt-1.5 text-[10px] leading-snug text-slate-400 sm:text-[11px]">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
