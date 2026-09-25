import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App from "./App";

/**
 * Render de la página a HTML en el build (lo usa scripts/prerender.mjs).
 * Así el texto llega en el HTML y se ve antes de que baje el JavaScript;
 * después main.tsx "hidrata" ese HTML en vez de dibujarlo de cero.
 */
export function render(): string {
  return renderToString(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
