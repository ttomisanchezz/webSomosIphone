import { Header } from "@/components/Header";
import { TrustMarquee } from "@/components/TrustMarquee";

/**
 * Barra superior fija: el marquee de confianza queda SIEMPRE arriba del header.
 */
export function TopBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <TrustMarquee />
      <Header />
    </div>
  );
}
