import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/anim/gsap";
import { allowHeavy, getMotionPrefs } from "@/anim/motion";
import { Button, Container, Eyebrow, Reveal } from "@/components/ui";
import { WhatsAppIcon } from "@/components/icons";
import { cn } from "@/utils/cn";
import { slowNetwork } from "@/utils/network";
import { waProduct } from "@/data/site";
import {
  despieceDisclaimer,
  despieceHeading,
  despieceOutro,
  despieceSteps,
  type DespieceStep,
  type DespieceStepId,
} from "@/data/despiece";
import { OUTRO_START, STEP_WINDOWS, stepAt } from "@/three/despieceTimeline";
import { DESPIECE_MODEL } from "@/three/models";
import type { DespieceScene } from "@/three/despiece";
// Render del modelo desarmado: versión estática (sin WebGL o con
// "reducir movimiento") y reemplazo si el 3D falla a mitad de camino.
import despieceImg from "@/assets/iphone14pro-despiece.webp";

// ─────────────────────────────────────────────────────────────
//  Desarme del iPhone 14 Pro con el scroll. Va dentro de "El más llevado"
//  (PhoneDetail): ahí se ve el teléfono entero y, al seguir bajando, este
//  escenario entra con la pantalla ya separada y lo termina de desarmar.
//
//  - El escenario queda fijo (sticky) mientras el recorrido de 470svh pasa
//    por debajo; un solo timeline de GSAP con scrub maneja el progreso del
//    3D y los textos, así que hacia atrás todo se rearma solo.
//  - three.js y el modelo (3,3 MB, copia optimizada del maestro de 24 MB)
//    se bajan mientras la persona todavía está mirando "El más llevado".
//  - Con "reducir movimiento" el CSS muestra directamente la versión
//    estática (sin JS de por medio, sin salto de layout). Sin WebGL, lo
//    mismo pero decidido al montar.
//  - La sección que lo contiene tiene que pintarse normal (sin
//    content-visibility): ver PhoneDetail.
// ─────────────────────────────────────────────────────────────

type Mode = "interactive" | "static";
type Load = "idle" | "loading" | "ready" | "failed";

/** Nombre corto de cada paso (la etiqueta de la marca sobre la pieza). */
const STEP_LABEL: Record<DespieceStepId, string> = Object.fromEntries(
  despieceSteps.map((s) => [s.id, s.label])
) as Record<DespieceStepId, string>;

