import { useEffect, useRef, type ReactNode } from "react";
import { HeroStage, type HeroStageHandle } from "./HeroStage";

/**
 * [feat/escena-scroll] Escena principal.
 * Contrato (no cambiar sin avisar a las otras ramas):
 *  - camaraPanel: aparece al terminar el zoom a la cámara del iPhone de Fran (Precios).
 *  - cartelPanel: aparece al terminar el zoom al cartel de Tomi (Pagos).
 *
 * Un solo escenario "sticky" (fondo futurista + iPhones 3D + Fran y Tomi)
 * queda fijo detrás mientras se scrollea; los paneles pasan por encima con
 * fondo negro. Los espaciadores A, B y C marcan cuándo hace cada zoom:
 *  A) portada → zoom a la cámara   ── Precios
 *  B) sale de la cámara → zoom al cartel   ── Pagos
 *  C) sale del cartel → portada → sigue la web
 */
export interface ScrollSceneProps {
  camaraPanel: ReactNode;
  cartelPanel: ReactNode;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function ScrollScene({ camaraPanel, cartelPanel }: ScrollSceneProps) {
  const stage = useRef<HeroStageHandle>(null);
  const a = useRef<HTMLDivElement>(null);
  const b = useRef<HTMLDivElement>(null);
  const c = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const prog = (el: HTMLElement | null) => {
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      // 0 cuando el espaciador llega arriba de la pantalla, 1 cuando su final
      // llega abajo (justo antes de que entre el panel siguiente)
      const total = r.height - window.innerHeight;
      return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    };
    const update = () => {
      raf = 0;
      const pa = prog(a.current), pb = prog(b.current), pc = prog(c.current);
      const s = stage.current;
      if (!s) return;
      if (pb <= 0) {
        s.setZoom("camara", smooth(0.2, 1, pa), pa);
      } else if (pc <= 0) {
        if (pb < 0.5) s.setZoom("camara", 1 - smooth(0, 0.45, pb), 1);
        else s.setZoom("cartel", smooth(0.55, 1, pb), 1);
      } else {
        s.setZoom("cartel", 1 - smooth(0, 0.8, pc), 1 - smooth(0.5, 1, pc));
      }
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div id="inicio" className="relative">
      {/* Escenario fijo durante toda la escena */}
      <div className="sticky top-0 z-0 -mb-[100dvh] h-dvh">
        <HeroStage ref={stage} />
      </div>
      <div ref={a} aria-hidden="true" style={{ height: "200vh" }} />
      <div id="precios" className="relative z-10 bg-[var(--bg-main)]">{camaraPanel}</div>
      <div ref={b} aria-hidden="true" style={{ height: "250vh" }} />
      <div id="pagos" className="relative z-10 bg-[var(--bg-main)]">{cartelPanel}</div>
      <div ref={c} aria-hidden="true" style={{ height: "150vh" }} />
    </div>
  );
}
