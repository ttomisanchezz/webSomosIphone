import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { navLinks, navLinksPrimary, site, waLink } from "@/data/site";
import { BrandMark, Button, Container } from "@/components/ui";
import { CloseIcon, MenuIcon, WhatsAppIcon } from "@/components/icons";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "relative transition-all duration-300",
        scrolled
          ? "glass-strong border-b border-line shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]"
          : "border-b border-transparent bg-ink-950/40 backdrop-blur-sm"
      )}
    >
      <Container className="flex h-16 items-center justify-between sm:h-[68px]">
        {/* Logo */}
        <a href="#inicio" className="flex items-center gap-2.5">
          <BrandMark />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold uppercase tracking-tight text-white">
              {site.brand}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-accent-300">
              {site.tagline}
            </span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinksPrimary.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-2.5 lg:flex">
          <Button href={waLink()} target="_blank" variant="ghost" size="md">
            <WhatsAppIcon className="h-4 w-4 text-wa" />
            WhatsApp
          </Button>
          <Button href={waLink()} target="_blank" variant="primary" size="md" icon>
            Consultar
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60 active:scale-95 lg:hidden"
        >
          {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </Container>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-300 lg:hidden",
          open ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <Container className="glass-strong border-t border-line pb-6 pt-3 text-center">
          <nav className="flex flex-col items-stretch">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-3.5 text-base font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60 active:bg-white/10"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              href={waLink()}
              target="_blank"
              variant="secondary"
              size="md"
              onClick={() => setOpen(false)}
            >
              <WhatsAppIcon className="h-4 w-4 text-wa" />
              WhatsApp
            </Button>
            <Button
              href={waLink()}
              target="_blank"
              variant="primary"
              size="md"
              onClick={() => setOpen(false)}
            >
              Consultar
            </Button>
          </div>
        </Container>
      </div>
    </header>
  );
}
