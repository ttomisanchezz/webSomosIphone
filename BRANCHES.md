# Ramas del rediseño

`main` = producción (Vercel). Cada rama sale de `main` y vuelve por PR.

| Rama | Toca SOLO | Contenido |
|---|---|---|
| `feat/escena-scroll` | `src/scene/**`, `public/media/**` | Portada, zoom a la cámara, zoom al cartel, secuencias de frames |
| `feat/precios` | `src/sections/precios/**`, `src/data/products.ts` | Usados, Sellados, Accesorios |
| `feat/pagos` | `src/sections/pagos/**` | Contado, cuotas, entrega inicial |
| `feat/resto` | `src/sections/resto/**`, `src/components/**`, `src/three/**` | Fondo interactivo, clientes, despiece, FAQ, footer |

Reglas:
- `src/App.tsx`, `src/index.css` y `package.json` no se editan en ramas feat. Si hace falta, se hace un PR chico aparte (`chore/*`).
- Estilo: oscuro, estilo Apple. Colores en variables CSS de `src/index.css`.
- Contrato de la escena: `<ScrollScene camaraPanel={<Precios/>} cartelPanel={<Pagos/>} />`.
