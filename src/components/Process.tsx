import { Container, Reveal, SectionHeading } from "@/components/ui";
import { processSteps } from "@/data/content";

export function Process() {
  return (
    <section id="proceso" className="scroll-mt-24 py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Proceso"
            title={
              <>
                Cómo comprar
              </>
            }
            description="Cuatro pasos simples, de la elección a la entrega."
          />
        </Reveal>

        <Reveal className="relative mt-14">
          {/* horizontal line (desktop) */}
          <div className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-azul/50 to-transparent lg:block" />
          {/* vertical line (mobile) */}
          <div className="absolute bottom-3 left-[1.35rem] top-3 w-px bg-gradient-to-b from-azul/50 via-azul/20 to-transparent lg:hidden" />

          <div className="grid gap-8 lg:grid-cols-4 lg:gap-6">
            {processSteps.map((s) => (
              <div key={s.step} className="relative pl-16 lg:pl-0">
                <div className="absolute left-0 top-0 inline-flex h-11 w-11 items-center justify-center rounded-full border border-azul/45 bg-ink-900 bg-gradient-to-br from-azul/25 to-azul/5 font-display text-sm font-semibold text-azul-claro shadow-[0_0_26px_-6px_rgba(46,123,255,0.55)] lg:static lg:mb-5">
                  {s.step}
                </div>
                <h3 className="font-display text-lg font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-slate-400">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
