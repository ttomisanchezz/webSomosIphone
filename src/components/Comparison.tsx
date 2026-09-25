import { Container, Reveal, SectionHeading, Button } from "@/components/ui";
import { comparisonRows, comparisonAttributes } from "@/data/content";
import { waProduct } from "@/data/site";
import { cn } from "@/utils/cn";

export function Comparison() {
  return (
    <section id="comparativa" className="scroll-mt-24 py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Comparativa"
            title={
              <>
                Compará modelos antes de elegir
              </>
            }
            description="Precios de referencia de equipos usados sobre el stock actual. Confirmá disponibilidad y capacidades por WhatsApp."
          />
        </Reveal>

        {/* Desktop matrix — la tabla scrollea sola si la ventana no da. */}
        <Reveal className="mt-12 hidden lg:block">
          <div className="glass glass-azul overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[62rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 font-medium text-slate-500">Modelo</th>
                  {comparisonRows.map((r) => (
                    <th
                      key={r.modelo}
                      className={cn(
                        "p-4 align-bottom",
                        r.destacado && "bg-azul/15"
                      )}
                    >
                      {r.destacado ? (
                        <span className="mb-1.5 inline-block rounded-full bg-azul/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-azul-claro">
                          Más llevado
                        </span>
                      ) : null}
                      <div className="font-display text-[15px] font-semibold text-white">
                        {r.modelo}
                      </div>
                      <div className="mt-0.5 text-xs font-normal text-azul-claro">
                        {r.precio}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonAttributes.map((attr) => (
                  <tr
                    key={attr.key}
                    className="border-b border-white/[0.06] last:border-0"
                  >
                    <td className="p-4 font-medium text-slate-400">
                      {attr.label}
                    </td>
                    {comparisonRows.map((r) => (
                      <td
                        key={r.modelo}
                        className={cn(
                          "p-4 text-slate-200",
                          r.destacado && "bg-azul/[0.09]"
                        )}
                      >
                        {r[attr.key]}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="p-4" />
                  {comparisonRows.map((r) => (
                    <td
                      key={r.modelo}
                      className={cn("p-4", r.destacado && "bg-azul/[0.09]")}
                    >
                      <Button
                        href={waProduct(`${r.modelo} usado`)}
                        target="_blank"
                        variant={r.destacado ? "primary" : "secondary"}
                        size="md"
                      >
                        Consultar
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Reveal>

        {/* Mobile cards */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:hidden">
          {comparisonRows.map((r, i) => (
            <Reveal key={r.modelo} delay={i * 60}>
              <div
                className={cn(
                  "glass glass-azul h-full rounded-2xl p-5",
                  r.destacado && "border-azul/50!"
                )}
              >
                {r.destacado ? (
                  <span className="mb-2 inline-block rounded-full bg-azul/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-azul-claro">
                    Más llevado
                  </span>
                ) : null}
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-base font-semibold text-white">
                    {r.modelo}
                  </h3>
                  <span className="font-display text-sm font-semibold text-azul-claro">
                    {r.precio}
                  </span>
                </div>
                <dl className="mt-4 space-y-2.5 text-sm">
                  {comparisonAttributes
                    .filter((a) => a.key !== "precio")
                    .map((attr) => (
                      <div key={attr.key} className="flex flex-col gap-0.5">
                        <dt className="text-xs uppercase tracking-wider text-slate-500">
                          {attr.label}
                        </dt>
                        <dd className="text-slate-200">{r[attr.key]}</dd>
                      </div>
                    ))}
                </dl>
                <Button
                  href={waProduct(`${r.modelo} usado`)}
                  target="_blank"
                  variant={r.destacado ? "primary" : "secondary"}
                  size="md"
                  className="mt-5 w-full"
                >
                  Consultar
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
