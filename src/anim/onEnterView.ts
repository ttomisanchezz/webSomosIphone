// ─────────────────────────────────────────────────────────────
//  "Hacer algo una vez cuando el elemento entra en pantalla", con un solo
//  IntersectionObserver para toda la página. Antes cada Reveal y cada
//  título creaba su ScrollTrigger: ~70 que al montarse leían el layout uno
//  por uno (el navegador recalculaba la página entera ~70 veces al cargar).
// ─────────────────────────────────────────────────────────────

const callbacks = new Map<Element, () => void>();
let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver {
  // -14% abajo = dispara cuando el borde superior pasa el 86% del alto de la
  // pantalla (lo mismo que el "top 86%" que usaban los ScrollTrigger).
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const cb = callbacks.get(e.target);
        callbacks.delete(e.target);
        observer?.unobserve(e.target);
        cb?.();
      }
    },
    { rootMargin: "0px 0px -14% 0px" }
  );
  return observer;
}

let revealsOn: boolean | null = null;

/**
 * ¿Animar las entradas? El HTML llega pre-renderizado y visible: si la
 * persona ya scrolleó antes de que cargara el JavaScript, esconder lo que
 * está leyendo para volver a mostrarlo se vería como un parpadeo. En ese
 * caso la página queda tal cual, sin animaciones de entrada.
 */
export function revealsEnabled(): boolean {
  revealsOn ??= window.scrollY < 1;
  return revealsOn;
}

/**
 * Oculta un elemento hasta su animación de entrada (lo mismo que
 * autoAlpha: 0). Sin pasar por gsap.set: GSAP lee el estilo computado de
 * cada elemento antes de escribir, ~80 lecturas forzadas al cargar.
 */
export function hideUntilEnter(el: HTMLElement): void {
  el.style.opacity = "0";
  el.style.visibility = "hidden";
}

/** Llama a `cb` la primera vez que `el` entra en pantalla. Devuelve cómo cancelar. */
export function onEnterView(el: Element, cb: () => void): () => void {
  callbacks.set(el, cb);
  getObserver().observe(el);
  return () => {
    callbacks.delete(el);
    observer?.unobserve(el);
  };
}
