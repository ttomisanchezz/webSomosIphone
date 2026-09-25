// ─────────────────────────────────────────────────────────────
//  Cuándo y cuánto bajar lo que no es de la primera pantalla.
// ─────────────────────────────────────────────────────────────

type NetInfo = { saveData?: boolean; effectiveType?: string };

/**
 * ¿Conexión lenta (2G/3G) o "ahorro de datos" activado? Ahí se baja lo
 * mínimo. Safari no informa la conexión: en iPhone siempre da false.
 */
export function slowNetwork(): boolean {
  if (typeof navigator === "undefined") return false;
  const c = (navigator as Navigator & { connection?: NetInfo }).connection;
  return !!c && (c.saveData === true || /2g|3g/.test(c.effectiveType ?? ""));
}

/**
 * Llama a `cb` cuando la página terminó de cargar y el hilo principal
 * quedó libre (lo que se ve primero ya bajó y se dibujó). Devuelve cómo
 * cancelar.
 */
export function afterLoadIdle(cb: () => void, timeout = 3000): () => void {
  let idleId = 0;
  let timer = 0;
  const idle = () => {
    const ric = window.requestIdleCallback;
    if (ric) idleId = ric(cb, { timeout });
    else timer = window.setTimeout(cb, 600);
  };
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
  return () => {
    window.removeEventListener("load", idle);
    if (idleId) window.cancelIdleCallback?.(idleId);
    window.clearTimeout(timer);
  };
}

/**
 * Llama a `cb` una sola vez, con el primer toque, scroll o tecla. Sirve
 * para no bajar en celular lo que no se ve en la portada (three.js y los
 * modelos 3D) hasta que la persona empieza a usar la página. Devuelve cómo
 * cancelar.
 */
export function onFirstInteraction(cb: () => void): () => void {
  const events = ["pointerdown", "touchstart", "scroll", "wheel", "keydown"] as const;
  const stop = () => events.forEach((ev) => window.removeEventListener(ev, run));
  const run = () => {
    stop();
    cb();
  };
  events.forEach((ev) => window.addEventListener(ev, run, { passive: true }));
  return stop;
}
