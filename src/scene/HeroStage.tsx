import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { allowMotion, getMotionPrefs } from "@/anim/motion";
import type { Layer } from "./floatingPhones";
import { ColorBends } from "@/components/ColorBends";
import { HeroSides, HeroWordmark } from "./HeroCopy";
import { loadSequence, onAnyFrame, pickVariant, SEQUENCES, type Variant } from "./frames";
import { afterLoadIdle, slowNetwork } from "@/utils/network";

type Focus = "camara" | "cartel";

/**
 * iPhones de la portada en celular: capturas de la capa 3D (mismos equipos,
 * lugar y tamaño que dibuja floatingPhones en celular). x/y = centro en % de
 * la pantalla, h = alto en % del alto de pantalla. En la escena 3D esas
 * proporciones no dependen del ancho del celular, así que calzan igual.
 */
const MOBILE_PHONES = [
  { src: "/media/hero/iphone17promax.webp", w: 333, h: 657, x: 12.5, y: 28.08, height: 32.69, delay: "0s", dur: "6.5s" },
  { src: "/media/hero/iphone17.webp", w: 174, h: 346, x: 36.33, y: 10.25, height: 17.21, delay: "-2.4s", dur: "7.5s" },
];

/** Foto recortada de Fran y Tomi y puntos de foco (0..1 de la imagen). */
export const DUO = {
  src: "/media/hero/avatares.webp",
  width: 817,
  height: 896,
  focus: { camara: [0.909, 0.251], cartel: [0.359, 0.502] } as Record<"camara" | "cartel", [number, number]>,
};

export interface HeroStageHandle {
  /** focus: a dónde apunta el zoom; z: 0 = portada, 1 = zoom completo (negro). */
  setZoom: (focus: "camara" | "cartel", z: number, intro: number) => void;
}

/**
 * Recorte (x, y, ancho, alto en 0..1 de la imagen de los avatares) que coincide
 * con el primer cuadro de cada video del zoom. El zoom con código lleva la
 * portada justo a ese encuadre y ahí se funde con el video.
 */
const CROPS: Record<Focus, Record<Variant, [number, number, number, number]>> = {
  camara: { mobile: [0.716, -0.0357, 0.367, 0.5949], desktop: [0.5141, 0.0859, 0.6854, 0.3516] },
  cartel: { mobile: [0.1261, 0.125, 0.4651, 0.7545], desktop: [-0.0122, 0.2958, 0.7589, 0.3895] },
};
/** Tramos del zoom (0..1): hasta HANDOFF zoom con código; después, el video. */
const HANDOFF = 0.35;
const FADE = 0.08;

type Box = { x: number; y: number; w: number; h: number };

