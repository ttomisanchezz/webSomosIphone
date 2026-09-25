import { Button, Reveal } from "@/components/ui";
import { InstagramIcon } from "@/components/icons";
import { historiasClientes } from "@/data/fotosCredibilidad";
import { site } from "@/data/site";

/**
 * Tira de historias de Instagram que compartieron clientes. Se muestran
 * enteras, en formato vertical, moviéndose solas (mismo marquee CSS que la
 * barra de arriba). Con reduced-motion queda quieta y se scrollea a mano.
 */
export function ClientStories() {
  if (historiasClientes.length === 0) return null;

  return (
    <div className="mt-20">
      <Reveal>
        <div className="flex flex-col items-center text-center">
          <h3 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Lo que dicen los que ya compraron
          </h3>
          <p className="mt-2 text-sm text-slate-400 sm:text-base">
            Historias reales que nos compartieron por Instagram.
          </p>
        </div>
      </Reveal>

      <Reveal>
        <div className="group relative mt-8 overflow-hidden motion-reduce:overflow-x-auto">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-ink-950 to-transparent motion-reduce:hidden sm:w-20" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-ink-950 to-transparent motion-reduce:hidden sm:w-20" />
          {/* Dos copias iguales: el marquee corre -50% y vuelve sin salto. */}
          <div className="animate-marquee flex w-max [animation-duration:45s] group-hover:[animation-play-state:paused] motion-reduce:animate-none">
            <Tira />
            <Tira copia />
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div className="mt-8 flex justify-center">
          <Button href={site.social.instagram} target="_blank" variant="secondary" size="md">
            <InstagramIcon className="h-4 w-4" />
            Ver más en Instagram
          </Button>
        </div>
      </Reveal>
    </div>
  );
}

function Tira({ copia = false }: { copia?: boolean }) {
  return (
    <ul
      className={
        "flex shrink-0 gap-4 pr-4" + (copia ? " motion-reduce:hidden" : "")
      }
      aria-hidden={copia || undefined}
    >
      {historiasClientes.map((src, i) => (
        <li
          key={src}
          className="w-44 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)] sm:w-52"
        >
          <img
            src={src}
            alt={copia ? "" : `Historia de Instagram de un cliente de ${site.brand} (${i + 1})`}
            loading="lazy"
            decoding="async"
            className="aspect-[10/16] w-full object-cover"
          />
        </li>
      ))}
    </ul>
  );
}
