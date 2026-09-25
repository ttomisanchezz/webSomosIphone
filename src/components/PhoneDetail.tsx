import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Container, Reveal, SectionHeading, SpotlightCard } from "@/components/ui";
import { PhoneViewport } from "@/three/PhoneStage";
import { HERO_MODEL } from "@/three/models";
import { Icon } from "@/components/icons";
import { Despiece } from "@/components/Despiece";
import { ScrollTrigger } from "@/anim/gsap";
import { allowHeavy } from "@/anim/motion";
import { detailBlocks } from "@/data/content";

export function PhoneDetail() {
  const sectionRef = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  // Momento clave: el visual 3D se fija (pin) mientras el contenido se anima.
  useGSAP(
    () => {
      if (!allowHeavy()) return;
      const sec = sectionRef.current;
      const vis = visualRef.current;
      if (!sec || !vis) return;
      const st = ScrollTrigger.create({
        trigger: sec,
        start: "top 14%",
        end: "+=360",
        pin: vis,
        pinSpacing: true,
        anticipatePin: 1,
      });
      return () => st.kill();
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="detalle"
      ref={sectionRef}
      className="scroll-mt-28 py-20 sm:py-28"
      // En celular index.css difiere el pintado de las secciones fuera de
      // pantalla (content-visibility). Con el desarme adentro rompería el
      // sticky y las medidas del ScrollTrigger: esta se pinta normal.
      style={{ contentVisibility: "visible" }}
    >
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:items-start">
          {/* Visual — mismo 3D flotante del Home (se fija con el scroll) */}
          <div className="lg:col-span-5">
            <div
              ref={visualRef}
              className="glass relative overflow-hidden rounded-3xl p-6 sm:p-8"
            >
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-silver/[0.08] blur-[90px]" />
              <PhoneViewport
                interactive
                model={HERO_MODEL}
                tint={false}
                // Negro Espacial: color oficial del 14 Pro.
                color="#2c2c2e"
                className="relative mx-auto h-80 w-full sm:h-[26rem]"
              />
              <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-ink-900/60 px-3 py-1 text-[11px] text-slate-400 backdrop-blur-md">
                Arrastrá para girar
              </div>
            </div>
          </div>

          {/* Copy */}
          <div className="lg:col-span-7">
            <Reveal>
              <SectionHeading
                align="left"
                eyebrow="El más llevado"
                title={
                  <>
                    El que más se lleva:{" "}
                    iPhone 14 Pro
                  </>
                }
                description="Es el que más sale: cámara Pro y Dynamic Island a precio de usado verificado. Girá el equipo y miralo en 3D."
              />
            </Reveal>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {detailBlocks.map((b, i) => (
                <Reveal key={b.title} delay={i * 60}>
                  <SpotlightCard tilt className="p-5">
                    <div className="flex gap-4">
                      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink-700 text-silver ring-1 ring-inset ring-white/10 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:ring-accent-300/40">
                        <Icon name={b.icon} className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-semibold text-white transition-colors duration-300 group-hover:text-accent-300">
                          {b.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-400">
                          {b.text}
                        </p>
                      </div>
                    </div>
                  </SpotlightCard>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </Container>

      {/* Al seguir bajando, el mismo 14 Pro se desarma pieza por pieza. */}
      <Despiece />
    </section>
  );
}
