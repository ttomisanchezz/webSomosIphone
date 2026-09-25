import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { allowMotion, getMotionPrefs } from "@/anim/motion";
import type { Layer } from "./floatingPhones";
import { ColorBends } from "@/components/ColorBends";
import { HeroSides, HeroWordmark } from "./HeroCopy";

/** Foto recortada de Fran y Tomi y puntos de foco (0..1 de la imagen). */
export const DUO = {
  src: "/media/hero/duo.webp",
  width: 960,
  height: 982,
  focus: { camara: [0.589, 0.418], cartel: [0.242, 0.387] } as Record<"camara" | "cartel", [number, number]>,
};

export interface HeroStageHandle {
  /** focus: a dónde apunta el zoom; z: 0 = portada, 1 = zoom completo (negro). */
  setZoom: (focus: "camara" | "cartel", z: number, intro: number) => void;
}

const MAX_SCALE = 7;

/** Escenario fijo: fondo futurista + iPhones 3D + Fran y Tomi. */
export const HeroStage = forwardRef<HeroStageHandle>(function HeroStage(_, ref) {
  const zoomRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const layers = useRef<Layer[]>([]);

  // Foco medido con el escenario sin zoom (se recalcula al cambiar el tamaño).
  const origin = useRef<Record<"camara" | "cartel", [number, number]> | null>(null);
  const measure = () => {
    const zoom = zoomRef.current, img = imgRef.current;
    if (!zoom || !img) return;
    const prev = zoom.style.transform;
    zoom.style.transform = "none";
    const zr = zoom.getBoundingClientRect(), ir = img.getBoundingClientRect();
    zoom.style.transform = prev;
    const at = (f: [number, number]): [number, number] => [ir.left - zr.left + f[0] * ir.width, ir.top - zr.top + f[1] * ir.height];
    origin.current = { camara: at(DUO.focus.camara), cartel: at(DUO.focus.cartel) };
  };

  useImperativeHandle(ref, () => ({
    setZoom(focus, z, intro) {
      const zoom = zoomRef.current;
      if (!zoom) return;
      if (!origin.current) measure();
      if (!origin.current) return;
      const [ox, oy] = origin.current[focus];
      const e = z * z * (3 - 2 * z);
      const s = Math.pow(MAX_SCALE, e);
      // el foco viaja al centro de la pantalla mientras se acerca
      const tx = (zoom.offsetWidth / 2 - ox) * e, ty = (zoom.offsetHeight / 2 - oy) * e;
      zoom.style.transformOrigin = `${ox}px ${oy}px`;
      zoom.style.transform = z > 0 ? `translate(${tx}px, ${ty}px) scale(${s})` : "none";
      const black = Math.min(1, Math.max(0, (z - 0.72) / 0.28));
      if (blackRef.current) blackRef.current.style.opacity = String(black);
      if (introRef.current) {
        introRef.current.style.opacity = String(Math.max(0, 1 - intro * 2.5));
        introRef.current.style.pointerEvents = intro > 0.2 ? "none" : "auto";
      }
      for (const l of layers.current) l.setActive(black < 1);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    const mobile = getMotionPrefs().isMobile;
    import("./floatingPhones").then(({ createLayer, BACK_SLOTS, FRONT_SLOTS }) => {
      if (cancelled) return;
      const b = backRef.current && createLayer(backRef.current, BACK_SLOTS, { mobile });
      // En celular no hay capa delantera: taparía a Fran y Tomi en una pantalla angosta.
      const f = !mobile && frontRef.current && createLayer(frontRef.current, FRONT_SLOTS, { mobile });
      layers.current = [b, f].filter(Boolean) as Layer[];
    });
    const onMove = (e: PointerEvent) => {
      if (!allowMotion()) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      for (const l of layers.current) l.setPointer(x, y);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const onResize = () => { origin.current = null; };
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
      layers.current.forEach((l) => l.dispose());
      layers.current = [];
    };
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-ink-950">
      <div ref={zoomRef} className="absolute inset-0 will-change-transform">
        {/* Fondo: los colores en movimiento del home anterior */}
        <ColorBends />
        <canvas ref={backRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        <HeroWordmark />
        {/* Fran y Tomi en el centro */}
        <div className="absolute bottom-[28svh] left-1/2 h-[52svh] w-full -translate-x-1/2 lg:bottom-0 lg:h-[74svh] lg:w-[46vw]">
          <div className="absolute bottom-[8%] left-1/2 h-[70%] w-[90%] -translate-x-1/2 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(196,196,196,.16), transparent)" }} />
          <img
            ref={imgRef}
            src={DUO.src}
            width={DUO.width}
            height={DUO.height}
            alt="Fran y Tomi de Somos iPhone NQN: Tomi con un cartel que dice Aceptamos cuotas y Fran mostrando un iPhone"
            fetchPriority="high"
            className="absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 select-none object-contain"
            style={{ maskImage: "linear-gradient(to top, transparent 0%, black 12%)", WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 12%)" }}
            draggable={false}
          />
        </div>
        <canvas ref={frontRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
      </div>
      {/* Textos alrededor de ellos */}
      <div ref={introRef} className="absolute inset-0 z-10">
        <HeroSides />
      </div>
      <div ref={blackRef} className="pointer-events-none absolute inset-0 z-20 bg-[var(--bg-main)] opacity-0" />
    </div>
  );
});
