// ─────────────────────────────────────────────────────────────
//  Textos de la sección "Por dentro" (iPhone 14 Pro desarmándose).
//
//  Cifras verificadas contra la ficha técnica oficial de Apple:
//  https://support.apple.com/en-us/111849 (iPhone 14 Pro - Technical
//  Specifications). Si se edita un número, volver a chequearlo ahí.
//
//  El modelo 3D es una aproximación visual: los textos hablan del equipo,
//  no de las medidas del modelo.
// ─────────────────────────────────────────────────────────────

export type DespieceStepId = "pantalla" | "bateria" | "camaras" | "chip";

export interface DespieceStep {
  id: DespieceStepId;
  /** Chip corto (indicador de pasos y etiqueta sobre la pieza). */
  label: string;
  /** Dato principal, grande. */
  title: string;
  points: readonly string[];
}

/** Título del desarme (continúa la sección "El más llevado"). */
export const despieceHeading = {
  eyebrow: "Por dentro",
  title: "Así está hecho un iPhone 14 Pro",
} as const;

export const despieceSteps: readonly DespieceStep[] = [
  {
    id: "pantalla",
    label: "Pantalla",
    title: "6,1″ Super Retina XDR",
    points: [
      "OLED con ProMotion: hasta 120 Hz y pantalla siempre activa",
      "2556 × 1179 píxeles a 460 ppi",
      "Hasta 2000 nits al sol y 1600 nits en HDR",
    ],
  },
  {
    id: "bateria",
    label: "Batería",
    title: "Hasta 23 h de video",
    points: [
      "Hasta 20 h de video en streaming y 75 h de audio",
      "Carga rápida: 50 % en unos 30 min con cargador de 20 W o más",
      "Carga inalámbrica MagSafe de hasta 15 W",
    ],
  },
  {
    id: "camaras",
    label: "Cámaras",
    title: "Principal de 48 MP",
    points: [
      "ƒ/1,78 con estabilización por desplazamiento del sensor",
      "Ultra gran angular y teleobjetivo 3x, de 12 MP cada una",
      "Escáner LiDAR y frontal TrueDepth de 12 MP con autoenfoque",
    ],
  },
  {
    id: "chip",
    label: "Chip",
    title: "A16 Bionic",
    points: [
      "CPU de 6 núcleos: 2 de rendimiento y 4 de eficiencia",
      "GPU de 5 núcleos",
      "Neural Engine de 16 núcleos",
    ],
  },
] as const;

export const despieceOutro = {
  title: "Todo eso entra en 7,85 mm",
  text: "147,5 × 71,5 mm y 206 g. Consultá disponibilidad: verificado y con garantía local.",
  cta: "Consultar por el 14 Pro",
} as const;

/** Aclaración fija: el 3D es ilustrativo. */
export const despieceDisclaimer =
  "Modelo 3D ilustrativo, no es un despiece técnico exacto. Datos: ficha técnica de Apple.";
