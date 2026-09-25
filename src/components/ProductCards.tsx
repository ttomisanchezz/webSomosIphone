import { useEffect, useRef, useState } from "react";
import { Container, Reveal, SectionHeading, Button } from "@/components/ui";
import { PhoneViewport } from "@/three/PhoneStage";
import { CARD_MODELS } from "@/three/models";
import { BatteryBar } from "@/components/BatteryBar";
import { WhatsAppIcon } from "@/components/icons";
import { ScrollTrigger } from "@/anim/gsap";
import { cn } from "@/utils/cn";
import {
  NEW_IPHONES,
  PRECIOS_ACTUALIZADOS,
  USED_IPHONES,
  formatARS,
  formatBattery,
  type BatteryOption,
  type iPhoneProduct,
} from "@/data/products";
import { waProduct } from "@/data/site";

type Tab = "nuevo" | "usado";

/**
 * Flex con ancho fijo por card en vez de grid: así la última fila, si queda
 * incompleta, se centra en lugar de quedar pegada a la izquierda. Las
 * columnas dependen de cuántos equipos haya: con 5 sellados, 3 + 2 se ve
 * mejor que 4 + 1 suelto. Los calc descuentan el gap-5 (1.25rem).
 */
function gridLayout(n: number): { wrap: string; item: string } {
  const dos = "sm:w-[calc(50%-0.625rem)]";
  const tres = "lg:w-[calc(33.333%-0.834rem)]";
  const cuatro = "xl:w-[calc(25%-0.9375rem)]";
  if (n <= 2) return { wrap: "mx-auto max-w-3xl", item: dos };
  if (n <= 6 && n !== 4)
    return { wrap: "mx-auto max-w-5xl", item: `${dos} ${tres}` };
  return { wrap: "", item: `${dos} ${tres} ${cuatro}` };
}

/** Texto del WhatsApp: con condición y la batería elegida, así se sabe cuál
 *  de las opciones (100% / +85%) le interesa a la persona. */
