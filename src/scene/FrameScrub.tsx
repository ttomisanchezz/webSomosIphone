import { useEffect, useRef } from "react";
import { frameUrl, loadSequence, pickVariant, SEQUENCES, type SeqName, type Variant } from "./frames";

/**
 * Bloque "sticky" que avanza una secuencia de frames con el scroll.
 * `steps` describe qué se muestra a lo largo del bloque: cada paso ocupa
 * una parte igual del recorrido y va del frame `from` al `to` de su
 * secuencia (to < from = zoom hacia atrás).
 */
export interface Step {
  seq: SeqName;
  from: number;
  to: number;
}

interface Props {
  steps: Step[];
  /** Alto total del bloque en vh (más alto = zoom más lento). */
  heightVh: number;
  /** Contenido encima del canvas; recibe el progreso 0..1 vía CSS var --p. */
  overlay?: React.ReactNode;
  id?: string;
  label?: string;
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

export function FrameScrub({ steps, heightVh, overlay, id, label }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const first = steps[0];

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let variants = new Map<SeqName, Variant>();
    let seqs = new Map<SeqName, HTMLImageElement[]>();
    let raf = 0;
    let lastKey = "";
    let visible = false;

    const setup = () => {
      variants = new Map();
      seqs = new Map();
      for (const s of steps) {
        if (!variants.has(s.seq)) {
          const v = pickVariant(s.seq);
          variants.set(s.seq, v);
          seqs.set(s.seq, loadSequence(s.seq, v, () => { lastKey = ""; schedule(); }));
        }
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      lastKey = "";
    };

    const render = () => {
      raf = 0;
      const rect = wrap.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      wrap.style.setProperty("--p", p.toFixed(4));

      const n = steps.length;
      const idx = Math.min(n - 1, Math.floor(p * n));
      const local = p * n - idx;
      const step = steps[idx];
      const frame = Math.round(step.from + (step.to - step.from) * local);
      const key = `${step.seq}:${frame}:${canvas.width}`;
      if (key === lastKey) return;

      const imgs = seqs.get(step.seq)!;
      // Si el frame todavía no bajó, usar el más cercano ya cargado.
      let img: HTMLImageElement | undefined;
      for (let d = 0; d < imgs.length && !img; d++) {
        for (const j of [frame - d, frame + d]) {
          const c = imgs[j];
          if (c && c.complete && c.naturalWidth) { img = c; break; }
        }
      }
      if (!img) return;
      lastKey = key;
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawCover(ctx, img, canvas.width, canvas.height);
    };

    const schedule = () => { if (visible && !raf) raf = requestAnimationFrame(render); };
    const onResize = () => { setup(); schedule(); };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }, { rootMargin: "100% 0px" });
    io.observe(wrap);
    setup();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [steps]);

  const poster = (v: Variant) => frameUrl(first.seq, v, first.from);
  const hasDesktop = SEQUENCES[first.seq].variants.includes("desktop");

  return (
    <section id={id} aria-label={label} ref={wrapRef} className="relative" style={{ height: `${heightVh}vh` }}>
      <div className="sticky top-0 h-dvh w-full overflow-hidden bg-[var(--bg-main)]">
        {/* Primer frame como imagen: se ve antes de que cargue el JS (SSR). */}
        <picture>
          {hasDesktop && <source media="(min-aspect-ratio: 1/1)" srcSet={poster("desktop")} />}
          <img src={poster("mobile")} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
        </picture>
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        {overlay && <div className="pointer-events-none absolute inset-0">{overlay}</div>}
      </div>
    </section>
  );
}
