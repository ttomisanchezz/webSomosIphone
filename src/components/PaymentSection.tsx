import {
  Container,
  Reveal,
  SectionHeading,
  SpotlightCard,
  Button,
} from "@/components/ui";
import { Icon, WhatsAppIcon } from "@/components/icons";
import {
  CUOTAS_MAX,
  MEDIOS_CUOTAS,
  payments,
  textoCuotas,
} from "@/data/content";
import { waCuotas } from "@/data/site";

export function PaymentSection() {
  return (
    <section id="financiacion" className="scroll-mt-24 py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Financiación y pagos"
            title={
              <>
                Comprá de forma simple
              </>
            }
            description={textoCuotas}
          />
        </Reveal>

        {/* Las dos formas de comprar. Cuotas va destacada y más ancha: es la
            que necesita explicación y la que lleva el CTA. */}
        <div className="mx-auto mt-14 grid max-w-5xl gap-5 lg:grid-cols-5">
          <Reveal className="lg:col-span-2">
            <SpotlightCard className="glass-azul p-6 sm:p-8" glow="rgba(46,123,255,0.14)">
              <div className="flex h-full flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-azul-claro/80">
                  Opción 1
                </span>
                <h3 className="mt-3 font-display text-2xl font-semibold text-white">
                  Contado
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-base">
                  Pagás el total y te llevás el iPhone en el momento.
                </p>
                <p className="mt-auto pt-6 text-xs text-slate-500">
                  Transferencia, Mercado Pago o efectivo.
                </p>
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal className="lg:col-span-3" delay={80}>
            <div className="glass glass-azul relative h-full overflow-hidden rounded-2xl border-azul/40! p-6 sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-azul/20 blur-[90px]" />

              <div className="relative">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-azul-claro">
                  Opción 2
                </span>
                <h3 className="mt-3 font-display text-2xl font-semibold text-white">
                  Hasta {CUOTAS_MAX} cuotas
                </h3>

                <ol className="mt-5 space-y-3">
                  {[
                    ["1", "Dejás una entrega inicial y te llevás tu iPhone."],
                    ["2", `Pagás el resto en hasta ${CUOTAS_MAX} cuotas, en las fechas que acordamos en el compromiso de pago.`],
                    ["3", `Cada cuota, ${MEDIOS_CUOTAS}.`],
                  ].map(([n, t]) => (
                    <li key={n} className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-azul/20 font-display text-sm font-semibold text-azul-claro">
                        {n}
                      </span>
                      <span className="pt-0.5 text-sm leading-relaxed text-slate-300 sm:text-base">{t}</span>
                    </li>
                  ))}
                </ol>

                <p className="mt-6 text-sm leading-relaxed text-slate-300 sm:text-base">
                  La entrega inicial depende del equipo: mandanos qué iPhone
                  querés y te la pasamos.
                </p>

                <Button
                  href={waCuotas()}
                  target="_blank"
                  variant="whatsapp"
                  size="lg"
                  className="mt-6 w-full sm:w-auto"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Consultar
                </Button>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Medios de pago */}
        <Reveal>
          <h3 className="mt-16 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Medios de pago
          </h3>
        </Reveal>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {payments.map((p, i) => (
            <Reveal key={p.title} delay={i * 60}>
              <SpotlightCard tilt className="glass-azul p-5" glow="rgba(46,123,255,0.14)">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-azul/15 text-azul-claro ring-1 ring-inset ring-azul/25 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:ring-azul/50">
                    <Icon name={p.icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-white transition-colors duration-300 group-hover:text-azul-claro">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">
                      {p.text}
                    </p>
                  </div>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mx-auto mt-8 max-w-xl text-center text-xs text-slate-500">
            Las opciones de pago pueden variar según el modelo y el stock
            disponible.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
