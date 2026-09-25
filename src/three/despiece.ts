import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { partAmount, rotationAt } from "@/three/despieceTimeline";

// ─────────────────────────────────────────────────────────────
//  Escena del iPhone 14 Pro desarmable (sección "Por dentro").
//  Chunk aparte: la sección la importa recién cuando se acerca a la
//  pantalla. Tiene su propio renderer porque ocupa media pantalla o más;
//  el motor compartido de engine.ts está pensado para cards chicas.
//
//  Dibuja solo cuando algo cambia (scroll, tamaño, carga): quieta no gasta
//  batería.
// ─────────────────────────────────────────────────────────────

export interface DespieceFrame {
  /** Posición en px (CSS) de la pieza señalada dentro del canvas. */
  x: number;
  y: number;
  visible: boolean;
}

export interface DespieceScene {
  /** Progreso del scroll, 0 (armado) → 1 (desarmado). */
  setProgress: (p: number) => void;
  /** Grupo a señalar con la marca (nombre del .glb) o null. */
  setFocus: (part: string | null) => void;
  resize: (width: number, height: number) => void;
  /** Dibuja la pose de `p` y devuelve el PNG (solo para desarrollo). */
  snapshot: (p: number) => string;
  /** Posiciones actuales de los grupos (solo para desarrollo). */
  debugPositions: () => Record<string, number[]>;
  dispose: () => void;
}

interface Part {
  obj: THREE.Object3D;
  name: string;
  assembled: THREE.Vector3;
  offset: THREE.Vector3;
  /** Caja de la pieza en su propio espacio (la pieza solo se traslada). */
  box: THREE.Box3;
}

interface Options {
  canvas: HTMLCanvasElement;
  url: string;
  pixelRatio: number;
  /** 0-1 mientras baja; null si el servidor no informa el tamaño. */
  onProgress: (ratio: number | null) => void;
  onFrame: (frame: DespieceFrame) => void;
  /** Se perdió el contexto WebGL (GPU reiniciada, memoria, etc.). */
  onContextLost: () => void;
}

/** Aire alrededor del conjunto: más al arrancar, más justo desarmado. */
const MARGIN_START = 1.3;
const MARGIN_EXPLODED = 1.1;
const FOV = 30;

let decoderReady: Promise<void> | null = null;

/**
 * Crea la escena y baja el modelo. Rechaza si no hay WebGL o si el modelo
 * no carga: la sección muestra entonces la versión estática. Si se
 * resuelve, quien la pidió es responsable de llamar a dispose().
 */
