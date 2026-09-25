import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Nota: antes esto usaba vite-plugin-singlefile, que inlineaba todo el JS y el
// CSS dentro de index.html (~1,25 MB en una sola descarga bloqueante, sin
// cache entre visitas y sin poder partir three.js del resto). Para un sitio
// servido en Vercel conviene lo contrario: assets separados, con hash de
// contenido y cacheables por un ano.

// ─────────────────────────────────────────────────────────────
//  ⚠️ URL PÚBLICA DEL SITIO — cambiar SOLO acá.
//  De este valor salen el <link canonical>, todas las meta og:/twitter:,
//  el JSON-LD, robots.txt y sitemap.xml. Antes estaba escrita a mano en
//  tres archivos distintos y se desincronizaban.
// ─────────────────────────────────────────────────────────────
const SITE_URL = "https://somos-iphone-nqn-henna.vercel.app";

/** Reemplaza %SITE_URL% en el HTML y emite robots.txt y sitemap.xml. */
function seoUrls(): Plugin {
  return {
    name: "seo-urls",
    transformIndexHtml(html) {
      return html.replace(/%SITE_URL%/g, SITE_URL);
    },
    generateBundle() {
      const hoy = new Date().toISOString().slice(0, 10);
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: [
          "User-agent: *",
          "Allow: /",
          "",
          "# Los modelos 3D y las fuentes no aportan nada al índice y consumen",
          "# presupuesto de rastreo.",
          "Disallow: /glb/",
          "Disallow: /fonts/",
          "",
          `Sitemap: ${SITE_URL}/sitemap.xml`,
          "",
        ].join("\n"),
      });
      // Una sola URL: el sitio es una pagina con anclas. Listar #modelos
      // como URL aparte seria declararle a Google paginas que no existen.
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoUrls()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // Build SSR del pre-render (scripts/prerender.mjs): todo empaquetado, así
  // Node no tiene que resolver gsap/lenis desde node_modules (gsap publica
  // CommonJS como entrada principal y el import con nombre fallaba).
  ssr: {
    noExternal: true,
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Vendors pesados en chunks propios: el navegador los baja en paralelo
        // y los reutiliza entre deploys mientras no cambie su version. Con la
        // forma de objeto, react-dom/client (lo que usa main.tsx) caia en el
        // chunk principal y se volvia a bajar en cada deploy.
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id))
            return "react";
          if (/node_modules[\\/](gsap|@gsap)[\\/]/.test(id)) return "gsap";
          // three + GLTFLoader + meshopt juntos: solo los pide el motor 3D
          // (import dinamico) y asi llegan en una tanda, sin pedidos en cadena.
          if (/node_modules[\\/]three[\\/]/.test(id)) return "three";
        },
      },
    },
  },
});
