import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "@/utils/cn";
import { allowHeavy } from "@/anim/motion";

// Vertex: quad de pantalla completa en clip-space.
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Fragment: "silk" — ondas sedosas con domain warping en paleta azul/cyan.
const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / max(uRes.y, 1.0);
    vec2 p = uv - 0.5;
    p.x *= aspect;
    float t = uTime * 0.25;

    float a = 0.0;
    vec2 q = p * 2.2;
    for (int i = 0; i < 5; i++) {
      float fi = float(i) + 1.0;
      q.x += 0.5 / fi * sin(fi * 1.7 * q.y + t * (0.6 + fi * 0.12));
      q.y += 0.5 / fi * cos(fi * 1.4 * q.x + t * (0.5 + fi * 0.10));
      a += sin(q.x + q.y) * 0.5;
    }
    float v = 0.5 + 0.5 * sin(3.0 * (q.x - q.y) + a + t);

    // Negro, grafito y plata de la paleta (antes azul y cian).
    vec3 ink  = vec3(0.051, 0.051, 0.051);
    vec3 mid  = vec3(0.204, 0.212, 0.220);
    vec3 hi   = vec3(0.635, 0.635, 0.635);

    vec3 col = mix(ink, mid, smoothstep(0.2, 0.9, v));
    col = mix(col, hi, pow(smoothstep(0.6, 1.0, v), 2.5) * 0.55);

    // El centro queda calmo (detrás del texto/iPhone); los bordes brillan.
    float r = length(p);
    col *= 0.62 + 0.5 * smoothstep(0.1, 1.15, r);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/**
 * Fondo de ondas/silk para el hero (reemplaza la aurora ahí).
 * - Solo en desktop (allowHeavy): sino, fallback estático (gradiente premium).
 * - Se pausa cuando el hero sale del viewport y al ocultar la pestaña.
 * - Libera el contexto WebGL al desmontar.
 */
export function SilkShader({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [active] = useState(() => allowHeavy());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!active) return;
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    } catch {
      setFailed(true);
      return;
    }

    let w = mount.clientWidth || 1;
    let h = mount.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h);
    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    mount.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(w, h) },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    let visible = true;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible = e.isIntersecting;
      },
      { rootMargin: "0px" }
    );
    io.observe(mount);

    const onResize = () => {
      w = mount.clientWidth || 1;
      h = mount.clientHeight || 1;
      renderer.setSize(w, h);
      uniforms.uRes.value.set(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible || document.hidden) return;
      uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (canvas.parentNode === mount) mount.removeChild(canvas);
    };
  }, [active]);

  if (!active || failed) {
    // Fallback estático: gradiente premium que reemplaza la aurora en el hero.
    return (
      <div
        className={cn(
          "bg-[radial-gradient(60%_60%_at_50%_32%,rgba(196,196,196,0.08),transparent_70%),radial-gradient(50%_55%_at_82%_18%,rgba(226,227,229,0.05),transparent_70%),linear-gradient(180deg,#0d0d0d,#08090a)]",
          className
        )}
      />
    );
  }

  return <div ref={mountRef} className={className} />;
}
