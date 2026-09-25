import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import "./index.css";
import App from "./App";

const container = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
    {/* Visitas y origen del trafico. Script propio de Vercel: sin cookies,
        sin banner de consentimiento y ~1 KB. Hay que activarlo tambien en
        Vercel > Project > Analytics para que empiece a guardar datos. */}
    <Analytics />
  </StrictMode>
);

// En el build el HTML ya viene con la página renderizada
// (scripts/prerender.mjs): React se engancha a ese HTML en vez de dibujarlo
// de cero. En `npm run dev` el #root llega vacío y se renderiza normal.
if (container.hasChildNodes()) hydrateRoot(container, app);
else createRoot(container).render(app);
