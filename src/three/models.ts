// ─────────────────────────────────────────────────────────────
//  Modelos 3D (.glb) — servidos desde public/glb/
//  Protagonista: iPhone 14 Pro (el modelo más llevado).
//  Catálogo: alterna el resto de los modelos.
// ─────────────────────────────────────────────────────────────

export const MODELS = {
  iphone17ProMax: "/glb/iphone_17_pro_max.glb",
  iphone17: "/glb/iphone_17.glb",
  iphone16Pro: "/glb/iphone_16_pro.glb",
  iphone16Plus: "/glb/iphone_16_plus.glb",
  iphone16: "/glb/iphone_16.glb",
  iphone15ProMax: "/glb/iphone_15_pro_max.glb",
  iphone15: "/glb/iphone_15.glb",
  iphone14Pro: "/glb/iphone_14_pro.glb",
  iphone14: "/glb/iphone_14.glb",
  iphone13ProMax: "/glb/iphone_13_pro_max.glb",
  iphone13: "/glb/iphone_13.glb",
  iphone13Pro: "/glb/iphone_13_pro.glb",
} as const;

/**
 * Modelo del protagonista. Es el 14 Pro porque es el que más se vende, no
 * el más caro del catálogo: la sección vende el que la gente realmente lleva.
 */
export const HERO_MODEL = MODELS.iphone14Pro;

/**
 * iPhone 14 Pro desarmable de la sección "Por dentro": 12 grupos con
 * posición de armado y desplazamiento en sus metadatos. Es una copia
 * optimizada (scripts/optimize-despiece-glb.mjs) del maestro de 24 MB en
 * deliverables/iphone14pro/, que no se sirve.
 */
export const DESPIECE_MODEL = "/glb/iphone_14_pro_despiece.glb";

/**
 * Modelos que rotan en las cards del catálogo. Cada card muestra un modelo
 * distinto para dar variedad (17 Pro Max, 16 Plus, 14 Pro Max, 13 Pro Max).
 */
export const CARD_MODELS = [
  MODELS.iphone17ProMax,
  MODELS.iphone16Plus,
  MODELS.iphone14Pro,
  MODELS.iphone13ProMax,
] as const;
