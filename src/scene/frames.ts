/**
 * Secuencias de frames generadas con Higgsfield (videos → WebP con
 * scripts/extraer-frames.sh). Cada secuencia vive en
 * /public/media/<nombre>-<variante>/0001.webp …
 */
import { slowNetwork } from "@/utils/network";

export type SeqName = "camara" | "cartel";
export type Variant = "mobile" | "desktop";

interface SeqInfo {
  frames: number;
  /** Variantes disponibles. Si falta la pedida se usa la otra (se dibuja en "cover"). */
  variants: Variant[];
}

export const SEQUENCES: Record<SeqName, SeqInfo> = {
  camara: { frames: 61, variants: ["mobile", "desktop"] },
  cartel: { frames: 61, variants: ["mobile", "desktop"] },
};

export function frameUrl(seq: SeqName, variant: Variant, i: number): string {
  return `/media/${seq}-${variant}/${String(i + 1).padStart(4, "0")}.webp`;
}

export function pickVariant(seq: SeqName): Variant {
  const wanted: Variant =
    typeof window !== "undefined" && window.innerWidth / window.innerHeight >= 1 ? "desktop" : "mobile";
  const v = SEQUENCES[seq].variants;
  return v.includes(wanted) ? wanted : v[0];
}

/* ── Carga de las secuencias ──────────────────────────────────
 * Antes se pedían los 122 cuadros juntos apenas abría la página (~2,2 MB
 * en celular, ~3 MB en PC) y le sacaban ancho de banda a lo que se ve
 * primero. Ahora:
 *  - van de a MAX_IN_FLIGHT pedidos y con prioridad baja;
 *  - de lo grueso a lo fino: 1 de cada 8 cuadros, después 1 de cada 4, 2
 *    y todos. Si la persona llega al zoom antes de que terminen, el scrub
 *    ya anda: se dibuja el cuadro más cercano que haya;
 *  - cada cuadro se decodifica (img.decode) antes de usarse. Si no, el
 *    drawImage lo decodificaba en el hilo principal en pleno scroll;
 *  - con conexión lenta o ahorro de datos se baja la mitad de los cuadros.
 * El array que devuelve loadSequence se va llenando: los huecos son
 * cuadros que todavía no llegaron. */
const MAX_IN_FLIGHT = 4;

interface SeqState {
  imgs: HTMLImageElement[];
  listeners: Set<() => void>;
}
const cache = new Map<string, SeqState>();
const queue: (() => void)[] = [];
let inFlight = 0;
const anyFrame = new Set<() => void>();

const pump = () => {
  while (inFlight < MAX_IN_FLIGHT && queue.length) {
    inFlight++;
    queue.shift()!();
  }
};

/** 0, 8, 16… y el último; después 4, 12…; y así hasta `minStep`. */
function coarseToFine(n: number, minStep: number): number[] {
  const order: number[] = [];
  const seen = new Set<number>();
  const add = (i: number) => {
    if (!seen.has(i)) {
      seen.add(i);
      order.push(i);
    }
  };
  for (let step = 8; step >= minStep; step /= 2) {
    for (let i = 0; i < n; i += step) add(i);
    add(n - 1);
  }
  return order;
}

/** Encola (una sola vez) los frames de una secuencia y devuelve el array que se va llenando. */
export function loadSequence(seq: SeqName, variant: Variant, onFrame?: () => void): HTMLImageElement[] {
  const key = `${seq}-${variant}`;
  let state = cache.get(key);
  if (!state) {
    const s: SeqState = { imgs: new Array(SEQUENCES[seq].frames), listeners: new Set() };
    state = s;
    cache.set(key, s);
    const minStep = slowNetwork() ? 2 : 1;
    for (const i of coarseToFine(SEQUENCES[seq].frames, minStep)) {
      queue.push(() => {
        const img = new Image();
        img.decoding = "async";
        img.fetchPriority = "low";
        const done = () => {
          inFlight--;
          pump();
        };
        img.onload = () => {
          img
            .decode()
            .catch(() => {})
            .then(() => {
              s.imgs[i] = img;
              s.listeners.forEach((fn) => fn());
              anyFrame.forEach((fn) => fn());
              done();
            });
        };
        img.onerror = done;
        img.src = frameUrl(seq, variant, i);
      });
    }
    pump();
  }
  if (onFrame) state.listeners.add(onFrame);
  return state.imgs;
}

/** Avisa cada vez que llega un cuadro (de cualquier secuencia). Devuelve cómo dejar de escuchar. */
export function onAnyFrame(fn: () => void): () => void {
  anyFrame.add(fn);
  return () => anyFrame.delete(fn);
}

/* ── Portada (imagen fija en 4K) ─────────────────────────────── */
export type Focus = "camara" | "cartel";
type Portada = "a" | "b";

/** Punto (0..1) de la imagen hacia donde apunta cada zoom, por variante. */
const FOCUS: Record<Portada, Record<Variant, Record<Focus, [number, number]>>> = {
  a: {
    mobile: { camara: [0.616, 0.34], cartel: [0.288, 0.511] },
    desktop: { camara: [0.531, 0.31], cartel: [0.41, 0.517] },
  },
  b: {
    mobile: { camara: [0.617, 0.366], cartel: [0.27, 0.514] },
    desktop: { camara: [0.536, 0.36], cartel: [0.428, 0.515] },
  },
};

/** Portada activa: A por defecto, B con ?portada=b (para comparar). */
export function currentPortada(): Portada {
  if (typeof window === "undefined") return "a";
  return new URLSearchParams(window.location.search).get("portada")?.toLowerCase() === "b" ? "b" : "a";
}

export function portadaUrl(variant: Variant, p: Portada = currentPortada()): string {
  return `/media/portada/${p}-${variant}.webp`;
}

export function portadaFocus(variant: Variant, focus: Focus): [number, number] {
  return FOCUS[currentPortada()][variant][focus];
}

export function screenVariant(): Variant {
  return typeof window !== "undefined" && window.innerWidth / window.innerHeight >= 1 ? "desktop" : "mobile";
}
