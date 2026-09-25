// ─────────────────────────────────────────────────────────────
//  EDITABLE SITE CONFIG — "somos iphone nqn" (Neuquén)
//  Cambiá acá el nombre de la tienda, el WhatsApp, ubicación y redes.
// ─────────────────────────────────────────────────────────────

export const site = {
  brand: "somos iphone nqn",
  tagline: "iPhones en Neuquén",
  city: "Neuquén Capital",
  // Número en formato internacional sin "+" ni espacios para wa.me.
  whatsappNumber: "5492994295806",
  whatsappDisplay: "+54 9 299 429-5806",
  whatsappMessage:
    "Hola somos iphone nqn 👋 Quería consultar por los iPhones disponibles en Neuquén.",
  location: "Neuquén Capital · Entrega en mano y envíos a toda la provincia",
  address: "Showroom a coordinar · Neuquén Capital",
  social: {
    instagram: "https://instagram.com/somosiphone_nqn",
  },
  legalNote:
    "Marca independiente de Neuquén. No afiliada oficialmente a Apple Inc. iPhone es una marca registrada de Apple Inc. Precios de referencia en pesos argentinos, sujetos a stock y cotización.",
} as const;

export const navLinks = [
  { label: "Inicio", href: "#inicio", primary: true },
  { label: "Modelos", href: "#modelos", primary: true },
  { label: "Beneficios", href: "#beneficios", primary: true },
  { label: "Más llevado", href: "#detalle" },
  { label: "Comparativa", href: "#comparativa", primary: true },
  { label: "Financiación", href: "#financiacion", primary: true },
  { label: "Proceso", href: "#proceso" },
  { label: "FAQ", href: "#faq", primary: true },
] as const;

/** Subconjunto que entra en la barra de escritorio sin desbordarla. */
export const navLinksPrimary = navLinks.filter((l) => "primary" in l);

/** Link de WhatsApp con mensaje precargado. */
export function waLink(message: string = site.whatsappMessage): string {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(
    message
  )}`;
}

/** Link de WhatsApp para consultar un modelo puntual. */
export function waProduct(name: string): string {
  return waLink(
    `Hola somos iphone nqn 👋 Quería consultar stock y precio del ${name} en Neuquén.`
  );
}

/**
 * Link de WhatsApp para preguntar la entrega mínima en cuotas. El mensaje
 * termina en "iPhone que quiero:" para que la persona escriba el modelo antes
 * de enviarlo (WhatsApp deja editar el texto precargado).
 */
export function waCuotas(): string {
  return waLink(
    "Hola somos iphone nqn 👋 Quiero comprar en cuotas. ¿Cuál es la entrega mínima? El iPhone que quiero: "
  );
}

/** Link de WhatsApp para cotizar un iPhone como parte de pago. */
export function waUsado(): string {
  return waLink(
    "Hola somos iphone nqn 👋 Quiero entregar mi iPhone como parte de pago. Mi equipo (modelo, capacidad y batería): "
  );
}