const IMG_ALT =
  "iPhone 14 Pro desarmado: pantalla, batería, cámaras, placa con el chip A16 y demás piezas separadas";

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") ?? c.getContext("webgl")) as
      | WebGLRenderingContext
      | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function Despiece() {
  const [mode, setMode] = useState<Mode>("interactive");
  const [load, setLoad] = useState<Load>("idle");
  const [loadPct, setLoadPct] = useState<number | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const markerLabelRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const sceneRef = useRef<DespieceScene | null>(null);
  /** Progreso actual (lo escribe el timeline, lo lee la escena al cargar). */
  const progressRef = useRef({ p: 0 });
  const stepRef = useRef<DespieceStepId | null>(null);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  // Sin WebGL no tiene sentido el recorrido largo: se decide al montar,
  // cuando la persona casi seguro está arriba de todo (sin saltos a la vista).
  // Con conexión lenta o ahorro de datos, lo mismo: el modelo pesa 3,2 MB.
  useEffect(() => {
    if (getMotionPrefs().reduced) return;
    if (slowNetwork() || !hasWebGL()) setMode("static");
  }, []);

  // Cambió el alto de la sección: recalcular los ScrollTrigger de abajo.
  useEffect(() => {
    if (mode === "static") ScrollTrigger.refresh();
  }, [mode]);

  /** Aplica el paso activo: indicador, marca sobre la pieza y escena. */
  const applyStep = (step: DespieceStepId | null) => {
    if (step === stepRef.current) return;
    stepRef.current = step;
    rootRef.current?.querySelectorAll<HTMLElement>("[data-step-chip]").forEach((el) => {
      el.dataset.active = String(el.dataset.stepChip === step);
    });
    if (markerLabelRef.current && step) markerLabelRef.current.textContent = STEP_LABEL[step];
    sceneRef.current?.setFocus(step ? STEP_WINDOWS[step].part : null);
  };

  // ── Timeline con scroll: progreso del 3D + textos ─────────────
  useGSAP(
    () => {
      if (mode !== "interactive" || getMotionPrefs().reduced) return;
      const track = trackRef.current;
      const root = rootRef.current;
      if (!track || !root) return;

      const q = gsap.utils.selector(root);
      const outro = q("[data-card='outro']");
      const state = progressRef.current;

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        scrollTrigger: {
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          // Con Lenis (desktop) el scroll ya viene suavizado.
          scrub: allowHeavy() ? 0.35 : 0.6,
          // Se crea antes que el pin de PhoneDetail (los efectos de los
          // hijos corren primero): que se mida después, con ese pin puesto.
          refreshPriority: -1,
        },
      });
      const st = tl.scrollTrigger!;
      triggerRef.current = st;

      // En celular las secciones de arriba se pintan recién al acercarse
      // (content-visibility en index.css) y hasta entonces miden 1000 px
      // estimados: cuando toman su alto real, esto se corre y el trigger
      // queda desfasado. Se recalcula solo si de verdad se movió.
      let settle = 0;
      const ro = new ResizeObserver(() => {
        window.clearTimeout(settle);
        settle = window.setTimeout(() => {
          const top = track.getBoundingClientRect().top + window.scrollY;
          if (Math.abs(top - st.start) > 1) st.refresh();
        }, 120);
      });
      ro.observe(document.body);

      tl.to(
        state,
        {
          p: 1,
          duration: 1,
          ease: "none",
          onUpdate: () => {
            sceneRef.current?.setProgress(state.p);
            applyStep(stepAt(state.p));
            if (barRef.current) barRef.current.style.transform = `scaleX(${state.p})`;
          },
        },
        0
      );
      // El primer paso ya está activo antes de que el trigger se mueva.
      applyStep(stepAt(state.p));

      // Las fichas de datos solo cambian la opacidad: los lectores de
      // pantalla las leen todas en orden. El cierre tiene un link, así que
      // ese sí se oculta del todo (autoAlpha) para no enfocarlo invisible.
      const FADE = 0.03;
      for (const s of despieceSteps) {
        const card = q(`[data-card='${s.id}']`);
        const w = STEP_WINDOWS[s.id];
        if (w.from > 0) {
          tl.fromTo(card, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: FADE }, w.from);
        }
        tl.to(card, { opacity: 0, y: -16, duration: FADE }, w.to - FADE);
      }
      tl.fromTo(
        outro,
        { autoAlpha: 0, y: 20 },
        { autoAlpha: 1, y: 0, duration: FADE },
        OUTRO_START
      );

      return () => {
        ro.disconnect();
        window.clearTimeout(settle);
        triggerRef.current = null;
        stepRef.current = null;
      };
    },
    { scope: rootRef, dependencies: [mode] }
  );

  // ── Carga diferida del 3D ─────────────────────────────────────
  useEffect(() => {
    if (mode !== "interactive" || getMotionPrefs().reduced) return;
    const track = trackRef.current;
    const view = viewRef.current;
    const canvas = canvasRef.current;
    if (!track || !view || !canvas) return;

    let cancelled = false;
    let ro: ResizeObserver | null = null;
    let scene: DespieceScene | null = null;

    const start = () => {
      setLoad("loading");
      import("@/three/despiece")
        .then(({ createDespieceScene }) =>
          createDespieceScene({
            canvas,
            url: DESPIECE_MODEL,
            pixelRatio: Math.min(window.devicePixelRatio || 1, allowHeavy() ? 2 : 1.5),
            onProgress: (r) => {
              if (!cancelled) setLoadPct(r == null ? null : Math.round(r * 100));
            },
            onFrame: ({ x, y, visible }) => {
              const m = markerRef.current;
              if (!m) return;
              m.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
              m.style.opacity = visible ? "1" : "0";
            },
            onContextLost: () => {
              if (!cancelled) setLoad("failed");
            },
          })
        )
        .then((s) => {
          if (cancelled) {
            s.dispose();
            return;
          }
          scene = s;
          sceneRef.current = s;
          const size = () => s.resize(view.clientWidth, view.clientHeight);
          size();
          ro = new ResizeObserver(size);
          ro.observe(view);
          s.setProgress(progressRef.current.p);
          const step = stepRef.current;
          s.setFocus(step ? STEP_WINDOWS[step].part : null);
          if (import.meta.env.DEV) {
            (window as unknown as { __despiece?: DespieceScene }).__despiece = s;
          }
          setLoad("ready");
        })
        .catch((err) => {
          console.warn("[Despiece] 3D sin cargar, muestro la imagen:", err);
          if (!cancelled) setLoad("failed");
        });
    };

    // Arranca con ~2,5 pantallas de anticipación: mientras se mira "El más
    // llevado", así al llegar el desarme ya está listo.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { rootMargin: "250% 0px 250% 0px" }
    );
    io.observe(track);

    return () => {
      cancelled = true;
      io.disconnect();
      ro?.disconnect();
      scene?.dispose();
      sceneRef.current = null;
      if (import.meta.env.DEV) {
        delete (window as unknown as { __despiece?: DespieceScene }).__despiece;
      }
    };
  }, [mode]);

  // Si el contexto WebGL se pierde, la escena ya no sirve: se libera.
  useEffect(() => {
    if (load !== "failed") return;
    sceneRef.current?.dispose();
    sceneRef.current = null;
  }, [load]);

  const goToStep = (id: DespieceStepId) => {
    const st = triggerRef.current;
    if (!st) return;
    const w = STEP_WINDOWS[id];
    const p = (w.from + w.to) / 2;
    window.scrollTo({ top: st.start + (st.end - st.start) * p, behavior: "smooth" });
  };

  return (
    <div id="por-dentro" ref={rootRef}>
      {mode === "interactive" ? (
        <div ref={trackRef} className="relative h-[470svh] motion-reduce:hidden">
          <div className="sticky top-0 h-[100svh] overflow-hidden">
            <div className="pointer-events-none absolute left-1/2 top-[45%] h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-600/15 blur-[110px] lg:left-[68%] lg:h-[36rem] lg:w-[36rem]" />

            <Container
              className={cn(
                "relative grid h-full gap-3",
                // Celular: arriba el header fijo (~100 px), abajo la barra
                // de "Ver modelos / WhatsApp" (~70 px).
                "grid-rows-[auto_minmax(0,1fr)_auto_auto] pb-[calc(4.9rem+env(safe-area-inset-bottom))] pt-[6.6rem]",
                "lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)_auto_auto_auto_minmax(0,1fr)] lg:gap-x-10 lg:gap-y-5 lg:pb-10 lg:pt-28"
              )}
            >
              {/* Título fijo */}
              <div className="flex items-center gap-2 lg:col-span-5 lg:row-start-2 lg:block">
                <Eyebrow>{despieceHeading.eyebrow}</Eyebrow>
                <span className="text-[11px] text-slate-500 lg:hidden">
                  iPhone 14 Pro · modelo ilustrativo
                </span>
                <h3 className="sr-only mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-tight text-white lg:not-sr-only lg:block xl:text-[2.6rem]">
                  {despieceHeading.title}
                </h3>
              </div>

              {/* 3D */}
              <div
                ref={viewRef}
                className="relative min-h-0 lg:col-span-7 lg:col-start-6 lg:row-span-5 lg:row-start-1"
              >
                <canvas
                  ref={canvasRef}
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 h-full w-full transition-opacity duration-700",
                    load === "ready" ? "opacity-100" : "opacity-0"
                  )}
                />

                {load === "failed" ? (
                  <img
                    src={despieceImg}
                    alt={IMG_ALT}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : null}

                {load === "idle" || load === "loading" ? <Loader pct={loadPct} /> : null}

                {/* Marca sobre la pieza del paso activo */}
                <div
                  ref={markerRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 opacity-0 transition-opacity duration-300"
                >
                  <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full border-2 border-white/90 bg-accent-500/50 shadow-[0_0_18px_4px_rgba(46,123,255,0.55)]" />
                  <span className="absolute -left-2 -top-2 h-4 w-4 animate-ping rounded-full bg-accent-400/40 motion-reduce:hidden" />
                  <span
                    ref={markerLabelRef}
                    className="absolute left-4 top-0 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/15 bg-ink-900/80 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md"
                  />
                </div>
              </div>

              {/* Fichas: se reemplazan una a otra con el scroll. Van todas en
                  la misma celda de la grilla, así el bloque mide lo que la
                  más alta y ninguna se sale ni pisa los pasos. */}
              <div className="grid lg:col-span-5 lg:row-start-3">
                {despieceSteps.map((s, i) => (
                  <StepCard key={s.id} step={s} index={i} visible={i === 0} />
                ))}
                <div data-card="outro" className="invisible col-start-1 row-start-1 opacity-0">
                  <p className="font-display text-xl font-semibold leading-tight text-white lg:text-3xl">
                    {despieceOutro.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400 lg:text-base">
                    {despieceOutro.text}
                  </p>
                  <Button
                    href={waProduct("iPhone 14 Pro")}
                    target="_blank"
                    variant="whatsapp"
                    className="mt-4"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    {despieceOutro.cta}
                  </Button>
                </div>
              </div>

              {/* Pasos + avance */}
              <div className="lg:col-span-5 lg:row-start-4">
                <div className="flex gap-1.5" role="group" aria-label="Ir a una pieza">
                  {despieceSteps.map((s, i) => (
                    <button
                      key={s.id}
                      type="button"
                      data-step-chip={s.id}
                      data-active={i === 0 ? "true" : "false"}
                      onClick={() => goToStep(s.id)}
                      className="flex-1 cursor-pointer rounded-full border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[11px] font-medium text-slate-400 transition-colors duration-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60 data-[active=true]:border-accent-400/50 data-[active=true]:bg-accent-500/20 data-[active=true]:text-white sm:text-xs"
                    >
                      <span className="hidden text-slate-500 sm:inline">0{i + 1} </span>
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2.5 h-0.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    ref={barRef}
                    className="h-full origin-left scale-x-0 rounded-full bg-gradient-to-r from-accent-400 to-cyan-glow"
                  />
                </div>
                <p className="mt-2 hidden text-xs text-slate-500 lg:block">{despieceDisclaimer}</p>
              </div>
            </Container>
          </div>
        </div>
      ) : null}

      <StaticDespiece className={mode === "static" ? "block" : "hidden motion-reduce:block"} />
    </div>
  );
}

function StepCard({
  step,
  index,
  visible,
}: {
  step: DespieceStep;
  index: number;
  /** El primer paso ya se ve al entrar (arranca con la pantalla separada). */
  visible: boolean;
}) {
  return (
    <div data-card={step.id} className={cn("col-start-1 row-start-1", !visible && "opacity-0")}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-300">
        0{index + 1} · {step.label}
      </p>
      <p className="mt-1.5 font-display text-xl font-semibold leading-tight text-white sm:text-2xl lg:mt-2 lg:text-[2rem]">
        {step.title}
      </p>
      <ul className="mt-2 space-y-1 text-[13px] leading-snug text-slate-300 sm:text-sm lg:mt-4 lg:space-y-2 lg:text-base">
        {step.points.map((pt, i) => (
          <li
            key={pt}
            className={cn(
              "flex gap-2",
              // Celulares bajitos: solo los dos primeros datos.
              i > 1 && "max-lg:[@media(max-height:700px)]:hidden"
            )}
          >
            <span className="mt-[0.45em] h-1 w-1 shrink-0 rounded-full bg-accent-400" />
            {pt}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Loader({ pct }: { pct: number | null }) {
  return (
    <div
      role="status"
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400"
    >
      <span className="relative h-10 w-10">
        <span className="absolute inset-0 rounded-full border-2 border-white/10" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent-400" />
      </span>
      <span className="text-xs tabular-nums">
        {pct === 100
          ? "Preparando modelo 3D…" // bajó; falta compilar los materiales
          : `Cargando modelo 3D${pct != null ? ` · ${pct} %` : "…"}`}
      </span>
    </div>
  );
}

/** Versión sin animación: imagen del modelo desarmado y las cuatro fichas. */
function StaticDespiece({ className }: { className?: string }) {
  return (
    <div className={cn("pt-16 sm:pt-24", className)}>
      <Container>
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <Eyebrow>{despieceHeading.eyebrow}</Eyebrow>
            <h3 className="mt-5 font-display text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl">
              {despieceHeading.title}
            </h3>
          </div>
        </Reveal>
        <div className="mt-12 grid items-center gap-10 lg:grid-cols-12">
          <figure className="lg:col-span-6">
            <img
              src={despieceImg}
              alt={IMG_ALT}
              loading="lazy"
              decoding="async"
              width={1200}
              height={1200}
              className="mx-auto h-auto w-full max-w-lg"
            />
            <figcaption className="mt-3 text-center text-xs text-slate-500">
              {despieceDisclaimer}
            </figcaption>
          </figure>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-6">
            {despieceSteps.map((s, i) => (
              <div key={s.id} className="glass rounded-2xl p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-300">
                  0{i + 1} · {s.label}
                </p>
                <p className="mt-2 font-display text-xl font-semibold text-white">{s.title}</p>
                <ul className="mt-3 space-y-1.5 text-sm leading-snug text-slate-400">
                  {s.points.map((pt) => (
                    <li key={pt} className="flex gap-2">
                      <span className="mt-[0.45em] h-1 w-1 shrink-0 rounded-full bg-accent-400" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <p className="max-w-xl text-slate-400">
            <span className="font-semibold text-white">{despieceOutro.title}.</span>{" "}
            {despieceOutro.text}
          </p>
          <Button href={waProduct("iPhone 14 Pro")} target="_blank" variant="whatsapp">
            <WhatsAppIcon className="h-5 w-5" />
            {despieceOutro.cta}
          </Button>
        </div>
      </Container>
    </div>
  );
}
