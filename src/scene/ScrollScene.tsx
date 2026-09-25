import type { ReactNode } from "react";
import { FrameScrub, type Step } from "./FrameScrub";

/**
 * [feat/escena-scroll] Escena principal.
 * Contrato (no cambiar sin avisar a las otras ramas):
 *  - camaraPanel: aparece al terminar el zoom a la cámara (Precios).
 *  - cartelPanel: aparece al terminar el zoom al cartel (Pagos).
 *
 * Recorrido:
 *  A) portada → zoom a la cámara del iPhone de Fran (termina en negro)
 *  ── camaraPanel (fondo negro, flujo normal)
 *  B) sale de la cámara → portada → zoom al cartel "ACEPTAMOS CUOTAS"
 *  ── cartelPanel
 *  C) sale del cartel → portada → sigue el resto de la web
 */
export interface ScrollSceneProps {
  camaraPanel: ReactNode;
  cartelPanel: ReactNode;
}

const LAST = 60;
const HANDOFF = 10; // frame del video viejo donde se funde la portada nueva

const A: Step[] = [
  { kind: "still", focus: "camara", zoom: [1, 1] }, // un momento quieto en la portada
  { kind: "still", focus: "camara", zoom: [1, 1.8], fadeTo: { seq: "camara", frame: HANDOFF } },
  { kind: "frames", seq: "camara", from: HANDOFF, to: 35 },
  { kind: "frames", seq: "camara", from: 35, to: LAST },
];

const B: Step[] = [
  { kind: "frames", seq: "camara", from: LAST, to: HANDOFF },
  { kind: "still", focus: "camara", zoom: [1.8, 1], fadeFrom: { seq: "camara", frame: HANDOFF } },
  { kind: "still", focus: "cartel", zoom: [1, 1.8], fadeTo: { seq: "cartel", frame: HANDOFF } },
  { kind: "frames", seq: "cartel", from: HANDOFF, to: LAST },
];

const C: Step[] = [
  { kind: "frames", seq: "cartel", from: LAST, to: HANDOFF },
  { kind: "still", focus: "cartel", zoom: [1.8, 1], fadeFrom: { seq: "cartel", frame: HANDOFF } },
];

function Intro() {
  return (
    <div
      className="flex h-full flex-col items-center justify-end pb-[max(2.5rem,env(safe-area-inset-bottom))] text-center"
      style={{ opacity: "calc(1 - var(--p, 0) * 4)" }}
    >
      <h1 className="text-4xl font-semibold tracking-tight drop-shadow md:text-6xl">somos iphone nqn</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)] md:text-base">Deslizá para ver precios ↓</p>
    </div>
  );
}

export function ScrollScene({ camaraPanel, cartelPanel }: ScrollSceneProps) {
  return (
    <div id="inicio">
      <FrameScrub steps={A} heightVh={300} overlay={<Intro />} label="Inicio" />
      <div id="precios" className="relative bg-[var(--bg-main)]">{camaraPanel}</div>
      <FrameScrub steps={B} heightVh={400} label="Transición a formas de pago" />
      <div id="pagos" className="relative bg-[var(--bg-main)]">{cartelPanel}</div>
      <FrameScrub steps={C} heightVh={200} label="Transición" />
    </div>
  );
}