function waMensajeProducto(
  p: iPhoneProduct,
  color: string,
  option: BatteryOption
): string {
  const detalle = [
    color,
    p.condition === "usado" ? `batería ${formatBattery(option.health)}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const condicion = p.condition === "usado" ? "usado" : "sellado";
  return `${p.model} ${condicion} (${detalle})`;
}

export function ProductCards() {
  const [tab, setTab] = useState<Tab>("usado");
  const list = tab === "nuevo" ? NEW_IPHONES : USED_IPHONES;
  const layout = gridLayout(list.length);

  // Al cambiar de pestaña la grilla cambia de alto → recalcular los triggers
  // de las secciones de abajo para que los scrubs midan bien. Al cargar no
  // hace falta: ya lo hace AnimationProvider.
  const firstTab = useRef(true);
  useEffect(() => {
    if (firstTab.current) {
      firstTab.current = false;
      return;
    }
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 60);
    return () => window.clearTimeout(t);
  }, [tab]);

  return (
    <section id="modelos" className="scroll-mt-28 py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Modelos disponibles"
            title={
              <>
                Elegí tu iPhone ideal en
                Neuquén
              </>
            }
            description="Equipos nuevos sellados y usados verificados. Cambiá entre las dos opciones y elegí el color."
          />
        </Reveal>

        {/* Toggle Sellados / Usados */}
        <Reveal>
          <div className="mt-10 flex justify-center">
            <div
              role="tablist"
              aria-label="Tipo de equipo"
              className="glass inline-flex items-center gap-1 rounded-full p-1.5"
            >
              <TabButton
                active={tab === "nuevo"}
                onClick={() => setTab("nuevo")}
                label="Sellados"
                hint={`${NEW_IPHONES.length} modelos`}
              />
              <TabButton
                active={tab === "usado"}
                onClick={() => setTab("usado")}
                label="Usados"
                hint={`${USED_IPHONES.length} modelos`}
              />
            </div>
          </div>
        </Reveal>

        {/* Grilla — key por tab para re-montar (re-dispara batería y 3D) */}
        <div
          key={tab}
          className={cn("mt-12 flex flex-wrap justify-center gap-5", layout.wrap)}
        >
          {list.map((p, i) => (
            <Reveal key={p.id} delay={i * 60} className={cn("w-full", layout.item)}>
              <ProductCard
                product={p}
                model={p.model3d ?? CARD_MODELS[i % CARD_MODELS.length]}
              />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mt-8 text-center text-xs text-slate-500">
            Precios de referencia en pesos, actualizados al{" "}
            {PRECIOS_ACTUALIZADOS} · Confirmá stock, color y condición por
            WhatsApp antes de coordinar.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative inline-flex min-h-11 cursor-pointer items-center rounded-full px-6 py-2.5 text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300/70 active:scale-95",
        active
          ? "bg-cta text-brand-black shadow-[0_0_25px_rgba(255,255,255,0.10)]"
          : "text-slate-300 hover:text-white"
      )}
    >
      {label}
      <span
        className={cn(
          "ml-2 text-[10px] font-medium",
          active ? "text-brand-black/60" : "text-slate-500"
        )}
      >
        {hint}
      </span>
    </button>
  );
}

function ProductCard({
  product,
  model,
}: {
  product: iPhoneProduct;
  model: string;
}) {
  const [color, setColor] = useState(product.colors[0]);
  const [option, setOption] = useState(product.options[0]);
  const isUsed = product.condition === "usado";
  const hasPrice = product.options.some((o) => o.price);

  return (
    <article className="glass group flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:border-line-highlight hover:shadow-[0_28px_70px_-26px_rgba(0,0,0,0.7)]">
      {/* Showcase 3D */}
      <div className="relative flex h-60 items-center justify-center overflow-hidden bg-gradient-to-b from-white/[0.06] to-transparent">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-silver/[0.08] blur-3xl" />
        {product.badge ? (
          <span className="absolute right-3 top-3 z-10 rounded-full border border-line bg-ink-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-silver-light">
            {product.badge}
          </span>
        ) : null}
        <PhoneViewport
          color={color.hex}
          model={model}
          className="relative h-full w-full"
        />
      </div>

      {/* Cuerpo */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold text-white">
          {product.model}
        </h3>
        <p className="text-sm text-slate-400">{product.tagline}</p>

        {/* Con etiqueta: "A consultar" suelto no se entendía a qué se refería. */}
        <p className="mt-3 text-xs uppercase tracking-wider text-slate-500">
          Capacidad: {product.capacity}
        </p>

        {/* Colores (funcional: cambia el 3D) */}
        <div className="mt-2">
          <div className="-ml-2 flex flex-wrap items-center">
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                title={c.name}
                aria-label={`Color ${c.name}`}
                aria-pressed={color.name === c.name}
                onClick={() => setColor(c)}
                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300/70"
              >
                <span
                  className={cn(
                    "h-6 w-6 rounded-full ring-1 ring-inset ring-white/20 transition-transform",
                    color.name === c.name
                      ? "scale-110 ring-2 ring-accent-300 ring-offset-2 ring-offset-ink-900"
                      : "hover:scale-110"
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">{color.name}</p>
        </div>

        {/* Batería: sigue a la condición elegida */}
        <BatteryBar health={option.health} className="mt-4" />

        {/* Precio: con varias condiciones, un selector con los precios de
            cada una (en vez de repetir el modelo en otra card). */}
        <div className="mt-4 flex-1">
          {product.options.length > 1 ? (
            <BatteryPicker
              options={product.options}
              selected={option}
              onSelect={setOption}
            />
          ) : (
            <div
              className={
                option.price
                  ? "font-display text-2xl font-semibold text-white"
                  : "font-display text-lg font-semibold text-slate-200"
              }
            >
              {option.price ? formatARS(option.price) : "Precio a consultar"}
            </div>
          )}
          {hasPrice ? (
            <div className="text-xs font-medium text-accent-300/90">
              Precio de referencia
            </div>
          ) : null}
          <div className="text-xs text-slate-500">
            {isUsed ? "Usado · garantía local" : "Sellado · garantía oficial"}
          </div>
        </div>

        {/* CTA — solo consulta por WhatsApp */}
        <div className="mt-5">
          <Button
            href={waProduct(waMensajeProducto(product, color.name, option))}
            target="_blank"
            variant="primary"
            size="md"
            className="w-full"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Consultar por WhatsApp
          </Button>
        </div>
      </div>
    </article>
  );
}

/** Botones de condición de batería, cada uno con su precio: se ven todos los
 *  precios a la vez y el elegido mueve la barra y va en el WhatsApp. */
function BatteryPicker({
  options,
  selected,
  onSelect,
}: {
  options: BatteryOption[];
  selected: BatteryOption;
  onSelect: (o: BatteryOption) => void;
}) {
  return (
    <div className="mb-2">
      <p className="mb-2 text-xs text-slate-400">Elegí la condición de batería</p>
      <div
        role="group"
        aria-label="Condición de batería"
        className="grid grid-cols-2 gap-2"
      >
        {options.map((o) => {
          const active = o === selected;
          return (
            <button
              key={o.health}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(o)}
              className={cn(
                "flex min-h-11 cursor-pointer flex-col items-start rounded-xl border px-3 py-2 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-300/70 active:scale-[0.98]",
                active
                  ? "border-silver bg-card-hover"
                  : "border-card-border bg-white/[0.03] hover:border-line-highlight"
              )}
            >
              <span
                className={cn(
                  "text-[11px] font-medium",
                  active ? "text-accent-200" : "text-slate-400"
                )}
              >
                Batería {formatBattery(o.health)}
              </span>
              <span
                className={cn(
                  "font-display text-lg font-semibold tabular-nums",
                  active ? "text-white" : "text-slate-300"
                )}
              >
                {o.price ? formatARS(o.price) : "A consultar"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
