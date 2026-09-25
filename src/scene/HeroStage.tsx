import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { allowMotion, getMotionPrefs } from "@/anim/motion";
import type { Layer } from "./floatingPhones";

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

  useImperativeHandle(ref, () => ({
    setZoom(focus, z, intro) {
      const zoom = zoomRef.current, img = imgRef.current;
      if (!zoom || !img) return;
      const [fx, fy] = DUO.focus[focus];
      // posición del foco dentro del escenario (offset* ignora transforms, y la
      // imagen está centrada con translateX(-50%): se lo descontamos)
      const ox = img.offsetLeft - img.offsetWidth / 2 + fx * img.offsetWidth;
      const oy = img.offsetTop + fy * img.offsetHeight;
      const e = z * z * (3 - 2 * z);
      const s = Math.pow(MAX_SCALE, e);
      // el foco viaja al centro de la pantalla mientras se acerca
      const cx = zoom.offsetWidth / 2, cy = zoom.offsetHeight / 2;
      const tx = (cx - ox) * e, ty = (cy - oy) * e;
      zoom.style.transformOrigin = `${ox}px ${oy}px`;
      zoom.style.transform = z > 0 ? `translate(${tx}px, ${ty}px) scale(${s})` : "none";
      const black = Math.min(1, Math.max(0, (z - 0.72) / 0.28));
      if (blackRef.current) blackRef.current.style.opacity = String(black);
      if (introRef.current) introRef.current.style.opacity = String(Math.max(0, 1 - intro * 3));
      for (const l of layers.current) l.setActive(black < 1);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    const mobile = getMotionPrefs().isMobile;
    import("./floatingPhones").then(({ createLayer, BACK_SLOTS, FRONT_SLOTS }) => {
      if (cancelled) return;
      const b = backRef.current && createLayer(backRef.current, BACK_SLOTS, { mobile });
      const f = frontRef.current && createLayer(frontRef.current, FRONT_SLOTS, { mobile });
      layers.current = [b, f].filter(Boolean) as Layer[];
    });
    const onMove = (e: PointerEvent) => {
      if (!allowMotion()) return;
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      for (const l of layers.current) l.setPointer(x, y);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelled = true;
      window.removeEventListener("pointermove", onMove);
      layers.current.forEach((l) => l.dispose());
      layers.current = [];
    };
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#05060a]">
      <div ref={zoomRef} className="absolute inset-0 will-change-transform">
        {/* Fondo futurista */}
        <div className="absolute inset-0" style={{
          background:
            "radial-gradient(60% 50% at 50% 55%, rgba(46,123,255,.28), transparent 70%)," +
            "radial-gradient(40% 35% at 15% 20%, rgba(138,180,255,.14), transparent 70%)," +
            "radial-gradient(40% 35% at 85% 25%, rgba(196,196,196,.10), transparent 70%)," +
            "linear-gradient(180deg,#05060a 0%,#0a0d16 60%,#05060a 100%)",
        }} />
        <div className="absolute inset-x-0 bottom-0 h-[45%] opacity-40" style={{
          backgroundImage:
            "linear-gradient(rgba(138,180,255,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(138,180,255,.25) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          transform: "perspective(600px) rotateX(62deg)",
          transformOrigin: "bottom",
          maskImage: "linear-gradient(to top, black, transparent)",
          WebkitMaskImage: "linear-gradient(to top, black, transparent)",
        }} />
        <canvas ref={backRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        {/* Halo detrás de ellos */}
        <div className="absolute bottom-0 left-1/2 h-[70%] w-[80%] -translate-x-1/2 rounded-full blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(46,123,255,.35), transparent)" }} />
        <img
          ref={imgRef}
          src={DUO.src}
          width={DUO.width}
          height={DUO.height}
          alt="Fran y Tomi de Somos iPhone NQN: Tomi con un cartel que dice Aceptamos cuotas y Fran mostrando un iPhone"
          fetchPriority="high"
          className="absolute bottom-0 left-1/2 w-[min(118vw,calc(86svh*0.978))] max-w-none -translate-x-1/2 select-none"
          style={{ maskImage: "linear-gradient(to top, transparent 0%, black 14%)", WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 14%)" }}
          draggable={false}
        />
        <canvas ref={frontRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
      </div>
      <div ref={introRef} className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center pt-[max(1.5rem,env(safe-area-inset-top))] text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">somos iphone nqn</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] md:text-base">iPhones nuevos y usados en Neuquén · Deslizá ↓</p>
      </div>
      <div ref={blackRef} className="pointer-events-none absolute inset-0 bg-[var(--bg-main)] opacity-0" />
    </div>
  );
});
