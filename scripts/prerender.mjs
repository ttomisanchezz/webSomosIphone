// ─────────────────────────────────────────────────────────────
//  Pre-render: mete la página ya renderizada dentro del <div id="root">
//  de dist/index.html. Sin esto el HTML llegaba vacío y en 4G no se veía
//  nada hasta que bajaba y corría el JavaScript (~2,5 s más de pantalla
//  en negro). Corre al final de `npm run build`, después del build del
//  cliente y del build SSR (que deja src/entry-server.tsx en .ssr/).
// ─────────────────────────────────────────────────────────────
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ssrDir = path.join(root, ".ssr");
const htmlFile = path.join(root, "dist", "index.html");

const { render } = await import(
  pathToFileURL(path.join(ssrDir, "entry-server.js")).href
);

const html = fs.readFileSync(htmlFile, "utf8");
const marker = '<div id="root"></div>';
if (!html.includes(marker)) {
  throw new Error(`prerender: no encontré ${marker} en dist/index.html`);
}
const app = render();
const out = html
  .replace(marker, `<div id="root">${app}</div>`)
  // Con el contenido ya en el HTML, el JavaScript no hace falta para ver la
  // página: baja con prioridad baja y en 4G deja pasar primero al CSS y a
  // las fuentes del hero (lo que define cuándo se ve el texto final).
  .replace(/<script type="module" crossorigin/g, '<script type="module" fetchpriority="low" crossorigin')
  .replace(/<link rel="modulepreload" crossorigin/g, '<link rel="modulepreload" fetchpriority="low" crossorigin');
if (!out.includes('fetchpriority="low"')) {
  throw new Error("prerender: no encontré los <script>/<link> de Vite para bajarles la prioridad");
}
fs.writeFileSync(htmlFile, out);
fs.rmSync(ssrDir, { recursive: true, force: true });

console.log(`prerender: dist/index.html con ${Math.round(app.length / 1024)} KB de contenido`);
