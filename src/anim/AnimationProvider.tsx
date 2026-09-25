import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/anim/gsap";
import { allowHeavy, allowMotion } from "@/anim/motion";

/**
 * Orquesta el movimiento global:
 *  - Smooth scroll (Lenis) en desktop, sincronizado con ScrollTrigger.
 *  - Parallax de capas con [data-parallax].
 *  - Anchors del nav con scroll suave y offset del header fijo.
 *  - Refresh de ScrollTrigger en load/resize.
 * En móvil / reduced-motion: scroll nativo y sin parallax (fluidez primero).
 */
export function AnimationProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const heavy = allowHeavy();
    let lenis: Lenis | null = null;
    let rafFn: ((time: number) => void) | null = null;
    let onAnchorClick: ((e: MouseEvent) => void) | null = null;

    if (heavy) {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      const l = lenis;
      l.on("scroll", ScrollTrigger.update);
      rafFn = (time: number) => l.raf(time * 1000);
      gsap.ticker.add(rafFn);
      gsap.ticker.lagSmoothing(0);

      onAnchorClick = (e: MouseEvent) => {
        const el = e.target as HTMLElement | null;
        const a = el?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
        if (!a) return;
        const href = a.getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        l.scrollTo(target as HTMLElement, { offset: -96, duration: 1.2 });
      };
      document.addEventListener("click", onAnchorClick);
    } else {
      // Celular (y equipos lentos): sin Lenis. Las secciones de abajo usan
      // content-visibility (index.css) y miden 1000 px estimados hasta que se
      // pintan, así que el scroll suave del navegador calculaba mal el destino
      // y el menú dejaba a la persona miles de px antes. Se salta directo y se
      // corrige unos frames más, hasta que las secciones que se pintaron dejan
      // de cambiar de alto y el destino queda quieto.
      onAnchorClick = (e: MouseEvent) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
        const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
        const href = a?.getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector<HTMLElement>(href);
        if (!target) return;
        e.preventDefault();
        history.pushState(null, "", href);
        // Un frame de espera: el menú se cierra y libera el overflow del body.
        requestAnimationFrame(() => {
          let tries = 0;
          let last = NaN;
          const jump = () => {
            target.scrollIntoView({ block: "start", behavior: "instant" });
            const top = target.getBoundingClientRect().top;
            if (Math.abs(top - last) > 1 && ++tries < 12) {
              last = top;
              requestAnimationFrame(jump);
            }
          };
          jump();
        });
      };
      document.addEventListener("click", onAnchorClick);
    }

    const ctx = gsap.context(() => {
      if (!allowMotion() || !heavy) return;
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((node) => {
        const speed = parseFloat(node.dataset.parallax || "0");
        gsap.to(node, {
          yPercent: speed * 100,
          ease: "none",
          scrollTrigger: {
            trigger: node,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });
    });

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    const refreshT = window.setTimeout(() => ScrollTrigger.refresh(), 400);

    return () => {
      window.removeEventListener("load", onLoad);
      window.clearTimeout(refreshT);
      ctx.revert();
      if (onAnchorClick) document.removeEventListener("click", onAnchorClick);
      if (rafFn) gsap.ticker.remove(rafFn);
      if (lenis) lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