/** Escenario fijo: fondo con colores + iPhones 3D + avatares de Fran y Tomi. */
export const HeroStage = forwardRef<HeroStageHandle>(function HeroStage(_, ref) {
  const zoomRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLCanvasElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const layers = useRef<Layer[]>([]);
  const frames = useRef<Partial<Record<Focus, HTMLImageElement[]>>>({});
  const lastFrame = useRef("");

  // Escena tapada por el video del zoom o fuera de pantalla: las bandas del
  // fondo y los beneficios flotantes dejan de animarse (en PC las bandas se
  // repintan y desenfocan en cada frame).
  const covered = useRef(false);
  const offscreen = useRef(false);
  const syncPaused = () => {
    rootRef.current?.classList.toggle("hero-paused", covered.current || offscreen.current);
  };

  // Caja de la imagen de los avatares, medida sin zoom (se recalcula al cambiar el tamaño).
  const imgBox = useRef<Box | null>(null);
  const measure = () => {
    const zoom = zoomRef.current, img = imgRef.current;
    if (!zoom || !img) return;
    const prev = zoom.style.transform;
    zoom.style.transform = "none";
    const zr = zoom.getBoundingClientRect(), ir = img.getBoundingClientRect();
    zoom.style.transform = prev;
    imgBox.current = { x: ir.left - zr.left, y: ir.top - zr.top, w: ir.width, h: ir.height };
  };

  // Último cuadro pedido: si todavía no había llegado, se redibuja cuando llega.
  const wantedFrame = useRef<{ focus: Focus; i: number } | null>(null);

  const ensureFrames = (f: Focus) => {
    frames.current[f] ??= loadSequence(f, pickVariant(f));
  };

  const drawFrame = (focus: Focus, i: number) => {
    wantedFrame.current = { focus, i };
    const c = videoRef.current;
    const list = frames.current[focus];
    if (!c || !list) return;
    let img: HTMLImageElement | undefined;
    for (let d = 0; d < list.length && !img; d++) {
      for (const j of [i - d, i + d]) {
        const f = list[j];
        if (f && f.complete && f.naturalWidth) { img = f; break; }
      }
    }
    if (!img) return;
    const key = `${focus}:${img.src}:${c.width}`;
    if (key === lastFrame.current) return;
    lastFrame.current = key;
    const ctx = c.getContext("2d")!;
    const k = Math.max(c.width / img.naturalWidth, c.height / img.naturalHeight);
    const w = img.naturalWidth * k, h = img.naturalHeight * k;
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
  };

  useImperativeHandle(ref, () => ({
    setZoom(focus, z, intro) {
      const zoom = zoomRef.current;
      if (!zoom) return;
      if (!imgBox.current) measure();
      const box = imgBox.current;
      if (!box) return;
      const W = zoom.offsetWidth, H = zoom.offsetHeight;
      // Por si se llegó al zoom sin evento de scroll (link a un ancla, recarga
      // a mitad de página); y los del cartel, a mitad del primer zoom.
      if (z > 0) ensureFrames(focus);
      if (focus === "camara" && z >= 0.5) ensureFrames("cartel");
      const variant = pickVariant(focus);
      const [cx, cy, cw, ch] = CROPS[focus][variant];
      // recorte del video en px del escenario
      const crop = { x: box.x + cx * box.w, y: box.y + cy * box.h, w: cw * box.w, h: ch * box.h };
      const fx = crop.x + crop.w / 2, fy = crop.y + crop.h / 2;
      const target = Math.max(W / crop.w, H / crop.h); // escala que hace que el recorte cubra la pantalla

      // 1) zoom con código hasta el encuadre del video
      const u = Math.min(1, z / HANDOFF);
      const e = u * u * (3 - 2 * u);
      const S = Math.pow(target, e);
      const px = fx + (W / 2 - fx) * e, py = fy + (H / 2 - fy) * e;
      zoom.style.transformOrigin = "0 0";
      zoom.style.transform = z > 0 ? `translate(${px - fx * S}px, ${py - fy * S}px) scale(${S})` : "none";

      // 2) fundido al video y 3) el video avanza con el scroll
      const v = videoRef.current;
      const vOp = Math.min(1, Math.max(0, (z - (HANDOFF - FADE)) / FADE));
      if (v) {
        v.style.opacity = String(vOp);
        if (vOp > 0) {
          const t = Math.max(0, (z - HANDOFF) / (1 - HANDOFF));
          drawFrame(focus, Math.round(t * (SEQUENCES[focus].frames - 1)));
        } else wantedFrame.current = null;
      }
      covered.current = vOp >= 1;
      syncPaused();
      const black = Math.min(1, Math.max(0, (z - 0.9) / 0.1));
      if (blackRef.current) blackRef.current.style.opacity = String(black);
      if (introRef.current) {
        introRef.current.style.opacity = String(Math.max(0, 1 - intro * 2.5));
        introRef.current.style.pointerEvents = intro > 0.2 ? "none" : "auto";
      }
      for (const l of layers.current) l.setActive(vOp < 1);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    const mobile = getMotionPrefs().isMobile;
    // Crear el WebGL y calcular el reflejo traba el hilo principal: se hace
    // cuando el navegador queda libre, no en medio de la hidratación.
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
    // Con conexión lenta o ahorro de datos, la mitad de los equipos y sin capa delantera.
    const slow = slowNetwork();
    const startLayers = () => {
      // El import trae three.js (~170 KB gzip): en celular se pide recién acá.
      const layersModule = import("./floatingPhones");
      ric(() => {
        layersModule.then(({ createLayer, BACK_SLOTS, FRONT_SLOTS }) => {
          if (cancelled) return;
          const back = slow ? BACK_SLOTS.slice(0, 4) : BACK_SLOTS;
          const b = backRef.current && createLayer(backRef.current, back, { mobile });
          // En celular no hay capa delantera: taparía a Fran y Tomi en una pantalla angosta.
          const f = !mobile && !slow && frontRef.current && createLayer(frontRef.current, FRONT_SLOTS, { mobile });
          layers.current = [b, f].filter(Boolean) as Layer[];
        });
      }, { timeout: 1500 });
    };
    // En celular no hay iPhones 3D: van como imagen (MOBILE_PHONES). Crear
    // el WebGL, el reflejo y compilar los shaders congelaba la página justo
    // en el primer scroll.
    if (!mobile) startLayers();
    const onMove = (e: PointerEvent) => {
      if (!allowMotion()) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      for (const l of layers.current) l.setPointer(x, y);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    // Frames de los videos del zoom (bajan después del primer render).
    const sizeVideo = () => {
      const c = videoRef.current;
      if (!c) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = Math.round(window.innerWidth * dpr);
      c.height = Math.round(window.innerHeight * dpr);
      lastFrame.current = "";
    };
    sizeVideo();
    // Los cuadros del zoom a la cámara arrancan con el primer scroll. En PC,
    // además, cuando la página terminó de cargar (junto con los del cartel).
    // En celular no: son ~2 MB de datos móviles que quien no scrollea nunca
    // ve; los del cartel se piden desde setZoom, a mitad del primer zoom.
    const startFrames = () => {
      window.removeEventListener("scroll", startFrames);
      ensureFrames("camara");
    };
    window.addEventListener("scroll", startFrames, { passive: true });
    const cancelIdle = mobile || slowNetwork() ? () => {} : afterLoadIdle(() => {
      startFrames();
      ensureFrames("cartel");
    });
    let redraw = 0;
    const stopListening = onAnyFrame(() => {
      if (redraw || !wantedFrame.current) return;
      redraw = requestAnimationFrame(() => {
        redraw = 0;
        const w = wantedFrame.current;
        if (w) drawFrame(w.focus, w.i);
      });
    });
    // Escena fuera de pantalla: se pausan las animaciones CSS del fondo.
    const io = new IntersectionObserver(([e]) => {
      offscreen.current = !e.isIntersecting;
      syncPaused();
    });
    if (rootRef.current) io.observe(rootRef.current);
    const onResize = () => { imgBox.current = null; sizeVideo(); };
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", startFrames);
      cancelIdle();
      stopListening();
      cancelAnimationFrame(redraw);
      io.disconnect();
      layers.current.forEach((l) => l.dispose());
      layers.current = [];
    };
  }, []);

  return (
    <div ref={rootRef} className="relative h-dvh w-full overflow-hidden bg-ink-950">
      <div ref={zoomRef} className="absolute inset-0 will-change-transform">
        {/* Fondo: los colores en movimiento del home anterior */}
        <ColorBends />
        <canvas ref={backRef} className="absolute inset-0 h-full w-full max-lg:hidden" aria-hidden="true" />
        {/* Celular: los iPhones como imagen, flotando con CSS (sin WebGL). */}
        <div className="pointer-events-none absolute inset-0 lg:hidden" aria-hidden="true">
          {MOBILE_PHONES.map((p) => (
            <img
              key={p.src}
              src={p.src}
              width={p.w}
              height={p.h}
              alt=""
              decoding="async"
              draggable={false}
              className="hero-phone absolute w-auto max-w-none -translate-x-1/2 -translate-y-1/2 select-none"
              style={{ left: `${p.x}%`, top: `${p.y}%`, height: `${p.height}%`, animationDelay: p.delay, animationDuration: p.dur }}
            />
          ))}
        </div>
        <HeroWordmark />
        {/* Fran y Tomi en el centro */}
        <div className="absolute bottom-[27svh] left-1/2 h-[min(52svh,calc(73svh-180px))] w-full -translate-x-1/2 lg:bottom-0 lg:h-[74svh] lg:w-[46vw]">
          <div className="absolute bottom-[8%] left-1/2 h-[70%] w-[90%] -translate-x-1/2 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(196,196,196,.16), transparent)" }} />
          {/* El brillo del contorno va en este contenedor y el fundido de los
              pies en la imagen. Con los dos en la imagen, la máscara recortaba
              el brillo en los bordes de la foto y se veía un rectángulo gris
              detrás de ellos. */}
          <div className="absolute inset-0" style={{ filter: "drop-shadow(0 0 24px rgba(196,196,196,.28)) drop-shadow(0 0 2px rgba(255,255,255,.35))" }}>
            <img
              ref={imgRef}
              src={DUO.src}
              width={DUO.width}
              height={DUO.height}
              alt="Avatares 3D de Tomi y Fran de Somos iPhone NQN: Tomi con un cartel que dice Aceptamos cuotas y Fran mostrando un iPhone"
              fetchPriority="high"
              className="absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 select-none object-contain"
              style={{ maskImage: "linear-gradient(to top, transparent 0%, black 12%)", WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 12%)" }}
              draggable={false}
            />
          </div>
        </div>
        <canvas ref={frontRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
      </div>
      <canvas ref={videoRef} className="pointer-events-none absolute inset-0 h-full w-full opacity-0" aria-hidden="true" />
      {/* Textos alrededor de ellos */}
      <div ref={introRef} className="absolute inset-0 z-10">
        <HeroSides />
      </div>
      <div ref={blackRef} className="pointer-events-none absolute inset-0 z-20 bg-[var(--bg-main)] opacity-0" />
    </div>
  );
});
