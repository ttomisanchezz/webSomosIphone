import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/utils/cn";
import { PhoneMockup } from "@/components/PhoneMockup";
import { ScrollTrigger } from "@/anim/gsap";
import { allowHeavy, getMotionPrefs } from "@/anim/motion";
import type { Engine } from "@/three/engine";

// Este archivo NO importa three.js: el motor (engine.ts) se baja aparte
// después del primer render, así el texto de la página no lo espera.

const BASE_ROT_Y = -0.6;
const BASE_ROT_X = 0.08;

export interface ViewState {
  id: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  interactive: boolean;
  color: string;
  visible: boolean;
  /** Si false, la vista queda en un ángulo fijo (showcase) sin giro automático. */
  autoSpin: boolean;
  /** Flota arriba y abajo. Las cards quietas en celular no flotan. */
  float: boolean;
  /** Si false, no se tinta el color (se respeta el color nativo del modelo). */
  tint: boolean;
  /** Algo cambió y hay que volver a dibujarla aunque esté quieta. */
  dirty: boolean;
  /** De fondo (priority "idle"): se redibuja a un tercio de la frecuencia. */
  background: boolean;
  /** Momento del último dibujo (segundos del reloj del motor). */
  lastDraw: number;
  rotY: number;
  rotX: number;
  targetRotY: number;
  targetRotX: number;
  velX: number;
  dragging: boolean;
  prevX: number;
  prevY: number;
  floatPhase: number;
  /** Rotación extra ligada al scroll (radianes). */
  scrollSpin: number;
  /** URL del modelo .glb a usar ("" = iPhone procedural placeholder). */
  modelKey: string;
  cleanup: () => void;
}

/**
 * "eager" baja el .glb apenas la vista entra en pantalla. "idle" lo encola y
 * espera a que la página termine de pintar: sirve para los modelos que están
 * a la vista pero no son el protagonista (los laterales del carrusel del
 * hero, que se ven chicos, borrosos y de costado).
 */
export type ModelPriority = "eager" | "idle";

interface StageApi {
  register: (
    canvas: HTMLCanvasElement,
    opts: {
      interactive: boolean;
      color: string;
      model?: string;
      /** false = vista showcase fija (sin giro). Default true. */
      spin?: boolean;
      /** Rotación Y inicial (radianes). Default BASE_ROT_Y. */
      baseRotY?: number;
      /** false = no tinta (respeta el color nativo del modelo). Default true. */
      tint?: boolean;
      /** "idle" difiere la descarga del .glb hasta que la pagina pinto. */
      priority?: ModelPriority;
    }
  ) => number | null;
  unregister: (id: number) => void;
  setColor: (id: number, color: string) => void;
  setScrollSpin: (id: number, spin: number) => void;
}

const StageContext = createContext<StageApi | null>(null);
const ReadyContext = createContext<boolean>(true);

/**
 * Llama a `cb` cuando el navegador ya mostró la primera pantalla con
 * contenido (y después, cuando el hilo principal queda libre). Los que no
 * informan el primer pintado (Safari viejo) esperan dos frames. Por las
 * dudas, arranca igual a los 2,5 s. Devuelve una función para cancelar.
 */
function afterFirstPaint(cb: () => void): () => void {
  let done = false;
  let obs: PerformanceObserver | undefined;
  const run = () => {
    if (done) return;
    done = true;
    obs?.disconnect();
    window.clearTimeout(fallback);
    cb();
  };
  const whenIdle = () => {
    const ric = window.requestIdleCallback;
    if (ric) ric(run, { timeout: 800 });
    else window.setTimeout(run, 100);
  };
  const fallback = window.setTimeout(run, 2500);
  const supportsPaint =
    typeof PerformanceObserver !== "undefined" &&
    PerformanceObserver.supportedEntryTypes?.includes("paint");
  if (supportsPaint) {
    obs = new PerformanceObserver((list) => {
      if (list.getEntriesByName("first-contentful-paint").length) {
        obs?.disconnect();
        whenIdle();
      }
    });
    obs.observe({ type: "paint", buffered: true });
  } else {
    requestAnimationFrame(() => requestAnimationFrame(whenIdle));
  }
  return () => {
    done = true;
    obs?.disconnect();
    window.clearTimeout(fallback);
  };
}

