import type { ReactNode } from "react";

/**
 * [feat/escena-scroll] Escena principal con scroll.
 * Contrato (no cambiar sin avisar a las otras ramas):
 *  - camaraPanel: contenido que aparece al terminar el zoom a la cámara (Precios).
 *  - cartelPanel: contenido que aparece al terminar el zoom al cartel (Pagos).
 * Los medios generados con Higgsfield van en /public/media/.
 * PLACEHOLDER: hoy solo apila todo en orden.
 */
export interface ScrollSceneProps {
  camaraPanel: ReactNode;
  cartelPanel: ReactNode;
}

export function ScrollScene({ camaraPanel, cartelPanel }: ScrollSceneProps) {
  return (
    <section id="inicio" aria-label="Inicio">
      <div className="grid min-h-dvh place-items-center px-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">somos iphone nqn</h1>
      </div>
      <div id="precios">{camaraPanel}</div>
      <div id="pagos">{cartelPanel}</div>
    </section>
  );
}
