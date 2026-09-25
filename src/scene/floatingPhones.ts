import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { loadGltfPhone } from "@/three/phone";
import { MODELS } from "@/three/models";

/**
 * iPhones 3D flotando en una capa (canvas transparente). Se usan dos capas:
 * una detrás de Fran y Tomi y otra delante (pocos equipos, en los bordes).
 */
export interface Slot {
  url: string;
  /** posición en unidades de escena (x: -1..1 del ancho visible, y: -1..1 del alto) */
  x: number;
  y: number;
  /** profundidad: más negativo = más lejos */
  z: number;
  scale: number;
  spin: number; // velocidad de giro
  phase: number;
}

const M = MODELS;
export const BACK_SLOTS: Slot[] = [
  { url: M.iphone17ProMax, x: -0.78, y: 0.55, z: -2.5, scale: 1.1, spin: 0.35, phase: 0 },
  { url: M.iphone16Pro, x: 0.8, y: 0.6, z: -3, scale: 1.0, spin: -0.3, phase: 1.2 },
  { url: M.iphone15ProMax, x: -0.45, y: 0.1, z: -5, scale: 0.9, spin: 0.25, phase: 2.1 },
  { url: M.iphone14Pro, x: 0.5, y: 0.05, z: -5.5, scale: 0.9, spin: -0.28, phase: 0.6 },
  { url: M.iphone13ProMax, x: -0.95, y: -0.25, z: -3.5, scale: 1.0, spin: 0.3, phase: 3.3 },
  { url: M.iphone16Plus, x: 0.97, y: -0.2, z: -4, scale: 1.0, spin: -0.33, phase: 1.8 },
  { url: M.iphone17, x: 0.05, y: 0.78, z: -7, scale: 0.9, spin: 0.22, phase: 4.1 },
  { url: M.iphone15, x: -0.2, y: 0.85, z: -8, scale: 0.8, spin: -0.2, phase: 2.7 },
];
export const FRONT_SLOTS: Slot[] = [
  { url: M.iphone17ProMax, x: -0.92, y: -0.6, z: 1.2, scale: 0.8, spin: 0.4, phase: 0.9 },
  { url: M.iphone16Pro, x: 0.93, y: -0.55, z: 1.4, scale: 0.75, spin: -0.45, phase: 2.4 },
];

export interface Layer {
  setPointer: (x: number, y: number) => void;
  setActive: (on: boolean) => void;
  dispose: () => void;
}

export function createLayer(canvas: HTMLCanvasElement, slots: Slot[], opts: { mobile: boolean }): Layer | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !opts.mobile, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(2, 3, 4);
  const rim = new THREE.DirectionalLight(0x2e7bff, 2.2);
  rim.position.set(-4, 1, -2);
  scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.25));

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  const items: { g: THREE.Group; s: Slot }[] = [];
  const cache = new Map<string, Promise<THREE.Group | null>>();
  const load = (url: string) => {
    if (!cache.has(url)) cache.set(url, loadGltfPhone(url).then((p) => p?.group ?? null));
    return cache.get(url)!.then((g) => (g ? (items.some((i) => i.g === g) ? g.clone(true) : g) : null));
  };
  let disposed = false;
  const list = opts.mobile ? slots.filter((_, i) => i % 2 === 0 || slots.length <= 2) : slots;
  list.forEach((s, i) => {
    // escalonar la carga para no trabar el primer render
    setTimeout(() => {
      load(s.url).then((g) => {
        if (!g || disposed) return;
        g.scale.setScalar(s.scale);
        scene.add(g);
        items.push({ g, s });
      });
    }, 150 * i);
  });

  let w = 1, h = 1;
  const resize = () => {
    w = canvas.clientWidth || 1;
    h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let active = true;
  let raf = 0;
  const clock = new THREE.Clock();
  const tick = () => {
    raf = 0;
    if (!active || disposed) return;
    const t = clock.getElapsedTime();
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    // tamaño visible a distancia z (para ubicar los slots en proporción a la pantalla)
    const vis = (z: number) => {
      const d = camera.position.z - z;
      const hh = Math.tan((camera.fov * Math.PI) / 360) * d;
      return { hw: hh * camera.aspect, hh };
    };
    for (const { g, s } of items) {
      const { hw, hh } = vis(s.z);
      const par = 0.25 * (1 + s.z * 0.08);
      g.position.set(
        s.x * hw * 0.92 + pointer.x * par,
        s.y * hh * 0.9 + Math.sin(t * 0.8 + s.phase) * 0.12 - pointer.y * par,
        s.z,
      );
      g.rotation.y = t * s.spin + s.phase;
      g.rotation.x = Math.sin(t * 0.5 + s.phase) * 0.15;
      g.rotation.z = Math.cos(t * 0.4 + s.phase) * 0.08;
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    setPointer: (x, y) => { pointer.tx = x; pointer.ty = y; },
    setActive: (on) => {
      active = on;
      if (on && !raf) { clock.getDelta(); raf = requestAnimationFrame(tick); }
    },
    dispose: () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
    },
  };
}
