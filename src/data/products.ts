// ─────────────────────────────────────────────────────────────
//  CATÁLOGO EDITABLE — "somos iphone nqn"
//  Dos listas: NUEVOS y USADOS. El toggle de la sección "Modelos"
//  muestra una u otra. Cada modelo lleva sus `options`: condición de
//  batería + precio. La batería se anima en la card.
//  Precios en ARS de referencia: actualizalos cuando cambie la lista.
// ─────────────────────────────────────────────────────────────

import { MODELS } from "@/three/models";

/** Fecha de la última lista de precios. Cambiarla junto con los precios:
 *  se muestra debajo de las cards ("actualizados al ..."). */
export const PRECIOS_ACTUALIZADOS = "24/09/2026";

export interface PhoneColor {
  name: string;
  hex: string;
}

/** Una condición de batería del modelo con su precio. */
export interface BatteryOption {
  /** Condición de batería 0-100 (se anima en la card) */
  health: number;
  /** Precio de contado en ARS. Sin valor = "a consultar". */
  price?: number;
}

export interface iPhoneProduct {
  id: string;
  model: string;
  tagline: string;
  condition: "nuevo" | "usado";
  /** Capacidades disponibles, ej. "128GB · 256GB" */
  capacity: string;
  /** Al menos una. Con más de una, la card muestra un selector con los
   *  precios de cada condición en vez de repetir el modelo en otra card. */
  options: BatteryOption[];
  badge?: string;
  /** Ruta del .glb que muestra la card (clave de MODELS). */
  model3d?: string;
  colors: PhoneColor[];
  features: string[];
}

