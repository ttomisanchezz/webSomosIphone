import { useState } from "react";
import { cn } from "@/utils/cn";
import { Container, Reveal, SectionHeading } from "@/components/ui";
import { ChevronDownIcon } from "@/components/icons";
import { faqItems } from "@/data/content";

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 py-20 sm:py-28">
      <Container className="max-w-3xl">
        <Reveal>
          <SectionHeading
            eyebrow="FAQ"
            title="Preguntas frecuentes"
            description="Todo lo que necesitás saber antes de coordinar tu compra."
          />
        </Reveal>

        <div className="mt-10 space-y-3">
          {faqItems.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={i * 40}>
                <div
                  className={cn(
                    "glass glass-azul overflow-hidden rounded-xl transition-colors duration-300",
                    isOpen && "border-azul/50!"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[15px] font-medium text-white">
                      {item.q}
                    </span>
                    <ChevronDownIcon
                      className={cn(
                        "h-5 w-5 shrink-0 text-azul-claro transition-transform duration-300",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-300 ease-out",
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
