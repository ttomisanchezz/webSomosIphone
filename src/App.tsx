import { Background } from "@/components/ui";
import { AnimationProvider } from "@/anim/AnimationProvider";
import { PhoneStageProvider } from "@/three/PhoneStage";
import { TopBar } from "@/components/TopBar";
import { ScrollScene } from "@/scene/ScrollScene";
import { ProductCards } from "@/components/ProductCards";
import { Benefits } from "@/components/Benefits";
import { PhoneDetail } from "@/components/PhoneDetail";
import { Comparison } from "@/components/Comparison";
import { PaymentSection } from "@/components/PaymentSection";
import { Process } from "@/components/Process";
import { FAQ } from "@/components/FAQ";
import { FinalCTA } from "@/components/FinalCTA";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";

/**
 * Misma landing de antes; solo cambia la portada y el recorrido del scroll:
 *  portada → zoom a la cámara del iPhone → Modelos y precios
 *          → zoom al cartel "Aceptamos cuotas" → Formas de pago
 *  y después el resto de las secciones en el orden de siempre.
 */
export default function App() {
  return (
    <AnimationProvider>
      <PhoneStageProvider>
        <div className="relative min-h-dvh overflow-x-clip">
          <Background />
          <TopBar />
          <main>
            <ScrollScene camaraPanel={<ProductCards />} cartelPanel={<PaymentSection />} />
            <Benefits />
            {/* Incluye el desarme del 14 Pro con el scroll (Despiece). */}
            <PhoneDetail />
            <Comparison />
            <Process />
            <FAQ />
            <FinalCTA />
          </main>
          <Footer />
          <FloatingActions />
        </div>
      </PhoneStageProvider>
    </AnimationProvider>
  );
}
