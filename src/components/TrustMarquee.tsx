import { CheckIcon } from "@/components/icons";
import { marqueeItems } from "@/data/content";

function Group() {
  return (
    <div className="flex shrink-0 items-center gap-8 pr-8" aria-hidden="true">
      {marqueeItems.map((t, i) => (
        <div
          key={`${t}-${i}`}
          className="flex items-center gap-3 whitespace-nowrap text-sm font-medium text-slate-300"
        >
          <CheckIcon className="h-4 w-4 text-accent-400" />
          <span>{t}</span>
          <span className="ml-5 h-1 w-1 rounded-full bg-white/25" />
        </div>
      ))}
    </div>
  );
}

/**
 * Marquee de confianza. Movimiento CONTINUO por CSS (animate-marquee), totalmente
 * independiente del scroll: no se frena, ni cambia de dirección, ni salta.
 * Con prefers-reduced-motion el CSS global detiene la animación.
 * Sin backdrop-blur: el fondo es opaco (no se veía) y, al estar fija, lo
 * recalculaba en cada frame del scroll.
 */
export function TrustMarquee() {
  return (
    <div className="relative overflow-hidden border-b border-line-dark bg-deep py-2">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-deep to-transparent sm:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-deep to-transparent sm:w-28" />
      <div className="animate-marquee flex w-max">
        <Group />
        <Group />
      </div>
    </div>
  );
}
