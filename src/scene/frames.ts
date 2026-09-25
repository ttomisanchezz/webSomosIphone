/**
 * Secuencias de frames generadas con Higgsfield (videos → WebP con
 * scripts/extraer-frames.sh). Cada secuencia vive en
 * /public/media/<nombre>-<variante>/0001.webp …
 */
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

const cache = new Map<string, HTMLImageElement[]>();

/** Precarga (una sola vez) todos los frames de una secuencia. */
export function loadSequence(seq: SeqName, variant: Variant, onFrame?: () => void): HTMLImageElement[] {
  const key = `${seq}-${variant}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const imgs = Array.from({ length: SEQUENCES[seq].frames }, (_, i) => {
    const img = new Image();
    img.decoding = "async";
    img.src = frameUrl(seq, variant, i);
    if (onFrame) img.onload = onFrame;
    return img;
  });
  cache.set(key, imgs);
  return imgs;
}

/* ── Portada (imagen fija en 4K) ─────────────────────────────── */
export type Focus = "camara" | "cartel";
type Portada = "a" | "b";

/** Punto (0..1) de la imagen hacia donde apunta cada zoom, por variante. */
const FOCUS: Record<Portada, Record<Variant, Record<Focus, [number, number]>>> = {
  a: {
    mobile: { camara: [0.605, 0.316], cartel: [0.3, 0.481] },
    desktop: { camara: [0.533, 0.332], cartel: [0.4375, 0.489] },
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
