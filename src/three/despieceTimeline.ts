// ─────────────────────────────────────────────────────────────
//  Coreografía del iPhone 14 Pro desarmándose. Todo es función pura del
//  progreso del scroll p (0 → 1): el mismo p da siempre la misma pose, así
//  que al volver hacia arriba el teléfono se rearma exacto, sin acumular.
//
//  Es la continuación de "El más llevado": ahí se ve el teléfono entero, y
//  el desarme arranca con la pantalla ya separada y el frente en 3/4.
//
//  No importa three.js: lo usan tanto la sección (textos) como la escena.
// ─────────────────────────────────────────────────────────────
import type { DespieceStepId } from "@/data/despiece";

/**
 * Tramo de p en que cada grupo del .glb viaja de armado a separado. Un
 * tramo de largo cero en 0 (la pantalla) significa "ya separado al empezar".
 */
export const PART_WINDOWS: Readonly<Record<string, readonly [number, number]>> = {
  "10_Display": [0, 0],
  "03_Battery": [0.17, 0.33],
  "05_Rear_camera_module": [0.37, 0.52],
  "06_TrueDepth_module": [0.38, 0.53],
  "09_Camera_shield": [0.39, 0.54],
  "12_Connector_brackets": [0.56, 0.66],
  "04_Logic_board_A16": [0.58, 0.72],
  "01_Back_glass": [0.76, 0.92],
  "07_Taptic_engine": [0.77, 0.91],
  "08_Loudspeaker": [0.78, 0.92],
  "11_Lightning_flex": [0.79, 0.93],
};
/** Grupos sin tramo propio (el chasis, que no se mueve) usan el final. */
export const DEFAULT_PART_WINDOW = [0.76, 0.93] as const;

/**
 * Cuándo se ve el texto de cada paso y qué pieza señala. La pantalla se ve
 * desde el arranque; las demás entran un poco después de que su pieza
 * empieza a salir.
 */
export const STEP_WINDOWS: Readonly<
  Record<DespieceStepId, { part: string; from: number; to: number }>
> = {
  pantalla: { part: "10_Display", from: 0, to: 0.17 },
  bateria: { part: "03_Battery", from: 0.2, to: 0.37 },
  camaras: { part: "05_Rear_camera_module", from: 0.4, to: 0.57 },
  chip: { part: "04_Logic_board_A16", from: 0.6, to: 0.77 },
};
/** Desde acá se ve el cierre. */
export const OUTRO_START = 0.82;

/**
 * Giro del conjunto: [p, rotY, rotX] en radianes. Arranca de frente en 3/4
 * y al final se inclina para que se lean las capas.
 */
export const ROTATION_KEYS: readonly (readonly [number, number, number])[] = [
  [0, -0.36, 0.16],
  [0.15, -0.3, 0.16],
  [0.55, -0.38, 0.22],
  [0.76, -0.45, 0.26],
  [0.93, -0.62, 0.34],
  [1, -0.62, 0.34],
];

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export function easeInOut(x: number): number {
  const t = clamp01(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Avance (0 → 1, con easing) de una pieza para el progreso p. */
export function partAmount(name: string, p: number): number {
  const [a, b] = PART_WINDOWS[name] ?? DEFAULT_PART_WINDOW;
  if (b <= a) return p >= a ? 1 : 0;
  return easeInOut((p - a) / (b - a));
}

/** Rotación [y, x] del conjunto para el progreso p. */
export function rotationAt(p: number): [number, number] {
  const keys = ROTATION_KEYS;
  if (p <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) {
    const [p1, y1, x1] = keys[i];
    if (p <= p1) {
      const [p0, y0, x0] = keys[i - 1];
      const t = easeInOut((p - p0) / (p1 - p0 || 1));
      return [y0 + (y1 - y0) * t, x0 + (x1 - x0) * t];
    }
  }
  const last = keys[keys.length - 1];
  return [last[1], last[2]];
}

/** Paso activo (para el indicador y la marca sobre la pieza), o null. */
export function stepAt(p: number): DespieceStepId | null {
  for (const id of Object.keys(STEP_WINDOWS) as DespieceStepId[]) {
    const w = STEP_WINDOWS[id];
    if (p >= w.from && p < w.to) return id;
  }
  return null;
}
