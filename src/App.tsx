import { Background } from "@/components/ui";
import { AnimationProvider } from "@/anim/AnimationProvider";
import { PhoneStageProvider } from "@/three/PhoneStage";
import { TopBar } from "@/components/TopBar";
import { Hero } from "@/components/Hero";
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

export default function App() {
  return (
    <AnimationProvider>
      <PhoneStageProvider>
        <div className="relative min-h-dvh overflow-x-clip">
          <Background />
          {/* Marquee + Header (el marquee queda arriba del header) */}
          <TopBar />
          <main>
            <Hero />
            <ProductCards />
            <Benefits />
            {/* Incluye el desarme del 14 Pro con el scroll (Despiece). */}
            <PhoneDetail />
            <Comparison />
            <PaymentSection />
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
