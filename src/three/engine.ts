import * as THREE from "three";
import { allowHeavy } from "@/anim/motion";
import {
  createProceduralPhone,
  loadGltfPhone,
  makeEnvTexture,
  setPhoneColor,
  resetPhoneColor,
  PHONE_HALF_HEIGHT,
  type PhoneInstance,
} from "@/three/phone";
import type { ModelPriority, ViewState } from "@/three/PhoneStage";
// ?inline: va embebido en este chunk (~13 KB), sin otro pedido de red.
import envCubeUvUrl from "@/three/env-cubeuv.png?inline";

// ─────────────────────────────────────────────────────────────
//  Motor 3D. Vive en su propio chunk (junto con three.js, ~150 KB gzip) y
//  PhoneStage lo importa recién después del primer render: el texto de la
//  página no espera a que baje y arranque WebGL.
// ─────────────────────────────────────────────────────────────

// Resolución del buffer 3D compartido (se "estampa" escalado en cada card).
const RT_W = 512;
const RT_H = 768;

// Con el motor en marcha, en celulares el 3D se dibuja a 30 fps: el giro es
// lento y no se nota, y es la mitad de trabajo para el CPU y la batería.
const MOBILE_FRAME_S = 1 / 30;

/**
 * Reflejo ambiental ya pasado por PMREMGenerator (formato CubeUV). Calcularlo
 * en vivo compilaba y corría sus shaders al arrancar y trababa la página
 * ~0,2 s en PC y bastante más en celulares; como sale siempre del mismo
 * degradé (makeEnvTexture en phone.ts), se calculó una vez y se guardó.
 * Cómo se generó: PMREMGenerator.fromEquirectangular(makeEnvTexture()),
 * readRenderTargetPixels del resultado (336x64, half float lineal) y cada
 * valor a sRGB 8 bits en un PNG RGB, con las filas en el orden en que las
 * devuelve WebGL (sin invertir). Contra el cálculo en vivo difiere 1-2
 * niveles de 255 como máximo. Si cambia el degradé, hay que regenerarlo.
 */
const ENV_CUBEUV = envCubeUvUrl;

export interface Engine {
  /** Baja, compila y cachea un modelo .glb (idempotente). */
  ensureModel: (url: string, priority: ModelPriority) => void;
  /** Algo cambió en una vista (visible, color, scroll, arrastre): volver a dibujar. */
  wake: () => void;
  dispose: () => void;
}

interface ModelEntry {
  inst: PhoneInstance | null;
  failed: boolean;
}

function fitZ(fovDeg: number, halfHeight: number, margin: number): number {
  const fov = (fovDeg * Math.PI) / 180;
  return (halfHeight / Math.tan(fov / 2)) * margin;
}