export async function createDespieceScene(opts: Options): Promise<DespieceScene> {
  const { canvas } = opts;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.debug.checkShaderErrors = import.meta.env.DEV;
  renderer.setPixelRatio(opts.pixelRatio);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  let disposed = false;
  let raf = 0;
  let model: THREE.Object3D | null = null;

  const onLost = (e: Event) => {
    e.preventDefault();
    opts.onContextLost();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.01, 3);

  // Reflejos neutros de estudio: el modelo es PBR y sin entorno los metales
  // y el vidrio se ven negros. Encima, luces con los azules del sitio.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envTex = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();
  scene.environment = envTex;
  scene.environmentIntensity = 0.85;

  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.position.set(0.6, 1, 1.2);
  const fill = new THREE.DirectionalLight(0x8ab4ff, 0.7);
  fill.position.set(-1.2, 0.2, 0.6);
  const rim = new THREE.DirectionalLight(0x2e7bff, 2.2);
  rim.position.set(-0.4, 0.6, -1.4);
  scene.add(new THREE.AmbientLight(0xffffff, 0.15), key, fill, rim);

  // El conjunto gira dentro de `pivot`; el modelo va centrado adentro.
  const pivot = new THREE.Group();
  scene.add(pivot);

  const disposeAll = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    canvas.removeEventListener("webglcontextlost", onLost);
    const textures = new Set<THREE.Texture>();
    model?.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const m of mats) {
        for (const value of Object.values(m)) {
          if (value instanceof THREE.Texture) textures.add(value);
        }
        m.dispose();
      }
    });
    textures.forEach((t) => t.dispose());
    envTex.dispose();
    renderer.dispose();
    // Suelta el contexto ya: en desarrollo StrictMode monta dos veces y los
    // navegadores limitan cuántos contextos WebGL conviven.
    renderer.forceContextLoss();
  };

  try {
    decoderReady ??= MeshoptDecoder.ready;
    await decoderReady;
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(opts.url, (e) => {
      opts.onProgress(e.lengthComputable && e.total > 0 ? e.loaded / e.total : null);
    });
    model = gltf.scene;
    return await setup(gltf.scene);
  } catch (err) {
    disposeAll();
    throw err;
  }

  async function setup(root: THREE.Object3D): Promise<DespieceScene> {
    // ── Grupos del despiece ──────────────────────────────────
    const parts: Part[] = [];
    root.traverse((o) => {
      const { assembledPosition: a, explodedOffset: d } = o.userData as {
        assembledPosition?: number[];
        explodedOffset?: number[];
      };
      if (!a || !d) return;
      parts.push({
        obj: o,
        name: o.name,
        assembled: new THREE.Vector3(a[0], a[1], a[2]),
        offset: new THREE.Vector3(d[0], d[1], d[2]),
        box: new THREE.Box3(),
      });
    });
    if (parts.length === 0) throw new Error("El modelo no trae grupos de despiece");

    // Centro del teléfono armado en el origen del pivote.
    for (const part of parts) part.obj.position.copy(part.assembled);
    pivot.add(root);
    pivot.updateMatrixWorld(true);
    const center = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());
    root.position.sub(center);
    pivot.updateMatrixWorld(true);

    const inv = new THREE.Matrix4();
    for (const part of parts) {
      inv.copy(part.obj.matrixWorld).invert();
      part.box.setFromObject(part.obj).applyMatrix4(inv);
    }
    root.traverse((o) => {
      // El encuadre ya contiene todas las piezas: no hace falta descartar.
      if ((o as THREE.Mesh).isMesh) o.frustumCulled = false;
    });

    // ── Pose y encuadre ──────────────────────────────────────
    let progress = 0;
    let focus: Part | null = null;
    let width = 1;
    let height = 1;

    const corner = new THREE.Vector3();
    const pts = Array.from({ length: parts.length * 8 }, () => new THREE.Vector3());
    const focusPos = new THREE.Vector3();
    const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

    /** Posición absoluta de cada grupo: armado + desplazamiento × avance. */
    const pose = (p: number) => {
      for (const part of parts) {
        const t = partAmount(part.name, p);
        part.obj.position.copy(part.assembled).addScaledVector(part.offset, t);
      }
      const [ry, rx] = rotationAt(p);
      pivot.rotation.set(rx, ry, 0);
      pivot.updateMatrixWorld(true);
    };

    /**
     * Cámara que mira siempre hacia -Z y se acerca o aleja para que entren
     * todas las piezas en el canvas (que en desktop no pisa la columna de
     * texto y en celular queda entre el título y la ficha).
     */
    const frame = (p: number) => {
      let k = 0;
      for (const part of parts) {
        const b = part.box;
        for (let i = 0; i < 8; i++) {
          corner.set(
            i & 1 ? b.max.x : b.min.x,
            i & 2 ? b.max.y : b.min.y,
            i & 4 ? b.max.z : b.min.z
          );
          pts[k++].copy(corner).applyMatrix4(part.obj.matrixWorld);
        }
      }
      const margin =
        MARGIN_START + (MARGIN_EXPLODED - MARGIN_START) * ramp(p, 0, 0.88);
      const tanH = tanV * camera.aspect;

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      for (const v of pts) {
        minX = Math.min(minX, v.x);
        maxX = Math.max(maxX, v.x);
        minY = Math.min(minY, v.y);
        maxY = Math.max(maxY, v.y);
        minZ = Math.min(minZ, v.z);
        maxZ = Math.max(maxZ, v.z);
      }
      const distFor = (cx: number, cy: number) => {
        let d = 0;
        for (const v of pts) {
          d = Math.max(
            d,
            v.z + (Math.abs(v.x - cx) * margin) / tanH,
            v.z + (Math.abs(v.y - cy) * margin) / tanV
          );
        }
        return d;
      };
      let cx = (minX + maxX) / 2;
      let cy = (minY + maxY) / 2;
      let dist = distFor(cx, cy);
      // Segunda pasada: lo cercano se ve más grande; recentra lo proyectado.
      let nMinX = Infinity, nMaxX = -Infinity, nMinY = Infinity, nMaxY = -Infinity;
      for (const v of pts) {
        const depth = dist - v.z;
        const nx = (v.x - cx) / (depth * tanH);
        const ny = (v.y - cy) / (depth * tanV);
        nMinX = Math.min(nMinX, nx);
        nMaxX = Math.max(nMaxX, nx);
        nMinY = Math.min(nMinY, ny);
        nMaxY = Math.max(nMaxY, ny);
      }
      cx += ((nMinX + nMaxX) / 2) * dist * tanH;
      cy += ((nMinY + nMaxY) / 2) * dist * tanV;
      dist = distFor(cx, cy);

      camera.position.set(cx, cy, dist);
      camera.lookAt(cx, cy, 0);
      // Planos de recorte ajustados al conjunto: las capas finas (vidrio,
      // pantalla, blindajes) no se pisan entre sí.
      camera.near = Math.max(0.005, (dist - maxZ) * 0.5);
      camera.far = (dist - minZ) * 1.6 + 0.05;
      camera.updateProjectionMatrix();
    };

    const render = () => {
      pose(progress);
      frame(progress);
      renderer.render(scene, camera);

      if (focus) {
        focus.box.getCenter(focusPos).applyMatrix4(focus.obj.matrixWorld).project(camera);
        opts.onFrame({
          x: ((focusPos.x + 1) / 2) * width,
          y: ((1 - focusPos.y) / 2) * height,
          visible: focusPos.z < 1,
        });
      } else {
        opts.onFrame({ x: 0, y: 0, visible: false });
      }
    };

    const invalidate = () => {
      if (disposed || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!disposed) render();
      });
    };

    // Compila los shaders antes del primer frame: si no, el primer scroll
    // sobre la sección se traba mientras compila.
    pose(0);
    frame(0);
    await renderer.compileAsync(scene, camera);

    return {
      setProgress(p) {
        const next = Math.min(1, Math.max(0, p));
        if (next === progress) return;
        progress = next;
        invalidate();
      },
      setFocus(name) {
        const next = name ? parts.find((part) => part.name === name) ?? null : null;
        if (next === focus) return;
        focus = next;
        invalidate();
      },
      resize(w, h) {
        width = Math.max(1, w);
        height = Math.max(1, h);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        invalidate();
      },
      snapshot(p) {
        const prev = progress;
        progress = p;
        render();
        const url = canvas.toDataURL("image/png");
        progress = prev;
        invalidate();
        return url;
      },
      debugPositions() {
        return Object.fromEntries(parts.map((part) => [part.name, part.obj.position.toArray()]));
      },
      dispose: disposeAll,
    };
  }
}

/** 0 antes de `from`, 1 después de `to`, lineal en el medio. */
function ramp(p: number, from: number, to: number): number {
  const t = (p - from) / (to - from);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}
