// ─────────────────────────────────────────────────────────────
//  Fotos propias de credibilidad (local, equipos, clientes, entregas).
//
//  Auto-descubiertas desde src/fotoswebCredibilidad/. No hay lista que
//  mantener: cualquier imagen que caiga en esa carpeta aparece sola en la
//  rotación de las cards. Van en src/ y no en public/ justamente para esto
//  — Vite puede indexar src/ en build time, public/ no.
// ─────────────────────────────────────────────────────────────

const modules = import.meta.glob(
  "../fotoswebCredibilidad/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}",
  { eager: true, import: "default" }
);

/** Todas las fotos de la carpeta, en orden alfabético por nombre de archivo. */
export const fotosCredibilidad: string[] = Object.keys(modules)
  .sort()
  .map((k) => modules[k] as string);

export const hayFotosCredibilidad = fotosCredibilidad.length > 0;

// Historias de Instagram de clientes (subcarpeta historias/). Van aparte
// porque traen texto propio encima: como fondo de una card se pisaba con el
// título de la card. Se muestran enteras en la tira de testimonios.
const historias = import.meta.glob(
  "../fotoswebCredibilidad/historias/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}",
  { eager: true, import: "default" }
);

export const historiasClientes: string[] = Object.keys(historias)
  .sort()
  .map((k) => historias[k] as string);
