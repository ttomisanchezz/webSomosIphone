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
  /** En celular no se baja ni se dibuja (tapado por Fran y Tomi, o para alivianar). */
  hiddenOnMobile?: boolean;
}

const M = MODELS;
// Repartidos a los dos lados de Fran y Tomi (que están en el centro).
export const BACK_SLOTS: Slot[] = [
  { url: M.iphone17ProMax, x: -0.82, y: 0.45, z: -3, scale: 1.0, spin: 0.35, phase: 0 },
  { url: M.iphone16Pro, x: 0.84, y: 0.5, z: -3, scale: 1.0, spin: -0.3, phase: 1.2 },
  { url: M.iphone15ProMax, x: -0.5, y: -0.05, z: -6.5, scale: 0.9, spin: 0.25, phase: 2.1, hiddenOnMobile: true },
  { url: M.iphone14Pro, x: 0.52, y: 0.0, z: -6.5, scale: 0.9, spin: -0.28, phase: 0.6 },
  // hiddenOnMobile: en celular quedan 2 equipos livianos (~260 KB en vez de ~480 KB).
  { url: M.iphone13ProMax, x: -0.96, y: -0.55, z: -4.5, scale: 0.9, spin: 0.3, phase: 3.3, hiddenOnMobile: true },
  { url: M.iphone16Plus, x: 0.97, y: -0.5, z: -4.5, scale: 1.0, spin: -0.33, phase: 1.8 },
  { url: M.iphone17, x: -0.3, y: 0.86, z: -10, scale: 0.8, spin: 0.22, phase: 4.1 },
  { url: M.iphone15, x: 0.32, y: 0.84, z: -10, scale: 0.8, spin: -0.2, phase: 2.7 },
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

/** Partes internas de PMREMGenerator (three r184) que hacen falta para precompilar. */
type PmremInternals = {
  _setSize?: (size: number) => void;
  _allocateTargets?: () => THREE.WebGLRenderTarget;
  _blurMaterial?: THREE.Material | null;
  _ggxMaterial?: THREE.Material | null;
};

/**
 * Reflejo "cuarto iluminado" (RoomEnvironment pasado por PMREMGenerator).
 * Calcularlo de una compilaba 4 shaders en el acto y trababa la página
 * ~1 s en un celular de gama media, justo cuando aparece la portada. Acá
 * esos shaders se compilan antes, en paralelo (compileAsync), y el cálculo
 * queda en dibujar. Usa partes internas de PMREMGenerator: si en otra
 * versión de three no están, se saltea la precompilación y se calcula
 * como antes.
 */
async function roomEnvironment(renderer: THREE.WebGLRenderer): Promise<THREE.Texture> {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  try {
    const internals = pmrem as unknown as PmremInternals;
    const jobs: Promise<unknown>[] = [];
    // PMREM dibuja todo en render targets: con uno puesto, los shaders se
    // compilan con la misma configuración (sin tone mapping, lineal).
    const target = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false });
    const prev = renderer.getRenderTarget();
    renderer.setRenderTarget(target);
    try {
      const cubeCamera = new THREE.PerspectiveCamera(90, 1, 0.1, 100);
      jobs.push(renderer.compileAsync(room, cubeCamera));
      // Fondo liso que PMREM dibuja antes del cuarto.
      const bg = new THREE.Mesh(
        new THREE.BoxGeometry(),
        new THREE.MeshBasicMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false })
      );
      jobs.push(renderer.compileAsync(bg, cubeCamera));
      if (internals._setSize && internals._allocateTargets) {
        internals._setSize(256); // el tamaño por defecto de fromScene
        internals._allocateTargets().dispose();
        const flat = new THREE.Scene();
        for (const m of [internals._blurMaterial, internals._ggxMaterial]) {
          if (m) flat.add(new THREE.Mesh(new THREE.BufferGeometry(), m));
        }
        jobs.push(renderer.compileAsync(flat, new THREE.OrthographicCamera()));
      }
    } finally {
      renderer.setRenderTarget(prev);
    }
    await Promise.all(jobs);
    target.dispose();
  } catch {
    /* se calcula igual, compilando en el acto */
  }
  const tex = pmrem.fromScene(room, 0.04).texture;
  pmrem.dispose();
  return tex;
}

export function createLayer(canvas: HTMLCanvasElement, slots: Slot[], opts: { mobile: boolean }): Layer | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !opts.mobile, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  // Leer los logs de cada shader obliga a esperar a que compile: en
  // producción no se usan (igual que en engine.ts y despiece.ts).
  renderer.debug.checkShaderErrors = import.meta.env.DEV;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  let envTexture: THREE.Texture | null = null;
  // Los equipos esperan al reflejo: su shader depende de tenerlo.
  const envReady = roomEnvironment(renderer).then((tex) => {
    envTexture = tex;
    scene.environment = tex;
  });

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
  const timers: number[] = [];
  const list = opts.mobile
    ? slots.filter((s, i) => (i % 2 === 0 || slots.length <= 2) && !s.hiddenOnMobile)
    : slots;
  list.forEach((s, i) => {
    // escalonar la carga para no trabar el primer render
    timers.push(window.setTimeout(() => {
      load(s.url).then(async (g) => {
        if (!g || disposed) return;
        g.scale.setScalar(s.scale);
        // Solo se mueve el grupo: las piezas de adentro no recalculan su matriz en cada frame.
        g.traverse((o) => {
          if (o === g) return;
          o.updateMatrix();
          o.matrixAutoUpdate = false;
        });
        // Compila los shaders en paralelo antes de mostrarlo. Dibujarlo
        // directo compilaba en el primer frame y congelaba la página (en
        // celular, justo cuando la persona empezaba a scrollear).
        await envReady;
        if (disposed) return;
        g.visible = false;
        scene.add(g);
        try {
          await renderer.compileAsync(g, camera, scene);
        } catch {
          /* si falla, compila al dibujar, como antes */
        }
        if (disposed) return;
        g.visible = true;
        items.push({ g, s });
      });
    }, 150 * i));
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
  // Se dibuja solo si la escena está en pantalla y no la tapa el video del
  // zoom. Antes seguía a 60 fps con la persona ya más abajo en la página.
  let active = true;
  let onScreen = true;
  let raf = 0;
  let next = 0;
  const wake = () => {
    if (active && onScreen && !disposed && !raf && !next) raf = requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    wake();
  });
  io.observe(canvas);
  // En celular a 30 fps: el giro es lento y no se nota, y deja la mitad
  // del tiempo libre para el scroll. El frame siguiente se pide con un
  // timeout: pedirlo en cada refresco y saltearlo igual hacía trabajar al
  // navegador a 60 por segundo.
  const frameMs = opts.mobile ? 1000 / 30 - 4 : 0;
  const timer = new THREE.Timer();
  const tick = () => {
    raf = 0;
    if (!active || !onScreen || disposed) return;
    if (frameMs) next = window.setTimeout(() => { next = 0; wake(); }, frameMs);
    else raf = requestAnimationFrame(tick);
    timer.update();
    const t = timer.getElapsed();
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
  };
  wake();

  return {
    setPointer: (x, y) => { pointer.tx = x; pointer.ty = y; },
    setActive: (on) => {
      active = on;
      wake();
    },
    dispose: () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(next);
      timer.dispose();
      timers.forEach((t) => window.clearTimeout(t));
      io.disconnect();
      ro.disconnect();
      envReady.then(() => envTexture?.dispose());
      renderer.dispose();
    },
  };
}
