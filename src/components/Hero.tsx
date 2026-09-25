import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PhoneViewport } from "@/three/PhoneStage";
import { CARD_MODELS } from "@/three/models";
import { ColorBends } from "@/components/ColorBends";
import { Button } from "@/components/ui";
import {
  ArrowRightIcon,
  BadgeIcon,
  CalendarIcon,
  ChatIcon,
  LockIcon,
  ShieldIcon,
  TransferIcon,
  TruckIcon,
  WhatsAppIcon,
} from "@/components/icons";
import { heroBullets, heroStats } from "@/data/content";
import { waLink } from "@/data/site";
import { getMotionPrefs } from "@/anim/motion";

// Cada item del carrusel = un iPhone .glb real.
const ITEMS = [
  { model: CARD_MODELS[0] }, // iPhone 17 Pro Max (center inicial)
  { model: CARD_MODELS[1] }, // iPhone 16 Plus
  { model: CARD_MODELS[2] }, // iPhone 14 Pro
  { model: CARD_MODELS[3] }, // iPhone 13 Pro Max
];

const N = ITEMS.length;
const EASE = "cubic-bezier(0.4,0,0.2,1)";
type Role = "center" | "left" | "right" | "back";

// Iconos de los bullets (el dato vive en content.ts, el componente aca).
const BULLET_ICONS = {
  calendar: CalendarIcon,
  transfer: TransferIcon,
  badge: BadgeIcon,
  lock: LockIcon,
  truck: TruckIcon,
  chat: ChatIcon,
} as const;

// Grano sutil (SVG fractalNoise) como en el prototipo.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")";

// "NQN" en plata metálica; el resto del wordmark va en blanco.
const NQN_GRADIENT: CSSProperties = {
  backgroundImage: "var(--silver-gradient)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  // Sin este respiro el clip del degrade come el borde de las letras.
  paddingBottom: "0.1em",
  paddingRight: "0.06em",
};

// Wordmark gigante: mismo tamano para las tres palabras.
const WORDMARK: CSSProperties = {
  fontSize: "clamp(34px, 7.2vw, 104px)",
  // 0.84 apretaba las tres lineas y ademas recortaba el degrade del NQN
  // (background-clip: text usa la caja de linea, no el alto del glifo).
  lineHeight: 0.98,
  letterSpacing: "0.01em",
};

