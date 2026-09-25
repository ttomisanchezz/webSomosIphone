import { Container, Reveal, Button, Eyebrow } from "@/components/ui";
import { WhatsAppIcon } from "@/components/icons";
import { Magnetic } from "@/anim/Magnetic";
import { useSplitReveal } from "@/anim/useSplitReveal";
import { waLink } from "@/data/site";

export function FinalCTA() {
  const titleRef = useSplitReveal<HTMLHeadingElement>();

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <Reveal>
          <div className="glass glass-azul relative overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12 sm:py-20">
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-azul/20 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-azul/10 blur-[110px]" />

            <div className="relative">
              <Eyebrow>Empezá ahora</Eyebrow>
              <h2
                ref={titleRef}
                className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl"
              >
                Tu próximo iPhone empieza acá
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
                Consultá stock, modelos disponibles y opciones de pago en
                minutos.
              </p>

              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
                <Magnetic className="w-full sm:w-auto">
                  <Button
                    href="#modelos"
                    size="lg"
                    variant="secondary"
                    icon
                    className="w-full justify-center sm:w-auto"
                  >
                    Ver modelos
                  </Button>
                </Magnetic>
                <Magnetic className="w-full sm:w-auto">
                  <Button
                    href={waLink()}
                    target="_blank"
                    size="lg"
                    variant="whatsapp"
                    className="w-full justify-center sm:w-auto"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    Hablar por WhatsApp
                  </Button>
                </Magnetic>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
