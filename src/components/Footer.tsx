import { Container, BrandMark } from "@/components/ui";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { site, navLinks, waCuotas, waLink, waUsado } from "@/data/site";

// La segunda columna antes repetía tres links de Navegación. Ahora son
// atajos a WhatsApp con el mensaje ya armado para cada consulta típica.
const columns = [
  {
    title: "Navegación",
    links: navLinks.map((l) => ({ label: l.label, href: l.href, external: false })),
  },
  {
    title: "Consultas",
    links: [
      { label: "Stock y precios", href: waLink(), external: true },
      { label: "Comprar en cuotas", href: waCuotas(), external: true },
      { label: "Cotizar mi usado", href: waUsado(), external: true },
    ],
  },
];

const socials = [
  { Icon: InstagramIcon, href: site.social.instagram, label: "Instagram" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 pb-28 pt-16 sm:pb-12">
      <Container>
        {/* Mobile: las dos columnas de links lado a lado, sino eran once
            links apilados antes de llegar al contacto. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-12 lg:gap-10">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-5">
            <a href="#inicio" className="flex items-center gap-2.5">
              <BrandMark />
              <span className="flex flex-col leading-none">
                <span className="font-display text-lg font-semibold tracking-tight text-white">
                  {site.brand}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-300">
                  {site.tagline}
                </span>
              </span>
            </a>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
              iPhones nuevos sellados y usados verificados, con atención
              personalizada y entrega en mano en Neuquén.
            </p>

            <div className="mt-6 flex items-center gap-3">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-colors hover:border-accent-400/40 hover:text-white"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target={l.external ? "_blank" : undefined}
                      rel={l.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contacto */}
          <div className="col-span-2 lg:col-span-3">
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Contacto
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href={waLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-slate-400 transition-colors hover:text-white"
                >
                  <WhatsAppIcon className="h-4 w-4 text-wa" />
                  {site.whatsappDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2.5 text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
                {site.location}
              </li>
            </ul>
          </div>
        </div>

        {/* Legal */}
        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-xs leading-relaxed text-slate-500">
            {site.legalNote}
          </p>
          {/* El HTML se pre-renderiza al compilar: si entre el build y la
              visita cambió el año, React corrige el número sin quejarse. */}
          <p className="mt-3 text-xs text-slate-600" suppressHydrationWarning>
            © {year} {site.brand}. Todos los derechos reservados.
          </p>
        </div>
      </Container>
    </footer>
  );
}
