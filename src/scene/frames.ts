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
  cartel: { frames: 61, variants: ["mobile"] },
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
