import { AnimationProvider } from "@/anim/AnimationProvider";
import { PhoneStageProvider } from "@/three/PhoneStage";
import { ScrollScene } from "@/scene/ScrollScene";
import { Precios } from "@/sections/precios/Precios";
import { Pagos } from "@/sections/pagos/Pagos";
import { Resto } from "@/sections/resto/Resto";
import { FloatingActions } from "@/components/FloatingActions";

/**
 * Estructura de la web nueva. ESTE ARCHIVO NO SE TOCA en las ramas feat/*:
 * cada rama trabaja solo dentro de su carpeta (ver BRANCHES.md).
 *
 *  1. ScrollScene  → portada (Fran con el celu + Tomás con el cartel).
 *     - zoom a la cámara del celu de Fran → muestra `camaraPanel` (Precios)
 *     - zoom al cartel de Tomás           → muestra `cartelPanel` (Pagos)
 *  2. Resto        → web "normal": fondo interactivo, clientes, despiece, FAQ, footer.
 */
export default function App() {
  return (
    <AnimationProvider>
      <PhoneStageProvider>
        <div className="relative min-h-dvh overflow-x-clip bg-[var(--bg-deep)] text-[var(--text-primary)]">
          <main>
            <ScrollScene camaraPanel={<Precios />} cartelPanel={<Pagos />} />
            <Resto />
          </main>
          <FloatingActions />
        </div>
      </PhoneStageProvider>
    </AnimationProvider>
  );
}
