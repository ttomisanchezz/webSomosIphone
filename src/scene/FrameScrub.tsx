import { useEffect, useRef } from "react";
import {
  loadSequence, pickVariant, portadaFocus, portadaUrl, screenVariant,
  type Focus, type SeqName, type Variant,
} from "./frames";

/**
 * Bloque "sticky" que dibuja en un canvas lo que corresponde al scroll.
 * Cada paso ocupa una parte igual del bloque:
 *  - frames: avanza una secuencia de video (to < from = hacia atrás).
 *  - still:  la portada en 4K con zoom hacia `focus`, fundiéndose con un
 *            frame de video (fadeTo = aparece al final, fadeFrom = se va al principio).
 */
export type Step =
  | { kind: "frames"; seq: SeqName; from: number; to: number }
  | {
      kind: "still";
      focus: Focus;
      zoom: [number, number];
      fadeTo?: { seq: SeqName; frame: number };
      fadeFrom?: { seq: SeqName; frame: number };
    };

interface Props {
  steps: Step[];
  heightVh: number;
  overlay?: React.ReactNode;
  id?: string;
  label?: string;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function coverRect(iw: number, ih: number, w: number, h: number) {
  const s = Math.max(w / iw, h / ih);
  return { dw: iw * s, dh: ih * s, dx: (w - iw * s) / 2, dy: (h - ih * s) / 2 };
}

export function FrameScrub({ steps, heightVh, overlay, id, label }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const seqs = new Map<SeqName, HTMLImageElement[]>();
    let still: HTMLImageElement | null = null;
    let variant: Variant = "mobile";
    let raf = 0;
    let lastKey = "";
    let visible = false;

    const setup = () => {
      seqs.clear();
      const need = new Set<SeqName>();
      for (const s of steps) {
        if (s.kind === "frames") need.add(s.seq);
        else {
          if (s.fadeTo) need.add(s.fadeTo.seq);
          if (s.fadeFrom) need.add(s.fadeFrom.seq);
        }
      }
      const redraw = () => { lastKey = ""; schedule(); };
      for (const n of need) seqs.set(n, loadSequence(n, pickVariant(n), redraw));
      variant = screenVariant();
      if (steps.some((s) => s.kind === "still")) {
        still = new Image();
        still.decoding = "async";
        still.onload = redraw;
        still.src = portadaUrl(variant);
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      lastKey = "";
    };

    const frameImg = (seq: SeqName, frame: number) => {
      const imgs = seqs.get(seq);
      if (!imgs) return undefined;
      for (let d = 0; d < imgs.length; d++) {
        for (const j of [frame - d, frame + d]) {
          const c = imgs[j];
          if (c && c.complete && c.naturalWidth) return c;
        }
      }
      return undefined;
    };

    const drawCover = (img: HTMLImageElement) => {
      const r = coverRect(img.naturalWidth, img.naturalHeight, canvas.width, canvas.height);
      ctx.drawImage(img, r.dx, r.dy, r.dw, r.dh);
    };

    const drawStill = (focus: Focus, z: number, t: number) => {
      if (!still || !still.complete || !still.naturalWidth) return false;
      const W = canvas.width, H = canvas.height;
      const base = coverRect(still.naturalWidth, still.naturalHeight, W, H);
      const [fx, fy] = portadaFocus(variant, focus);
      // Punto de foco: parte de donde está en la portada y se acerca al centro.
      const p0x = base.dx + fx * base.dw, p0y = base.dy + fy * base.dh;
      const px = p0x + (W / 2 - p0x) * t, py = p0y + (H / 2 - p0y) * t;
      const dw = base.dw * z, dh = base.dh * z;
      ctx.drawImage(still, px - fx * dw, py - fy * dh, dw, dh);
      return true;
    };

    const render = () => {
      raf = 0;
      const rect = wrap.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      wrap.style.setProperty("--p", p.toFixed(4));

      const n = steps.length;
      const idx = Math.min(n - 1, Math.floor(p * n));
      const t = p * n - idx;
      const step = steps[idx];
      const key = `${idx}:${t.toFixed(3)}:${canvas.width}`;
      if (key === lastKey) return;

      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (step.kind === "frames") {
        const frame = Math.round(step.from + (step.to - step.from) * t);
        const img = frameImg(step.seq, frame);
        if (!img) return;
        drawCover(img);
      } else {
        const e = t * t * (3 - 2 * t);
        const z = step.zoom[0] * Math.pow(step.zoom[1] / step.zoom[0], e);
        // cuánto "hacia el foco" estamos: 0 con zoom 1, 1 con el zoom máximo del paso
        const zMax = Math.max(step.zoom[0], step.zoom[1]);
        const toward = zMax > 1 ? (z - 1) / (zMax - 1) : 0;
        if (!drawStill(step.focus, z, toward * 0.6)) return;
        const fade = step.fadeTo ?? step.fadeFrom;
        if (fade) {
          const a = step.fadeTo ? smooth(0.45, 1, t) : 1 - smooth(0, 0.55, t);
          const img = frameImg(fade.seq, fade.frame);
          if (img && a > 0) {
            ctx.globalAlpha = a;
            drawCover(img);
            ctx.globalAlpha = 1;
          }
        }
      }
      lastKey = key;
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

  const startsWithStill = steps[0]?.kind === "still";

  return (
    <section id={id} aria-label={label} ref={wrapRef} className="relative" style={{ height: `${heightVh}vh` }}>
      <div className="sticky top-0 h-dvh w-full overflow-hidden bg-[var(--bg-main)]">
        {startsWithStill && (
          <picture>
            <source media="(min-aspect-ratio: 1/1)" srcSet={portadaUrl("desktop", "a")} />
            <img src={portadaUrl("mobile", "a")} alt="Fran y Tomás de Somos iPhone NQN en su oficina, con un iPhone y un cartel que dice Aceptamos cuotas" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
          </picture>
        )}
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        {overlay && <div className="pointer-events-none absolute inset-0">{overlay}</div>}
      </div>
    </section>
  );
}
