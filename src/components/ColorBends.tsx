import { cn } from "@/utils/cn";

/**
 * Fondo animado "color bends" (equivalente propio al de ReactBits): bandas
 * grafito/plata que fluyen sobre la base negra, con un brillo plata sutil
 * detrás de los iPhone. Hecho con CSS (liviano, sin WebGL).
 */
export function ColorBends({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      {/* base dark */}
      <div className="absolute inset-0 bg-ink-950" />
      {/* bandas grafito/plata que fluyen */}
      <div className="color-bends absolute inset-[-25%]" />
      {/* brillo plata detrás de los iPhone */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 65% 50%, rgba(196,196,196,0.10), transparent 40%)",
        }}
      />
      {/* fade superior para contraste del header/texto */}
      <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-ink-950 via-ink-950/40 to-transparent" />

      {/* Fundido inferior. Sin esto las bandas de color terminan de golpe
          justo donde arranca la sección siguiente y se ve una línea recta
          cruzando la pantalla. El degradado largo (40%) las apaga contra el
          mismo ink-950 del fondo general, así el corte deja de existir. */}
      <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-ink-950 via-ink-950/80 to-transparent" />
    </div>
  );
}