export function PhoneStageProvider({ children }: { children: ReactNode }) {
  const viewsRef = useRef<Map<number, ViewState>>(new Map());
  const idRef = useRef(0);
  const activeDragRef = useRef<ViewState | null>(null);
  const apiRef = useRef<StageApi | null>(null);
  const engineRef = useRef<Engine | null>(null);
  // Modelos pedidos antes de que llegue el motor: se le pasan al arrancar.
  const pendingRef = useRef<Map<string, ModelPriority>>(new Map());

  const [ready, setReady] = useState(true);

  if (!apiRef.current) {
    const ensureModel = (url: string, priority: ModelPriority = "eager") => {
      if (engineRef.current) {
        engineRef.current.ensureModel(url, priority);
        return;
      }
      if (pendingRef.current.get(url) !== "eager") {
        pendingRef.current.set(url, priority);
      }
    };

    apiRef.current = {
      register(canvas, opts) {
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        const id = ++idRef.current;
        const baseRotY = opts.baseRotY ?? BASE_ROT_Y;
        const autoSpin = opts.spin ?? true;
        const view: ViewState = {
          id,
          canvas,
          ctx,
          interactive: opts.interactive,
          color: opts.color,
          visible: false,
          autoSpin,
          // Las cards (showcase) flotan solo en desktop: en celular se dibujan
          // una vez y quedan quietas hasta que cambie algo.
          float: autoSpin || allowHeavy(),
          tint: opts.tint ?? true,
          dirty: true,
          background: opts.priority === "idle",
          lastDraw: 0,
          rotY: baseRotY,
          rotX: BASE_ROT_X,
          targetRotY: baseRotY,
          targetRotX: BASE_ROT_X,
          velX: 0,
          dragging: false,
          prevX: 0,
          prevY: 0,
          floatPhase: Math.random() * Math.PI * 2,
          scrollSpin: 0,
          modelKey: opts.model ?? "",
          cleanup: () => {},
        };

        // El tamaño sale del propio ResizeObserver (que además avisa apenas
        // se observa). Medir con getBoundingClientRect y después escribir
        // canvas.width, canvas por canvas, forzaba un layout por cada uno.
        const ro = new ResizeObserver((entries) => {
          const r = entries[entries.length - 1].contentRect;
          // En mobile bajamos la resolución del canvas para aliviar GPU/memoria.
          const maxDpr = getMotionPrefs().isMobile ? 1.5 : 2;
          const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
          const w = Math.max(1, Math.round(r.width * dpr));
          const h = Math.max(1, Math.round(r.height * dpr));
          // Cambiar el tamaño borra el canvas: hay que redibujar.
          if (canvas.width !== w || canvas.height !== h) view.dirty = true;
          if (canvas.width !== w) canvas.width = w;
          if (canvas.height !== h) canvas.height = h;
        });
        ro.observe(canvas);

        const io = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              view.visible = e.isIntersecting;
              // El .glb se baja recien cuando la card se acerca. Antes se
              // descargaban los 11 modelos del catalogo (~6 MB) apenas
              // montaba la seccion, aunque estuviera lejos del fold.
              if (e.isIntersecting) ensureModel(view.modelKey, opts.priority);
            }
          },
          { rootMargin: "300px 0px" }
        );
        io.observe(canvas);

        let onDown: ((e: PointerEvent) => void) | null = null;
        if (opts.interactive) {
          onDown = (e: PointerEvent) => {
            view.dragging = true;
            view.prevX = e.clientX;
            view.prevY = e.clientY;
            view.velX = 0;
            activeDragRef.current = view;
            try {
              canvas.setPointerCapture(e.pointerId);
            } catch {
              /* ignore */
            }
            canvas.style.cursor = "grabbing";
          };
          canvas.addEventListener("pointerdown", onDown);
          canvas.style.cursor = "grab";
          canvas.style.touchAction = "pan-y";
        }

        view.cleanup = () => {
          ro.disconnect();
          io.disconnect();
          if (onDown) canvas.removeEventListener("pointerdown", onDown);
        };

        viewsRef.current.set(id, view);
        return id;
      },
      unregister(id) {
        const v = viewsRef.current.get(id);
        if (v) {
          v.cleanup();
          if (activeDragRef.current === v) activeDragRef.current = null;
          viewsRef.current.delete(id);
        }
      },
      setColor(id, color) {
        const v = viewsRef.current.get(id);
        if (v && v.color !== color) {
          v.color = color;
          v.dirty = true;
        }
      },
      setScrollSpin(id, spin) {
        const v = viewsRef.current.get(id);
        if (v) {
          v.scrollSpin = spin;
          v.dirty = true;
        }
      },
    };
  }

  // Arranca el motor 3D recién cuando la primera pantalla ya se mostró: crear
  // el contexto WebGL traba el hilo principal y la GPU, y si pasaba antes del
  // primer pintado el texto del hero aparecía tarde. El chunk empieza a bajar
  // ya, en paralelo. Si no baja (red caída) o no hay WebGL, las vistas caen
  // al mockup SVG.
  useEffect(() => {
    let cancelled = false;
    const enginePromise = import("@/three/engine");
    const fail = (err: unknown) => {
      console.warn("[PhoneStage] no se pudo cargar el motor 3D:", err);
      if (!cancelled) setReady(false);
    };
    enginePromise.catch(fail);

    const stopWaiting = afterFirstPaint(() => {
      enginePromise
        .then(({ createEngine }) => {
          if (cancelled) return;
          const engine = createEngine(viewsRef.current, activeDragRef);
          if (!engine) {
            setReady(false);
            return;
          }
          engineRef.current = engine;
          for (const [url, priority] of pendingRef.current) {
            engine.ensureModel(url, priority);
          }
          pendingRef.current.clear();
        })
        .catch(() => {}); // ya lo reporta fail()
    });
    return () => {
      cancelled = true;
      stopWaiting();
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <StageContext.Provider value={apiRef.current}>
      <ReadyContext.Provider value={ready}>{children}</ReadyContext.Provider>
    </StageContext.Provider>
  );
}

export function usePhoneStage(): StageApi | null {
  return useContext(StageContext);
}

/**
 * Visor del iPhone 3D. Ocupa todo su contenedor. Pasale el color HEX a mostrar.
 * Si no hay WebGL, cae a un mockup SVG.
 */
export function PhoneViewport({
  color,
  interactive = false,
  scrollScrub = false,
  showcase = false,
  tint = true,
  model,
  priority,
  className,
  fallbackView = "back",
}: {
  color: string;
  interactive?: boolean;
  /** El iPhone gira ligado al progreso de scroll de su sección. */
  scrollScrub?: boolean;
  /** Vista "foto de producto": dorso fijo en 3/4, sin giro (ideal para cards). */
  showcase?: boolean;
  /** false = respeta el color nativo del modelo (no tinta). Default true. */
  tint?: boolean;
  /** URL del modelo .glb a mostrar (sino, iPhone procedural). */
  model?: string;
  /** "idle" difiere la descarga del .glb hasta que la pagina pinto. */
  priority?: ModelPriority;
  className?: string;
  fallbackView?: "front" | "back";
}) {
  const stage = usePhoneStage();
  const ready = useContext(ReadyContext);
  const ref = useRef<HTMLCanvasElement>(null);
  const idRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stage || !ref.current) return;
    // 3/4 trasero: muestra el dorso (donde vive el color) levemente angulado.
    const SHOWCASE_ROT_Y = Math.PI - 0.55;
    // Los .glb ahora están comprimidos (~0.1–0.6 MB) → se usan también en mobile.
    const id = stage.register(ref.current, {
      interactive,
      color,
      model,
      priority,
      tint,
      spin: showcase ? false : undefined,
      baseRotY: showcase ? SHOWCASE_ROT_Y : undefined,
    });
    idRef.current = id;
    return () => {
      if (id != null) stage.unregister(id);
      idRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, interactive, model, priority, showcase, tint]);

  useEffect(() => {
    if (stage && idRef.current != null) stage.setColor(idRef.current, color);
  }, [color, stage]);

  // Rotación ligada al scroll (solo desktop/sin reduced-motion).
  useEffect(() => {
    const el = ref.current;
    if (!stage || !el || !scrollScrub || !allowHeavy()) return;
    const SPIN = Math.PI * 1.3;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        if (idRef.current != null) {
          stage.setScrollSpin(idRef.current, self.progress * SPIN);
        }
      },
    });
    return () => st.kill();
  }, [stage, scrollScrub]);

  if (!ready) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        aria-hidden={!interactive}
      >
        <PhoneMockup color={color} view={fallbackView} glow="#c4c4c4" />
      </div>
    );
  }

  return (
    <canvas
      ref={ref}
      // Arranca invisible: el motor lo muestra con un fundido cuando el
      // modelo ya bajó y compiló (sin saltos del placeholder al real).
      className={cn(
        "block h-full w-full opacity-0 transition-opacity duration-500",
        className
      )}
      role={interactive ? "img" : undefined}
      aria-label={
        interactive ? "iPhone en 3D — arrastrá para girarlo" : undefined
      }
      aria-hidden={interactive ? undefined : true}
    />
  );
}
