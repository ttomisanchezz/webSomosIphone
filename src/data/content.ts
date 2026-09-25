// ─────────────────────────────────────────────────────────────
//  EDITABLE CONTENT
//  Todos los textos comerciales (precios, stock, garantía, etc.)
//  viven acá para editarlos sin tocar el diseño.
// ─────────────────────────────────────────────────────────────

import { USED_IPHONES, formatARS } from "@/data/products";

// ── Financiación ─────────────────────────────────────────────
// Dos formas de comprar: contado, o entrega inicial + hasta CUOTAS_MAX cuotas.
// La entrega inicial depende de cada equipo, así que no se publica un
// porcentaje: el CTA de la sección manda a preguntarla por WhatsApp. Las
// fechas de las cuotas quedan en el compromiso de pago; se pagan en efectivo
// o por transferencia. Cambiando esto se actualizan Financiación, el
// beneficio y la FAQ.
export const CUOTAS_MAX = 2;
export const MEDIOS_CUOTAS = "en efectivo o por transferencia";

export const textoCuotas = `Dejás una entrega inicial, te llevás tu iPhone y pagás el resto en hasta ${CUOTAS_MAX} cuotas, ${MEDIOS_CUOTAS}.`;

// ── Comparativa ──────────────────────────────────────────────
export interface ComparisonRow {
  modelo: string;
  ideal: string;
  diseno: string;
  camara: string;
  bateria: string;
  precio: string;
  /** Columna resaltada. Va en el modelo que más se vende, no en el más caro. */
  destacado?: boolean;
}

// Los precios salen de los usados del catalogo (products.ts). Escritos a
// mano aca quedaban desfasados del precio real de la card apenas se tocaba
// uno. Si el modelo tiene varias condiciones de batería, va el más barato
// con "Desde".
function precioDe(modelo: string): string {
  const precios = USED_IPHONES.filter((p) => p.model === modelo)
    .flatMap((p) => p.options.map((o) => o.price))
    .filter((precio): precio is number => precio != null);
  if (precios.length === 0) return "A consultar";
  const min = formatARS(Math.min(...precios));
  return new Set(precios).size > 1 ? `Desde ${min}` : min;
}

const comparisonBase: Omit<ComparisonRow, "precio">[] = [
  {
    modelo: "iPhone 16 Pro",
    ideal: "Premium con muy buen valor",
    diseno: "Titanio",
    camara: "Sistema Pro",
    bateria: "Buen rendimiento",
  },
  {
    modelo: "iPhone 15 Pro",
    ideal: "Titanio en tamaño justo",
    diseno: "Titanio · USB-C",
    camara: "Sistema Pro",
    bateria: "Rinde todo el día",
  },
  {
    modelo: "iPhone 14 Pro",
    ideal: "El que más se lleva: Pro a precio de usado",
    diseno: "Acero inoxidable · Dynamic Island",
    camara: "Sistema Pro triple",
    bateria: "Verificada antes de entregar",
    destacado: true,
  },
  {
    modelo: "iPhone 13",
    ideal: "Primer iPhone o cambio económico",
    diseno: "Aluminio y vidrio",
    camara: "Cámara dual",
    bateria: "Verificada antes de entregar",
  },
];

export const comparisonRows: ComparisonRow[] = comparisonBase.map((r) => ({
  ...r,
  precio: precioDe(r.modelo),
}));

export const comparisonAttributes: { key: keyof ComparisonRow; label: string }[] =
  [
    { key: "ideal", label: "Ideal para" },
    { key: "diseno", label: "Diseño" },
    { key: "camara", label: "Cámara" },
    { key: "bateria", label: "Batería" },
    { key: "precio", label: "Precio" },
  ];

// ── Beneficios ───────────────────────────────────────────────
export interface Benefit {
  icon: string;
  title: string;
  text: string;
  /** Si es true, la card ocupa más espacio en el bento grid (destacada). */
  featured?: boolean;
  /** Etiqueta opcional para reforzar confianza local. */
  tag?: string;
}