/** Formatea un número como precio en pesos argentinos. */
export function formatARS(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

/** "100%" o "+85%": debajo de 100 la condición es "85% o más". */
export function formatBattery(health: number): string {
  return `${health < 100 ? "+" : ""}${health}%`;
}

// Paletas por familia (se reutilizan entre modelos).
const C_13_PRO: PhoneColor[] = [
  { name: "Grafito", hex: "#4a4a4c" },
  { name: "Plata", hex: "#e3e4e6" },
  { name: "Oro", hex: "#f4e0c4" },
  { name: "Azul Sierra", hex: "#a7c1d9" },
];
const C_13: PhoneColor[] = [
  { name: "Medianoche", hex: "#1f2937" },
  { name: "Blanco Estrella", hex: "#e8e6e1" },
  { name: "Azul", hex: "#276787" },
  { name: "Rosa", hex: "#f0d5d3" },
  { name: "Verde", hex: "#5b6d5b" },
];
const C_14_PRO: PhoneColor[] = [
  { name: "Negro Espacial", hex: "#2c2c2e" },
  { name: "Plata", hex: "#e3e4e6" },
  { name: "Oro", hex: "#f0dfc8" },
  { name: "Morado Oscuro", hex: "#54505c" },
];
const C_14: PhoneColor[] = [
  { name: "Medianoche", hex: "#1f2937" },
  { name: "Blanco Estrella", hex: "#e8e6e1" },
  { name: "Azul", hex: "#a3c8e8" },
  { name: "P\u00farpura", hex: "#e0d5e8" },
  { name: "Rojo", hex: "#b83f45" },
];
const C_15_PRO: PhoneColor[] = [
  { name: "Titanio Negro", hex: "#3b3b3d" },
  { name: "Titanio Blanco", hex: "#e7e9ea" },
  { name: "Titanio Natural", hex: "#b7b0a8" },
  { name: "Titanio Azul", hex: "#5d6a7d" },
];
const C_15: PhoneColor[] = [
  { name: "Negro", hex: "#26262a" },
  { name: "Blanco", hex: "#e9e9e7" },
  { name: "Azul", hex: "#b9c4c9" },
  { name: "Verde", hex: "#c8ccc0" },
  { name: "Rosa", hex: "#e7c8c8" },
];
const C_16_PRO: PhoneColor[] = [
  { name: "Titanio Negro", hex: "#23262d" },
  { name: "Titanio Blanco", hex: "#e7e9ee" },
  { name: "Titanio Natural", hex: "#c4c9d2" },
  { name: "Titanio Desierto", hex: "#b89b78" },
];
const C_16: PhoneColor[] = [
  { name: "Negro", hex: "#1b1d22" },
  { name: "Blanco", hex: "#dfe2e8" },
  { name: "Azul Ultramar", hex: "#2f4a6b" },
  { name: "Verde Azulado", hex: "#5a8a78" },
  { name: "Rosa", hex: "#d9a7b0" },
];
// Colores oficiales del 18 Pro / 18 Pro Max (septiembre 2026).
const C_18_PRO: PhoneColor[] = [
  { name: "Negro", hex: "#2a2b2e" },
  { name: "Plata", hex: "#e3e5e9" },
  { name: "Azul Glaciar", hex: "#b9cfe0" },
  { name: "Borgoña", hex: "#6b2632" },
];
const C_17: PhoneColor[] = [
  { name: "Negro", hex: "#1f2126" },
  { name: "Blanco", hex: "#e8eaee" },
  { name: "Azul", hex: "#4a6fa5" },
  { name: "Salvia", hex: "#b7c2a8" },
  { name: "Lavanda", hex: "#c3bcd8" },
];

// Cada precio corresponde a UNA capacidad: la base de cada modelo (confirmado
// por Tomás, sep 2026). Usados: 128GB, salvo 16 y 15 Pro Max (256GB,
// no vienen en 128). Sellados:
// 18 Pro/Pro Max y 17 en 256GB; 16 y 15 en 128GB. Otras capacidades, a consultar.
export const NEW_IPHONES: iPhoneProduct[] = [
  {
    id: "18-pro-max",
    model: "iPhone 18 Pro Max",
    tagline: "Lo último de Apple",
    condition: "nuevo",
    capacity: "256GB",
    options: [{ health: 100, price: 2970000 }],
    badge: "Sellado",
    // No hay .glb del 18 Pro: el 17 Pro Max es el más parecido (mismo diseño).
    model3d: MODELS.iphone17ProMax,
    colors: C_18_PRO,
    features: ["Chip A20 Pro", 'Pantalla 6.9" OLED 120Hz', "Cámara con apertura variable"],
  },
  {
    id: "18-pro",
    model: "iPhone 18 Pro",
    tagline: 'Lo último, en 6.3"',
    condition: "nuevo",
    capacity: "256GB",
    options: [{ health: 100, price: 2850000 }],
    badge: "Sellado",
    model3d: MODELS.iphone17ProMax,
    colors: C_18_PRO,
    features: ["Chip A20 Pro", 'Pantalla 6.3" OLED 120Hz', "Cámara con apertura variable"],
  },
  {
    id: "17",
    model: "iPhone 17",
    tagline: "Lo último sin pagar el Pro",
    condition: "nuevo",
    capacity: "256GB",
    options: [{ health: 100, price: 1650000 }],
    badge: "Sellado",
    model3d: MODELS.iphone17,
    colors: C_17,
    features: ["Chip A19", 'Pantalla 6.3" OLED 120Hz', "Batería 100%"],
  },
  {
    id: "16",
    model: "iPhone 16",
    tagline: "Con Control de Cámara",
    condition: "nuevo",
    capacity: "128GB",
    options: [{ health: 100, price: 1450000 }],
    badge: "Sellado",
    model3d: MODELS.iphone16,
    colors: C_16,
    features: ["Chip A18", 'Pantalla 6.1" OLED', "Batería 100%"],
  },
  {
    id: "15",
    model: "iPhone 15",
    tagline: "USB-C y Dynamic Island",
    condition: "nuevo",
    capacity: "128GB",
    options: [{ health: 100, price: 1350000 }],
    badge: "Sellado",
    model3d: MODELS.iphone15,
    colors: C_15,
    features: ["Chip A16 Bionic", 'Pantalla 6.1" OLED', "Batería 100%"],
  },
];

// Una card por modelo. Si el mismo modelo está con distinta batería, va
// todo en `options` (de mayor a menor) y la card deja elegir la condición.
export const USED_IPHONES: iPhoneProduct[] = [
  {
    id: "u-16-pro-max",
    model: "iPhone 16 Pro Max",
    tagline: "Consultar disponibilidad",
    condition: "usado",
    capacity: "256GB",
    options: [{ health: 80, price: 1480000 }],
    model3d: MODELS.iphone16Pro,
    colors: C_16_PRO,
    features: ["Chip A18 Pro", 'Pantalla 6.9" OLED 120Hz', "Verificado en Neuquén"],
  },
  {
    id: "u-16-pro",
    model: "iPhone 16 Pro",
    tagline: "Titanio, tope de la línea 16",
    condition: "usado",
    capacity: "128GB",
    options: [{ health: 90, price: 1210000 }],
    model3d: MODELS.iphone16Pro,
    colors: C_16_PRO,
    features: ["Chip A18 Pro", 'Pantalla 6.3" OLED 120Hz', "Verificado en Neuquén"],
  },
  {
    id: "u-16",
    model: "iPhone 16",
    tagline: "Consultar disponibilidad",
    condition: "usado",
    capacity: "128GB",
    options: [{ health: 85, price: 1030000 }],
    model3d: MODELS.iphone16,
    colors: C_16,
    features: ["Chip A18", 'Pantalla 6.1" OLED', "Verificado en Neuquén"],
  },
  {
    id: "u-15-pro-max",
    model: "iPhone 15 Pro Max",
    tagline: "Consultar disponibilidad",
    condition: "usado",
    capacity: "256GB",
    options: [{ health: 85, price: 1190000 }],
    model3d: MODELS.iphone15ProMax,
    colors: C_15_PRO,
    features: ["Chip A17 Pro", 'Pantalla 6.7" OLED 120Hz', "Verificado en Neuquén"],
  },
  {
    id: "u-15-pro",
    model: "iPhone 15 Pro",
    tagline: "Titanio en tamaño justo",
    condition: "usado",
    capacity: "128GB",
    options: [
      { health: 100, price: 989000 },
      { health: 85, price: 920000 },
    ],
    model3d: MODELS.iphone15ProMax,
    colors: C_15_PRO,
    features: ["Chip A17 Pro", 'Pantalla 6.1" OLED 120Hz', "Verificado en Neuquén"],
  },
  {
    id: "u-15",
    model: "iPhone 15",
    tagline: "USB-C y Dynamic Island",
    condition: "usado",
    capacity: "128GB",
    options: [
      { health: 100, price: 795000 },
      { health: 85, price: 740000 },
    ],
    model3d: MODELS.iphone15,
    colors: C_15,
    features: ["Chip A16 Bionic", 'Pantalla 6.1" OLED', "Verificado en Neuquén"],
  },
  {
    id: "u-14-pro",
    model: "iPhone 14 Pro",
    tagline: "Dynamic Island y 120Hz",
    condition: "usado",
    capacity: "128GB",
    options: [
      { health: 100, price: 835000 },
      { health: 80, price: 770000 },
    ],
    model3d: MODELS.iphone14Pro,
    colors: C_14_PRO,
    features: ["Chip A16 Bionic", 'Pantalla 6.1" OLED 120Hz', "Verificado en Neuquén"],
  },
  {
    id: "u-14",
    model: "iPhone 14",
    tagline: "El equilibrado",
    condition: "usado",
    capacity: "128GB",
    options: [
      { health: 100, price: 595000 },
      { health: 85, price: 540000 },
    ],
    model3d: MODELS.iphone14,
    colors: C_14,
    features: ["Chip A15 Bionic", 'Pantalla 6.1" OLED', "Verificado en Neuquén"],
  },
  {
    id: "u-13-pro-max",
    model: "iPhone 13 Pro Max",
    tagline: "Consultar disponibilidad",
    condition: "usado",
    capacity: "128GB",
    options: [{ health: 85 }],
    model3d: MODELS.iphone13ProMax,
    colors: C_13_PRO,
    features: ["Chip A15 Bionic", 'Pantalla 6.7" OLED 120Hz', "Verificado en Neuquén"],
  },
  {
    id: "u-13-pro",
    model: "iPhone 13 Pro",
    tagline: "Pro accesible",
    condition: "usado",
    capacity: "128GB",
    options: [
      { health: 100, price: 700000 },
      { health: 90, price: 680000 },
    ],
    model3d: MODELS.iphone13Pro,
    colors: C_13_PRO,
    features: ["Chip A15 Bionic", 'Pantalla 6.1" OLED 120Hz', "Verificado en Neuquén"],
  },
  {
    id: "u-13",
    model: "iPhone 13",
    tagline: "Primer iPhone o cambio económico",
    condition: "usado",
    capacity: "128GB",
    options: [
      { health: 100, price: 535000 },
      { health: 85, price: 499000 },
    ],
    model3d: MODELS.iphone13,
    colors: C_13,
    features: ["Chip A15 Bionic", 'Pantalla 6.1" OLED', "Verificado en Neuquén"],
  },
];