/** Devuelve null si el navegador no tiene WebGL (se usa el mockup SVG). */
export function createEngine(
  views: Map<number, ViewState>,
  activeDrag: { current: ViewState | null }
): Engine | null {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const throttle = !allowHeavy();

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
      // Cada vista se copia con drawImage en la misma tarea en que se
      // renderiza, así que no hace falta conservar el buffer entre frames
      // (conservarlo le cuesta una copia extra a las GPU de celular).
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    });
  } catch (err) {
    console.warn("[PhoneStage] WebGL no disponible, uso fallback:", err);
    return null;
  }
  // Leer los logs de cada shader obliga a esperar a que termine de compilar:
  // en producción no se usan y congelaban la página.
  renderer.debug.checkShaderErrors = import.meta.env.DEV;

  renderer.setPixelRatio(1);
  renderer.setSize(RT_W, RT_H, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const glCanvas = renderer.domElement;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, RT_W / RT_H, 0.1, 100);
  camera.position.set(0, 0.12, fitZ(32, PHONE_HALF_HEIGHT, 1.3));

  // Reflejo ambiental pre-calculado (ver ENV_CUBEUV arriba). Los modelos
  // esperan a que esté listo: su shader depende de tenerlo.
  let envTexture: THREE.Texture | null = null;
  const envReady: Promise<void> = new THREE.TextureLoader()
    .loadAsync(ENV_CUBEUV)
    .then((tex) => {
      tex.mapping = THREE.CubeUVReflectionMapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.flipY = false; // las filas van en el orden en que las lee WebGL
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return tex;
    })
    .catch(() => {
      // Si el PNG no carga, se calcula en vivo como antes (más lento).
      const pmrem = new THREE.PMREMGenerator(renderer);
      const src = makeEnvTexture();
      const tex = pmrem.fromEquirectangular(src).texture;
      src.dispose();
      pmrem.dispose();
      return tex;
    })
    .then((tex) => {
      envTexture = tex;
      scene.environment = tex;
    });

  scene.add(new THREE.AmbientLight(0xffffff, 0.32));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(4, 6, 6);
  scene.add(key);
  // Luces neutras (antes azules): cada gris tiene la misma luminosidad que
  // el azul que reemplaza, así la escena no queda ni más clara ni más oscura.
  const fill = new THREE.DirectionalLight(0x85888b, 1.2);
  fill.position.set(-6, 1, 3);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xc4c4c4, 1.4);
  rim.position.set(0, -2, -6);
  scene.add(rim);
  const accent = new THREE.PointLight(0x777a7e, 7, 22);
  accent.position.set(-3, 4, 5);
  scene.add(accent);

  let disposed = false;
  const models = new Map<string, ModelEntry>();

  const markDirty = (url: string) => {
    for (const v of views.values()) if (v.modelKey === url) v.dirty = true;
    wake();
  };

  /**
   * Compila los shaders del modelo en paralelo (KHR_parallel_shader_compile)
   * antes de mostrarlo. Renderizarlo directo compilaba en el primer frame y
   * congelaba la página varios segundos en celulares.
   */
  const prepare = async (inst: PhoneInstance): Promise<void> => {
    await envReady;
    inst.group.visible = false;
    scene.add(inst.group);
    await renderer.compileAsync(inst.group, camera, scene);
  };

  // iPhone procedural: solo si un .glb no carga. Antes se mostraba mientras
  // bajaba cada modelo y compilaba 11 materiales que se tiraban al toque.
  let procedural: Promise<PhoneInstance> | null = null;
  const getProcedural = () => {
    procedural ??= (async () => {
      const inst = createProceduralPhone();
      await prepare(inst);
      return inst;
    })();
    return procedural;
  };

  // Modelos "idle" (los laterales del hero): esperan a que la página termine
  // de cargar y el hilo principal quede libre, para no pelear ancho de banda
  // con lo que se ve primero.
  const deferred = new Set<string>();
  let idleFlushed = false;

  const load = (url: string) => {
    const entry: ModelEntry = { inst: null, failed: false };
    models.set(url, entry);
    // Vista sin modelo ("") = iPhone procedural.
    (url ? loadGltfPhone(url) : Promise.resolve(null))
      .then(async (loaded) => {
        const inst = loaded ?? (await getProcedural());
        entry.failed = !loaded;
        if (disposed) {
          loaded?.dispose();
          return;
        }
        await prepare(inst);
        if (disposed) return;
        entry.inst = inst;
        markDirty(url);
      })
      .catch((err) => console.warn("[PhoneStage] modelo sin cargar:", err));
  };

  const ensureModel = (url: string, priority: ModelPriority) => {
    if (models.has(url)) return;
    if (priority === "idle" && !idleFlushed) {
      deferred.add(url);
      return;
    }
    load(url);
  };

  const flushIdle = () => {
    if (disposed || idleFlushed) return;
    idleFlushed = true;
    for (const url of deferred) if (!models.has(url)) load(url);
    deferred.clear();
  };
  const scheduleIdle = () => {
    const ric = window.requestIdleCallback;
    if (ric) ric(flushIdle, { timeout: 2500 });
    else window.setTimeout(flushIdle, 1200);
  };
  if (document.readyState === "complete") scheduleIdle();
  else window.addEventListener("load", scheduleIdle, { once: true });

  const onMove = (e: PointerEvent) => {
    const v = activeDrag.current;
    if (!v || !v.dragging) return;
    const dx = e.clientX - v.prevX;
    const dy = e.clientY - v.prevY;
    v.prevX = e.clientX;
    v.prevY = e.clientY;
    v.targetRotY += dx * 0.006;
    v.targetRotX = Math.min(0.6, Math.max(-0.6, v.targetRotX + dy * 0.006));
    v.velX = dx * 0.006;
    wake();
  };
  const onUp = () => {
    const v = activeDrag.current;
    if (v) {
      v.dragging = false;
      v.canvas.style.cursor = "grab";
    }
    activeDrag.current = null;
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  const timer = new THREE.Timer();
  // El loop se duerme cuando no hay nada que mover en pantalla. Antes pedía
  // un frame en cada refresco aunque no hubiera ningún iPhone a la vista, y
  // eso obligaba al navegador a recalcular estilos y componer la página
  // entera 60 veces por segundo (en celular, ~la mitad del procesador).
  let raf = 0;
  let timeout = 0;
  let sinceFrame = 0;
  const wake = () => {
    if (disposed || raf || timeout) return;
    raf = requestAnimationFrame(animate);
  };
  // En celular (30 fps) el próximo frame se pide con un timeout: pedirlo
  // en cada refresco y saltearlo igual hacía trabajar al navegador a 60.
  const scheduleNext = (busy: boolean) => {
    if (!busy || disposed) return;
    if (throttle && !activeDrag.current) {
      timeout = window.setTimeout(() => {
        timeout = 0;
        wake();
      }, MOBILE_FRAME_S * 1000 - 4);
    } else raf = requestAnimationFrame(animate);
  };
  // Un tercio de la frecuencia del loop (10 fps en celular, 20 en desktop).
  const backgroundFrameS = (throttle ? MOBILE_FRAME_S : 1 / 60) * 3 * 0.9;
  const animate = () => {
    raf = 0;
    timer.update();
    const frameDt = timer.getDelta();
    const t = timer.getElapsed();
    // ¿Hay algo que siga moviéndose? Si no, el loop se duerme hasta wake().
    let busy = !!activeDrag.current;

    sinceFrame += frameDt;
    const dt = Math.min(sinceFrame, 0.05);
    sinceFrame = 0;

    for (const view of views.values()) {
      if (!view.visible || view.canvas.width === 0) continue;
      const entry = models.get(view.modelKey);
      const inst = entry?.inst;
      if (!inst) continue; // todavía baja o compila: el canvas queda vacío

      // Las de fondo (laterales del hero: chicas y borrosas) se redibujan a
      // un tercio de la frecuencia, salvo que alguien las esté arrastrando.
      if (
        view.background &&
        !view.dragging &&
        !view.dirty &&
        t - view.lastDraw < backgroundFrameS
      ) {
        busy = true;
        continue;
      }
      // El giro va por el tiempo desde el último dibujo de ESTA vista, así
      // gira igual de rápido aunque se dibuje menos seguido.
      const vdt = Math.min(t - view.lastDraw, view.background ? 0.15 : dt);

      const AUTO = reduce || !view.autoSpin ? 0 : view.interactive ? 0.28 : 0.5;
      if (!view.dragging) {
        view.targetRotY += AUTO * vdt + view.velX;
        view.velX *= 0.92;
      }
      const easing =
        Math.abs(view.targetRotY - view.rotY) > 1e-4 ||
        Math.abs(view.targetRotX - view.rotX) > 1e-4;
      const floating = view.float && !reduce;
      // Vista quieta (card en celular, reduced motion): se dibuja solo cuando
      // algo cambia (color, scroll, modelo recién cargado, tamaño).
      if (!view.dirty && !easing && !floating && AUTO === 0) continue;
      if (easing || floating || AUTO !== 0 || view.dragging) busy = true;
      view.dirty = false;
      view.lastDraw = t;

      view.rotY += (view.targetRotY - view.rotY) * 0.1;
      view.rotX += (view.targetRotX - view.rotX) * 0.1;

      inst.group.visible = true;
      inst.group.rotation.set(view.rotX, view.rotY + view.scrollSpin, 0);
      inst.group.position.y = floating
        ? Math.sin(t * 0.8 + view.floatPhase) * 0.05
        : 0;
      if (view.tint) setPhoneColor(inst, view.color);
      else resetPhoneColor(inst);

      // Se dibuja al tamaño en que se ve, sin pasarse del buffer: una card
      // en celular necesita ~1/4 de los píxeles del buffer completo.
      const cw = view.canvas.width;
      const ch = view.canvas.height;
      const fit = Math.min(cw / RT_W, ch / RT_H);
      const rw = Math.max(1, Math.round(RT_W * Math.min(fit, 1)));
      const rh = Math.max(1, Math.round(RT_H * Math.min(fit, 1)));
      renderer.setViewport(0, 0, rw, rh);
      renderer.render(scene, camera);
      inst.group.visible = false;

      const dw = RT_W * fit;
      const dh = RT_H * fit;
      view.ctx.clearRect(0, 0, cw, ch);
      // El viewport de WebGL arranca abajo a la izquierda: en coordenadas
      // del canvas es la franja de abajo del buffer.
      view.ctx.drawImage(
        glCanvas,
        0,
        RT_H - rh,
        rw,
        rh,
        (cw - dw) / 2,
        (ch - dh) / 2,
        dw,
        dh
      );
      // Fundido de entrada la primera vez que el modelo se ve.
      if (view.canvas.style.opacity !== "1") view.canvas.style.opacity = "1";
    }
    scheduleNext(busy);
  };
  wake();

  return {
    ensureModel,
    wake,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
      timer.dispose();
      window.removeEventListener("load", scheduleIdle);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      for (const entry of models.values()) {
        if (!entry.failed) entry.inst?.dispose();
      }
      models.clear();
      procedural?.then((p) => p.dispose());
      envTexture?.dispose();
      renderer.dispose();
    },
  };
}
