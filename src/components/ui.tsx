import { useEffect, useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { cn } from "@/utils/cn";
import { ArrowRightIcon } from "@/components/icons";
import { gsap } from "@/anim/gsap";
import { hideUntilEnter, onEnterView, revealsEnabled } from "@/anim/onEnterView";
import { getMotionPrefs } from "@/anim/motion";
import { useSplitReveal } from "@/anim/useSplitReveal";

// ── Container ────────────────────────────────────────────────
export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

// ── Reveal on scroll (GSAP + ScrollTrigger) ──────────────────
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (getMotionPrefs().reduced) {
        gsap.set(el, { autoAlpha: 1, y: 0 });
        return;
      }
      if (!revealsEnabled()) return;
      // Al montar solo se oculta; el tween se arma cuando entra en pantalla.
      // Armar los ~60 juntos al cargar obligaba a GSAP a leer el estilo y la
      // transformación de cada uno en el peor momento.
      hideUntilEnter(el);
      let tween: gsap.core.Tween | null = null;
      const stop = onEnterView(el, () => {
        tween = gsap.fromTo(
          el,
          { y: 40, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.85,
            ease: "power3.out",
            delay: delay / 1000,
          }
        );
      });
      return () => {
        stop();
        tween?.kill();
      };
    },
    { scope: ref }
  );

  // Sin will-change fijo: con ~60 Reveal eran ~60 capas de GPU permanentes
  // (memoria y composición en celulares). GSAP sube la capa solo mientras anima.
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// ── Spotlight card (hover interactivo: luz que sigue el cursor + tilt 3D) ──
export function SpotlightCard({
  children,
  className,
  tilt = false,
  glow = "rgba(196,196,196,0.10)",
}: {
  children: ReactNode;
  className?: string;
  /** Inclinación 3D sutil siguiendo el puntero. */
  tilt?: boolean;
  /** Color del halo que sigue al cursor. */
  glow?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || getMotionPrefs().reduced) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      if (tilt) {
        el.style.setProperty("--rx", `${(0.5 - y / r.height) * 6}deg`);
        el.style.setProperty("--ry", `${(x / r.width - 0.5) * 6}deg`);
      }
    });
  };

  const onEnter = () => {
    const el = ref.current;
    if (!el || getMotionPrefs().reduced) return;
    el.style.setProperty("--ty", "-6px");
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--ty", "0px");
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      style={{
        transform:
          "perspective(900px) translateY(var(--ty,0px)) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))",
      }}
      className={cn(
        "glass group relative h-full overflow-hidden rounded-2xl transition-[transform,box-shadow,border-color] duration-300 ease-out hover:border-line-highlight hover:shadow-[0_28px_70px_-26px_rgba(0,0,0,0.7)]",
        className
      )}
    >
      {/* Halo que sigue al cursor */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(360px circle at var(--mx,50%) var(--my,50%), ${glow}, transparent 65%)`,
        }}
      />
      {/* Brillo de borde en hover */}
      <span className="pointer-events-none absolute inset-px rounded-2xl opacity-0 ring-1 ring-inset ring-accent-300/30 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

// ── Eyebrow chip ─────────────────────────────────────────────
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-card-border bg-card px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-300",
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent-400 shadow-[0_0_10px_2px_rgba(255,255,255,0.35)]" />
      {children}
    </span>
  );
}

// ── Section heading ──────────────────────────────────────────
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  const titleRef = useSplitReveal<HTMLHeadingElement>();
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "center"
          ? "mx-auto max-w-2xl items-center text-center"
          : // En mobile centramos; desde lg alineamos a la izquierda.
            "items-center text-center lg:items-start lg:text-left",
        className
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2
        ref={titleRef}
        className="mt-5 font-display text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-[2.85rem]"
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed text-slate-400 sm:text-lg",
            align === "center" ? "max-w-xl" : "max-w-2xl"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

// ── Button ───────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "ghost" | "whatsapp";
type ButtonSize = "md" | "lg";

// Principal: plata clara con texto negro. WhatsApp usa el mismo estilo (el
// verde queda solo en el ícono, que ya viene verde de WhatsAppIcon).
const CTA =
  "bg-cta text-brand-black shadow-[0_0_25px_rgba(255,255,255,0.10)] border border-cta hover:bg-white hover:border-white hover:-translate-y-0.5";

const variantClasses: Record<ButtonVariant, string> = {
  primary: CTA,
  secondary:
    "bg-card text-white border border-button-border hover:border-silver hover:bg-card-hover hover:-translate-y-0.5",
  whatsapp: `${CTA} font-semibold`,
  ghost: "text-slate-300 hover:bg-white/5 hover:text-white",
};

const sizeClasses: Record<ButtonSize, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-[15px]",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  target,
  rel,
  className,
  icon = false,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  onClick?: () => void;
  target?: string;
  rel?: string;
  className?: string;
  icon?: boolean;
  "aria-label"?: string;
}) {
  const classes = cn(
    "group relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  const inner = (
    <>
      {children}
      {icon ? (
        <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      ) : null}
    </>
  );

  const external = href && (href.startsWith("http") || href.startsWith("https"));

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        target={target}
        rel={rel ?? (external ? "noopener noreferrer" : undefined)}
        className={classes}
        aria-label={ariaLabel}
      >
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={classes} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}

// ── Brand mark ───────────────────────────────────────────────
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[image:var(--silver-gradient)] shadow-lg shadow-black/40",
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 text-brand-black"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="6" y="2.5" width="12" height="19" rx="3" />
        <path d="M10.5 18.5h3" />
      </svg>
      <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/25" />
    </span>
  );
}

// ── Decorative backgrounds ───────────────────────────────────
export function Background() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 bg-ink-950" />
      <div className="aurora" />
      {/* Brillos plata muy sutiles (antes azul/cian). */}
      <div className="absolute -left-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-silver/[0.05] blur-[120px]" />
      <div className="absolute -right-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-silver-light/[0.04] blur-[120px]" />
      <div className="absolute bottom-0 left-1/2 h-[26rem] w-[40rem] -translate-x-1/2 rounded-full bg-silver-dark/[0.06] blur-[130px]" />
    </div>
  );
}

export function Starfield({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("starfield pointer-events-none absolute inset-0", className)}
    />
  );
}