export const benefits: Benefit[] = [
  {
    icon: "shield",
    title: "Entrega en mano en Neuquén",
    text: "Nos encontramos en Neuquén Capital y coordinamos la entrega en persona. Revisás el equipo, lo probás y recién ahí pagás. Sin sorpresas.",
    featured: true,
    tag: "Local · NQN",
  },
  {
    icon: "badge",
    title: "Probá el equipo antes de pagar",
    text: "Encendés el iPhone, verificás batería, cámara y pantalla con vos presente.",
    tag: "Local · NQN",
  },
  {
    icon: "chat",
    title: "Atención por WhatsApp",
    text: "Te respondemos rápido y te asesoramos para elegir el modelo ideal.",
    tag: "Local · NQN",
  },
  {
    icon: "clipboard",
    title: "Equipos verificados",
    text: "Cada usado pasa control de batería, pantalla, cámara, Face ID y botones.",
  },
  {
    icon: "card",
    title: `Hasta ${CUOTAS_MAX} cuotas`,
    text: `Dejás una entrega inicial, te lo llevás y pagás el resto en hasta ${CUOTAS_MAX} cuotas.`,
  },
  {
    icon: "transfer",
    title: "Tomamos tu usado",
    text: "Entregá tu iPhone actual como parte de pago y achicá la diferencia.",
    tag: "Parte de pago",
  },
  {
    icon: "lock",
    title: "Garantía local 3 meses",
    text: "Los usados incluyen garantía local. Los nuevos, garantía oficial de 1 año.",
  },
  {
    icon: "truck",
    title: "Envíos a toda la provincia",
    text: "Si estás fuera de la capital, coordinamos envío seguro a tu localidad.",
  },
  {
    icon: "bolt",
    title: "Batería verificada",
    text: "Te decimos la salud exacta de la batería de cada usado antes de que compres.",
  },
];

