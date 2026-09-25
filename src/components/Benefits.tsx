import { useEffect, useRef, useState } from "react";
import { Container, Reveal, SectionHeading } from "@/components/ui";
import { Icon } from "@/components/icons";
import { ClientStories } from "@/components/ClientStories";
import { cn } from "@/utils/cn";
import { benefits, stats, type Benefit, type Stat } from "@/data/content";
import {
  fotosCredibilidad,
  hayFotosCredibilidad,
} from "@/data/fotosCredibilidad";

/** Cada cuánto cambia la foto de cada card. */
const ROTA_MS = 4200;

/**
 * Un solo timer para toda la sección. Con un intervalo por card serían nueve
 * timers haciendo lo mismo; acá el tick es compartido y cada card se corre con
 * su propio offset, así nunca muestran todas la misma foto.
 */
function useRotationTick(everyMs: number) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (fotosCredibilidad.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      // Pestaña en segundo plano: no tiene sentido gastar repintados.
      if (!document.hidden) setTick((t) => t + 1);
    }, everyMs);

    return () => window.clearInterval(id);
  }, [everyMs]);

  return tick;
}

/**
 * Dos ranuras fijas que se alternan: la foto nueva entra siempre en la que le
 * toca y la anterior se desvanece encima. Son dos <img> por card sin importar
 * cuántas fotos haya en la carpeta — con veinte fotos, apilarlas todas serían
 * ciento ochenta imágenes en el DOM.
 */
function RotatingPhoto({
  tick,
  offset,
  delayMs,
  objectPosition,
}: {
  tick: number;
  offset: number;
  delayMs: number;
  objectPosition?: string;
}) {
  const n = fotosCredibilidad.length;
  const i = (tick + offset) % n;
  const prev = (i - 1 + n) % n;
  const par = tick % 2 === 0;

  const aIdx = par ? i : prev;
  const bIdx = par ? prev : i;

  const base =
    "pointer-events-none absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[900ms] ease-in-out group-hover:scale-105";

  return (
    <>
      <img
        src={fotosCredibilidad[aIdx]}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className={cn(base, par ? "opacity-100" : "opacity-0", objectPosition)}
        style={{ transitionDelay: `${delayMs}ms` }}
      />
      <img
        src={fotosCredibilidad[bIdx]}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className={cn(base, par ? "opacity-0" : "opacity-100", objectPosition)}
        style={{ transitionDelay: `${delayMs}ms` }}
      />
    </>
  );
}

export function Benefits() {
  const tick = useRotationTick(ROTA_MS);

  return (
    <section id="beneficios" className="relative scroll-mt-28 py-20 sm:py-28">
      {/* glow ambiental */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-silver/[0.04] blur-[120px]" />
      </div>

      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Por qué somos iphone nqn"
            title={
              <>
                Comprar tu iPhone en Neuquén,{" "}
                simple, local y premium
              </>
            }
            description="Atención en persona, equipos verificados y la confianza de comprar cerca tuyo."
          />
        </Reveal>

        {/* Contadores animados */}
        <Reveal>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4">
            {stats.map((s) => (
              <StatCard key={s.label} stat={s} />
            ))}
          </div>
        </Reveal>

        {/* Bento de beneficios */}
        <div className="mt-5 grid auto-rows-[minmax(150px,auto)] grid-flow-dense gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b, i) => (
            <Reveal
              key={b.title}
              delay={i * 55}
              className={cn(b.featured && "sm:col-span-2 lg:row-span-2")}
            >
              <BenefitCard b={b} index={i} tick={tick} />
            </Reveal>
          ))}
        </div>

        {/* Historias de clientes: enteras y en movimiento */}
        <ClientStories />
      </Container>
    </section>
  );
}

function BenefitCard({
  b,
  index,
  tick,
}: {
  b: Benefit;
  index: number;
  tick: number;
}) {
  // Las fotos son las nuestras, de src/fotoswebCredibilidad/. Si todavía no
  // hay ninguna, la card cae al layout con ícono en vez de quedar vacía.
  const conFoto = hayFotosCredibilidad;

  return (
    <article
      className={cn(
        "glass group relative flex h-full flex-col overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-line-highlight hover:shadow-[0_24px_60px_-26px_rgba(0,0,0,0.7)]",
        // Las fotos son verticales y las cards anchas: con poca altura el
        // object-cover deja una franja del medio y se pierde el motivo.
        conFoto && "min-h-[16rem] justify-end"
      )}
    >
      {conFoto ? (
        <>
          <RotatingPhoto
            tick={tick}
            offset={index}
            // Escalonado: si todas cruzan en el mismo instante parece un
            // parpadeo de la sección entera en vez de fotos rotando.
            delayMs={(index % 4) * 150}
            objectPosition={b.featured ? "[object-position:center_60%]" : undefined}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/75 to-ink-950/20" />
        </>
      ) : null}

      {/* brillo de borde en hover */}
      <span className="pointer-events-none absolute inset-px rounded-2xl opacity-0 ring-1 ring-inset ring-accent-300/30 transition-opacity duration-300 group-hover:opacity-100" />

      {b.tag ? (
        <span className="absolute right-4 top-4 z-10 rounded-full border border-line bg-ink-950/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-silver-light backdrop-blur-md">
          {b.tag}
        </span>
      ) : null}

      {/* Ícono solo si todavía no hay fotos propias */}
      {!conFoto ? (
        <div
          className={cn(
            "mb-5 inline-flex items-center justify-center rounded-xl bg-ink-700 text-silver ring-1 ring-inset ring-white/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
            b.featured ? "h-14 w-14" : "h-12 w-12"
          )}
        >
          <Icon name={b.icon} className={cn(b.featured ? "h-7 w-7" : "h-6 w-6")} />
        </div>
      ) : null}

      <h3
        className={cn(
          "relative z-10 font-display font-semibold text-white",
          b.featured ? "text-xl sm:text-2xl" : "text-lg"
        )}
      >
        {b.title}
      </h3>
      <p
        className={cn(
          "relative z-10 mt-2 leading-relaxed",
          conFoto ? "text-slate-200" : "text-slate-400",
          b.featured ? "text-sm sm:text-base" : "text-sm"
        )}
      >
        {b.text}
      </p>
    </article>
  );
}

function formatStat(value: number, decimals: number): string {
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function StatCard({ stat }: { stat: Stat }) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [n, setN] = useState(0);
  const decimals = stat.decimals ?? 0;

  // Dispara al entrar en viewport (una vez).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(stat.value);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setStarted(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [stat.value]);

  // Cuenta hasta el valor con cleanup correcto del RAF.
  useEffect(() => {
    if (!started) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(eased * stat.value);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, stat.value]);

  return (
    <div
      ref={ref}
      className="glass flex flex-col items-center rounded-2xl px-3 py-6 text-center"
    >
      <div className="font-display text-3xl font-semibold text-white sm:text-4xl">
        {stat.prefix ?? ""}
        <span className="tabular-nums">{formatStat(n, decimals)}</span>
        {stat.suffix ?? ""}
      </div>
      <div className="mt-1.5 text-xs text-slate-400 sm:text-sm">{stat.label}</div>
    </div>
  );
}
