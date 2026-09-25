import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { WhatsAppIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { waLink } from "@/data/site";

export function FloatingActions() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Floating WhatsApp — solo desktop. En mobile tapaba texto de las
          secciones y repetía el botón verde de la barra fija de abajo. */}
      <a
        href={waLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Consultar por WhatsApp"
        className="group fixed bottom-6 right-4 z-50 hidden items-center justify-center gap-2.5 rounded-full border border-line bg-ink-800/80 px-5 py-3.5 text-white shadow-[0_12px_36px_-14px_rgba(0,0,0,0.7)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-silver hover:bg-ink-700/85 focus:outline-none focus-visible:ring-2 focus-visible:ring-silver/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 active:scale-95 lg:inline-flex"
      >
        {/* Pulso gris: el verde queda solo en el ícono. */}
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-silver/15 [animation-duration:3s]" />
        <WhatsAppIcon className="h-5 w-5 text-wa" />
        <span className="text-sm font-semibold text-white">Consultar</span>
      </a>

      {/* Sticky mobile CTA */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 lg:hidden",
          show ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="glass-strong flex items-center gap-3 border-t border-line px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {/* Secundario: al lado va WhatsApp, que es el botón principal. */}
          <Button href="#modelos" variant="secondary" size="md" className="flex-1">
            Ver modelos
          </Button>
          <Button
            href={waLink()}
            target="_blank"
            variant="whatsapp"
            size="md"
            className="flex-1"
          >
            <WhatsAppIcon className="h-5 w-5" />
            WhatsApp
          </Button>
        </div>
      </div>
    </>
  );
}