// ── Stats / contadores animados ──────────────────────────────
export interface Stat {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

// Solo lo que podemos sostener: no hay recuento de clientes ni promedio de
// reseñas publicado, y publicarlos inventados es publicidad engañosa.
export const stats: Stat[] = [
  { value: 100, suffix: "%", label: "equipos verificados" },
  { value: 24, suffix: "h", label: "respuesta por WhatsApp" },
];

// ── Medios de pago ───────────────────────────────────────────
export interface Payment {
  icon: string;
  title: string;
  text: string;
}

export const payments: Payment[] = [
  { icon: "transfer", title: "Transferencia", text: "Rápida y sin complicaciones." },
  { icon: "wallet", title: "Mercado Pago", text: "Consultá disponibilidad al comprar." },
  { icon: "cash", title: "Efectivo", text: "Coordiná el pago en efectivo con un asesor." },
  { icon: "phone", title: "Reserva por WhatsApp", text: "Reservá tu equipo con un mensaje." },
];

// ── Proceso de compra ────────────────────────────────────────
export interface ProcessStep {
  step: string;
  title: string;
  text: string;
}

export const processSteps: ProcessStep[] = [
  {
    step: "01",
    title: "Elegí el modelo",
    text: "Explorá los modelos y capacidades disponibles.",
  },
  {
    step: "02",
    title: "Consultá stock y precio",
    text: "Confirmá disponibilidad y precio actualizado por WhatsApp.",
  },
  {
    step: "03",
    title: "Coordiná el pago",
    text: "Elegí la forma de pago que mejor te sirva.",
  },
  {
    step: "04",
    title: "Recibí tu iPhone",
    text: "Coordiná la entrega o el retiro de tu equipo.",
  },
];

// ── FAQ ──────────────────────────────────────────────────────
export interface FaqItem {
  q: string;
  a: string;
}

// Las respuestas repiten solo lo que ya promete el resto del sitio
// (beneficios, financiación): si cambia una condición, cambiarla en los dos.
export const faqItems: FaqItem[] = [
  {
    q: "¿Cómo funcionan las cuotas?",
    a: `${textoCuotas} La entrega inicial depende del equipo: escribinos por WhatsApp con el iPhone que querés y te la pasamos. Las fechas de cada cuota quedan acordadas en el compromiso de pago.`,
  },
  {
    q: "¿Qué formas de pago aceptan?",
    a: `De contado por transferencia, Mercado Pago o efectivo. En cuotas: una entrega inicial y el resto en hasta ${CUOTAS_MAX} cuotas, ${MEDIOS_CUOTAS}.`,
  },
  {
    q: "¿Qué garantía tienen los equipos?",
    a: "Los usados tienen garantía local de 3 meses. Los nuevos sellados, garantía oficial de 1 año.",
  },
  {
    q: "¿Cómo revisan los usados?",
    a: "Cada usado pasa control de batería, pantalla, cámara, Face ID y botones. Te decimos la salud exacta de la batería antes de comprar, y en la entrega lo probás con vos presente antes de pagar.",
  },
  {
    q: "¿Toman mi iPhone como parte de pago?",
    a: "Sí. Mandanos por WhatsApp el modelo, la capacidad y la salud de batería de tu equipo y te lo cotizamos.",
  },
  {
    q: "¿Los precios están actualizados?",
    a: "Los precios pueden variar según stock y cotización. Consultá por WhatsApp para confirmar el precio actual.",
  },
  {
    q: "¿Hacen envíos?",
    a: "Sí. Entregamos en mano en Neuquén Capital y coordinamos envíos a toda la provincia.",
  },
  {
    q: "¿Puedo reservar un equipo?",
    a: "Sí, se puede consultar disponibilidad y coordinar reserva.",
  },
];

// ── Detalle del iPhone 14 Pro (el más llevado) ───────────────
// Specs reales del 14 Pro. Ojo si se cambia el protagonista: el 14 Pro es
// de acero inoxidable (el titanio arranca en el 15 Pro).
export interface DetailBlock {
  icon: string;
  title: string;
  text: string;
}

export const detailBlocks: DetailBlock[] = [
  {
    icon: "diamond",
    title: "Acero inoxidable",
    text: "Marco de acero y dorso de vidrio mate: se siente sólido y premium en la mano.",
  },
  {
    icon: "camera",
    title: "Cámara principal de 48 MP",
    text: "Sistema triple con zoom óptico 3x. Mucho detalle y buenas fotos de noche.",
  },
  {
    icon: "display",
    title: "Pantalla ProMotion 120 Hz",
    text: "6,1\" Super Retina XDR, siempre activa y muy brillante a pleno sol.",
  },
  {
    icon: "sparkle",
    title: "Dynamic Island",
    text: "Llamadas, música y avisos aparecen arriba sin cortar lo que estás haciendo.",
  },
  {
    icon: "bolt",
    title: "Chip A16 Bionic",
    text: "El mismo chip del iPhone 15: fluido en juegos, video y apps pesadas por años.",
  },
  {
    icon: "create",
    title: "Video 4K con modo Acción",
    text: "Estabilización para grabar en movimiento sin gimbal, y modo Cine con fondo desenfocado.",
  },
];

// ── Marquee de confianza ─────────────────────────────────────
export const marqueeItems: string[] = [
  "Entrega en mano en Neuquén",
  "Probá el equipo antes de pagar",
  "Nuevos y usados verificados",
  "Garantía local",
  "Tomamos tu usado en parte de pago",
  "Atención por WhatsApp",
  "Envíos a toda la provincia",
];

// ── Hero: bullets ────────────────────────────────────────────
export interface HeroBullet {
  text: string;
  /** Icono del bullet (se resuelve en Hero.tsx). */
  icon: "calendar" | "transfer" | "badge" | "lock" | "truck" | "chat";
}

export const heroBullets: HeroBullet[] = [
  { text: "Hasta 2 cuotas", icon: "calendar" },
  { text: "Tomamos tu equipo en parte de pago", icon: "transfer" },
  { text: "Equipos nuevos y seleccionados", icon: "badge" },
  { text: "Pago seguro", icon: "lock" },
  { text: "Envíos disponibles", icon: "truck" },
  { text: "Atención por WhatsApp", icon: "chat" },
];

// ── Hero: metricas de confianza ───────────────────────────
export interface HeroStat {
  value: string;
  label: string;
}

export const heroStats: HeroStat[] = [
  { value: "100%", label: "Equipos verificados" },
  { value: "Neuquén", label: "Entrega en mano" },
];
