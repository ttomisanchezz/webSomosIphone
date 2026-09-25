import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText } from "@/anim/gsap";
import { allowHeavy, getMotionPrefs } from "@/anim/motion";
import { hideUntilEnter, onEnterView, revealsEnabled } from "@/anim/onEnterView";

/**
 * Revela el texto de un título palabra por palabra con stagger.
 * - onMount: anima al montar (hero). Si no, anima al entrar en viewport.
 * - Con reduced-motion no toca el texto (queda visible y accesible).
 * - Revierte el SplitText al terminar → DOM original (accesible, sin reflow raro).
 * - En celular el título sube entero, sin partirlo: partir todos los títulos
 *   al cargar costaba ~1 s de CPU en un celular de gama media.
 * - En desktop parte cada título recién cuando está por verse, no todos
 *   juntos al montar.
 */
export function useSplitReveal<T extends HTMLElement>(opts?: {
  onMount?: boolean;
  delay?: number;
}) {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (getMotionPrefs().reduced) return; // texto tal cual, sin animar
      if (!opts?.onMount && !revealsEnabled()) return;

      const delay = opts?.delay ?? 0;
      let split: SplitText | null = null;
      let tween: gsap.core.Tween | null = null;

      const play = () => {
        if (!allowHeavy()) {
          // fromTo: el título ya está oculto, un from() iría de 0 a 0.
          tween = gsap.fromTo(
            el,
            { y: 24, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out", delay }
          );
          return;
        }
        split = new SplitText(el, { type: "words", wordsClass: "split-word" });
        gsap.set(el, { autoAlpha: 1 });
        tween = gsap.from(split.words, {
          yPercent: 115,
          autoAlpha: 0,
          duration: 0.85,
          ease: "power3.out",
          stagger: 0.045,
          delay,
          onComplete: () => split?.revert(),
        });
      };

      let stop: (() => void) | null = null;
      if (opts?.onMount) {
        play();
      } else {
        // Oculto hasta que entra en pantalla (sin esto se vería un instante
        // antes de arrancar la animación).
        hideUntilEnter(el);
        stop = onEnterView(el, play);
      }

      return () => {
        stop?.();
        tween?.kill();
        split?.revert();
        gsap.set(el, { clearProps: "opacity,visibility" });
      };
    },
    { scope: ref }
  );

  return ref;
}
