import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

function prefersReduced(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function healthColor(h: number): string {
  if (h >= 85) return "#34d399"; // verde
  if (h >= 80) return "#a3e635"; // lima
  return "#fbbf24"; // ámbar
}

/**
 * Barra de batería para equipos usados. Cuando la card entra en pantalla,
 * la barra sube de 0% hasta `health`% y el número cuenta hasta ese valor.
 */
export function BatteryBar({
  health,
  className,
}: {
  health: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [filled, setFilled] = useState(false);
  const [display, setDisplay] = useState(0);
  // Último número mostrado: al cambiar la condición elegida en la card, el
  // conteo arranca desde acá y no desde 0.
  const shown = useRef(0);

  // Dispara la animación al entrar en viewport (una sola vez).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReduced()) {
      setFilled(true);
      setDisplay(health);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setFilled(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [health]);

  // Cuenta el número en paralelo a la barra.
  useEffect(() => {
    if (!filled) return;
    if (prefersReduced()) {
      shown.current = health;
      setDisplay(health);
      return;
    }
    let raf = 0;
    const from = shown.current;
    const start = performance.now();
    const dur = 1100;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      shown.current = Math.round(from + eased * (health - from));
      setDisplay(shown.current);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [filled, health]);

  const color = healthColor(health);
  // "+85%" = "85% o más". Con 100 no hay "o más": "+100%" se leía raro.
  const plus = health < 100 ? "+" : "";

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-slate-300">
          <BatteryIcon className="h-3.5 w-3.5" style={{ color }} />
          Batería
        </span>
        <span className="font-semibold tabular-nums" style={{ color }}>
          {plus}
          {display}%
        </span>
      </div>
      {/* Batería real: cuerpo + terminal (estilo iOS) */}
      <div
        className="flex items-center gap-[3px]"
        role="img"
        aria-label={`Salud de batería ${plus}${health}%`}
      >
        <div className="relative h-[18px] flex-1 overflow-hidden rounded-[5px] border-2 border-white/25 bg-white/[0.06] p-[2px]">
          {/* nivel de carga */}
          <div
            className="h-full rounded-[2px] transition-[width] duration-[1100ms] ease-out"
            style={{
              width: filled ? `${health}%` : "0%",
              background: `linear-gradient(90deg, ${color}d9, ${color})`,
              boxShadow: `0 0 10px ${color}80`,
            }}
          />
          {/* reflejo sutil de vidrio */}
          <div className="pointer-events-none absolute inset-x-[2px] top-[2px] h-[40%] rounded-[2px] bg-gradient-to-b from-white/15 to-transparent" />
        </div>
        {/* terminal (+) */}
        <span
          aria-hidden="true"
          className="h-[8px] w-[3px] rounded-r-[2px] bg-white/30"
        />
      </div>
    </div>
  );
}

function BatteryIcon({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="7" width="16" height="10" rx="2.5" />
      <path d="M20 10v4" />
      <rect x="4" y="9" width="9" height="6" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
