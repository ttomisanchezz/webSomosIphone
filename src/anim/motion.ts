// ─────────────────────────────────────────────────────────────
//  Preferencias de movimiento — "fluidez primero".
//  Centraliza la decisión de cuánto animar según dispositivo y
//  prefers-reduced-motion, para degradar parejo en todo el sitio.
// ─────────────────────────────────────────────────────────────

export interface MotionPrefs {
  /** El usuario pidió menos movimiento. */
  reduced: boolean;
  /** Viewport tipo móvil/tablet (< lg). */
  isMobile: boolean;
  /** Pocos núcleos → equipo potencialmente lento. */
  lowPower: boolean;
}

export function getMotionPrefs(): MotionPrefs {
  if (typeof window === "undefined") {
    return { reduced: true, isMobile: false, lowPower: false };
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 1023px)").matches;
  const cores = navigator.hardwareConcurrency ?? 8;
  const lowPower = cores <= 4;
  return { reduced, isMobile, lowPower };
}

/**
 * ¿Habilitar efectos "pesados" (smooth scroll, scrub del 3D, parallax,
 * botones magnéticos)? Solo en desktop, sin reduced-motion y sin low-power.
 */
export function allowHeavy(): boolean {
  const { reduced, isMobile, lowPower } = getMotionPrefs();
  return !reduced && !isMobile && !lowPower;
}

/** ¿Animar algo? Falso solo con reduced-motion (ahí mostramos estado final). */
export function allowMotion(): boolean {
  return !getMotionPrefs().reduced;
}