export function Hero() {
  // Sin flechas el carrusel queda fijo: el 17 Pro Max al centro.
  const [activeIndex] = useState(0);
  // < lg: el stage 3D se superpone a la derecha. >= lg: dos columnas.
  const [isNarrow, setIsNarrow] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const reduced = getMotionPrefs().reduced;

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 1024);
    onResize();
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);


  const roleOf = (i: number): Role => {
    if (i === activeIndex) return "center";
    if (i === (activeIndex + N - 1) % N) return "left";
    if (i === (activeIndex + 1) % N) return "right";
    return "back";
  };

  // Posiciones relativas al *stage*, no al viewport: en desktop el stage es la
  // mitad derecha y en mobile una franja superpuesta arriba a la derecha, asi
  // los mismos porcentajes sirven para ambos layouts.
  const styleFor = (role: Role): CSSProperties => {
    const base: CSSProperties = {
      position: "absolute",
      aspectRatio: "0.6 / 1",
      transition: reduced
        ? "none"
        : `transform 650ms ${EASE}, filter 650ms ${EASE}, opacity 650ms ${EASE}, left 650ms ${EASE}, bottom 650ms ${EASE}, height 650ms ${EASE}`,
      willChange: "transform, filter, opacity",
    };
    switch (role) {
      case "center":
        return {
          ...base,
          left: isNarrow ? "54%" : "50%",
          bottom: isNarrow ? "10%" : "11%",
          height: isNarrow ? "82%" : "76%",
          transform: "translateX(-50%) scale(1)",
          filter: "none",
          opacity: 1,
          zIndex: 20,
        };
      case "left":
        return {
          ...base,
          left: isNarrow ? "12%" : "13%",
          bottom: isNarrow ? "22%" : "27%",
          height: isNarrow ? "27%" : "26%",
          transform: "translateX(-50%) scale(1)",
          filter: "blur(2px)",
          opacity: 0.85,
          zIndex: 10,
        };
      case "right":
        return {
          ...base,
          left: isNarrow ? "94%" : "87%",
          bottom: isNarrow ? "24%" : "27%",
          height: isNarrow ? "25%" : "26%",
          transform: "translateX(-50%) scale(1)",
          filter: "blur(2px)",
          opacity: 0.85,
          zIndex: 10,
        };
      default: // back
        return {
          ...base,
          left: isNarrow ? "54%" : "50%",
          bottom: isNarrow ? "30%" : "33%",
          height: isNarrow ? "19%" : "20%",
          transform: "translateX(-50%) scale(1)",
          filter: "blur(4px)",
          opacity: 1,
          zIndex: 5,
        };
    }
  };


  return (
    <section
      ref={rootRef}
      id="inicio"
      className="relative w-full overflow-hidden"
      style={{ minHeight: "100svh" }}
    >
      {/* Fondo: color-bends grafito/plata + brillo detrás de los iPhone */}
      <ColorBends />

      {/* Grano */}
      <div
        className="pointer-events-none absolute inset-0 z-[50] opacity-40"
        style={{ backgroundImage: GRAIN, backgroundSize: "200px 200px" }}
      />

      <div className="relative mx-auto w-full max-w-[1700px] lg:flex lg:min-h-[100svh] lg:items-stretch">
        {/* ---------- Stage 3D ----------
            mobile: superpuesto arriba a la derecha, detras del texto
            desktop: columna derecha completa                            */}
        <div className="absolute right-0 top-[11svh] z-[3] h-[40svh] w-[58%] sm:top-[10svh] sm:h-[46svh] sm:w-[52%] lg:relative lg:inset-auto lg:order-2 lg:h-auto lg:min-h-[100svh] lg:w-1/2">
          {ITEMS.map((item, i) => (
            <div key={i} style={styleFor(roleOf(i))}>
              <PhoneViewport
                model={item.model}
                // Solo el del centro se baja de entrada. Los tres laterales
                // se ven chicos y de costado: entran despues del primer
                // pintado y mientras tanto muestran el iPhone procedural.
                priority={i === 0 ? "eager" : "idle"}
                interactive
                tint={false}
                color="#ffffff"
                className="h-full w-full"
              />
            </div>
          ))}
        </div>

        {/* ---------- Columna de contenido ----------
            El padding de arriba tiene que superar la barra fija (marquee +
            header ≈ 100-104px). Con py-24 (96px), en pantallas de 900px de
            alto la columna no entraba y el badge quedaba debajo del header. */}
        <div className="relative z-[60] flex w-full flex-col justify-center px-5 pb-14 pt-28 sm:px-8 sm:pt-32 lg:order-1 lg:w-1/2 lg:px-12 lg:pb-20 lg:pt-36 xl:px-20">
          {/* Bloque superior: angosto en mobile para no pisar el 3D */}
          <div className="max-w-[68%] overflow-visible sm:max-w-[58%] lg:max-w-none">
            {/* Badge */}
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/90 backdrop-blur-sm sm:px-4 sm:py-2 sm:text-[11px]">
              <ShieldIcon className="h-3.5 w-3.5 shrink-0 text-accent-400 sm:h-4 sm:w-4" />
              Equipos sellados y verificados
            </span>

            {/* Wordmark gigante */}
            <div className="mt-5 select-none sm:mt-6">
              <span className="block font-anton uppercase text-white" style={WORDMARK}>
                Somos
              </span>
              <span className="block font-anton uppercase text-white" style={WORDMARK}>
                iPhone
              </span>
              <span
                className="block font-anton uppercase"
                style={{ ...WORDMARK, ...NQN_GRADIENT }}
              >
                NQN
              </span>
            </div>
          </div>

          {/* Titular */}
          <h1 className="mt-5 max-w-[72%] font-display text-xl font-semibold leading-tight tracking-tight text-white sm:max-w-[62%] sm:text-2xl lg:max-w-none lg:text-[1.75rem] xl:text-[2rem]">
            Tu próximo iPhone, en Neuquén
          </h1>
          <p className="mt-3 max-w-[86%] text-[13px] leading-relaxed text-slate-300/90 sm:max-w-[70%] sm:text-sm lg:max-w-md lg:text-base">
            Nuevos sellados y usados verificados.
            <br />
            Lo probás antes de pagar.
          </p>


          {/* Bullets en cajas, 2 columnas */}
          <ul className="mt-6 grid max-w-2xl grid-cols-2 gap-2 sm:gap-2.5">
            {heroBullets.map((b) => {
              const BulletIcon = BULLET_ICONS[b.icon];
              return (
                <li
                  key={b.text}
                  className="flex items-center gap-2 rounded-xl border border-card-border bg-card px-2.5 py-2.5 text-[11px] leading-snug text-card-text backdrop-blur-sm transition-colors hover:border-line-highlight sm:gap-2.5 sm:px-3.5 sm:py-3 sm:text-[13px]"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-700">
                    <BulletIcon className="h-3.5 w-3.5 text-silver" />
                  </span>
                  {b.text}
                </li>
              );
            })}
          </ul>

          {/* CTA principal */}
          <Button
            href={waLink()}
            target="_blank"
            variant="primary"
            className="mt-6 w-full px-6 py-3.5 text-[15px] lg:w-auto lg:self-start"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Consultar por WhatsApp
            <ArrowRightIcon className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
          </Button>

          {/* Metricas de confianza */}
          <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/10 pt-5 lg:max-w-md">
            {heroStats.map((s, i) => (
              <div key={s.label}>
                <div
                  className={
                    "font-display text-lg font-semibold leading-none sm:text-xl lg:text-2xl " +
                    (i === 1 ? "text-white" : "text-silver")
                  }
                >
                  {s.value}
                </div>
                <div className="mt-1.5 text-[10px] leading-snug text-slate-400 sm:text-[11px]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA secundario en desktop: tarjeta flotante abajo a la derecha */}
      <a
        href="#modelos"
        className="group absolute bottom-8 right-6 z-[60] hidden rounded-2xl border border-button-border bg-card px-7 py-5 backdrop-blur-md transition-colors hover:border-silver hover:bg-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-silver/60 lg:block xl:right-12"
      >
        <span
          className="flex items-center justify-center gap-3 font-anton uppercase text-white"
          style={{ fontSize: "clamp(24px, 2.2vw, 42px)", letterSpacing: "-0.02em" }}
        >
          Ver modelos
          <ArrowRightIcon className="h-7 w-7 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
        </span>
        <span className="mt-1.5 block text-center text-xs text-slate-300/80">
          Elegí el iPhone ideal para vos
        </span>
      </a>
    </section>
  );
}
