import * as THREE from "three";

// Los modelos de cada vista salen de models.ts. El iPhone procedural de acá
// abajo solo aparece si un .glb no carga.

// Dimensiones del placeholder (alto del modelo, para encuadre de cámara)
export const PHONE_HALF_HEIGHT = 1.06;

// ── Geometría base ───────────────────────────────────────────
const W = 1.05;
const H = 2.12;
const D = 0.2;
const CORNER = 0.3;
const BEVEL = 0.018;
const BUMP = 0.66;
const BUMP_R = 0.17;
const BUMP_DEPTH = 0.062;
const BUMP_X = 0.17;
const BUMP_Y = 0.66;
const LENS_Z = D / 2 + BUMP_DEPTH + 0.004;

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const x = -w / 2;
  const y = -h / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function normalizeUV(geo: THREE.BufferGeometry) {
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  const sw = bb.max.x - bb.min.x || 1;
  const sh = bb.max.y - bb.min.y || 1;
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - bb.min.x) / sw, (pos.getY(i) - bb.min.y) / sh);
  }
  uv.needsUpdate = true;
}

/**
 * Degradé del reflejo ambiental. El motor no lo procesa en vivo: usa
 * env-cubeuv.png, que es este degradé ya pasado por PMREMGenerator (ver
 * ENV_CUBEUV en engine.ts). Si lo cambiás, hay que regenerar ese PNG.
 */
export function makeEnvTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  // Grises de la paleta con la misma luminosidad que los azules de antes:
  // reflejos plateados sin cambiar lo claro u oscuro del metal.
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#171819");
  g.addColorStop(0.32, "#292b2d");
  g.addColorStop(0.5, "#777a7e");
  g.addColorStop(0.6, "#171819");
  g.addColorStop(1, "#08090a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 256);
  ctx.fillStyle = "rgba(226,227,229,0.55)";
  ctx.fillRect(0, 118, 64, 12);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeWallpaper(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 256, 512);
  g.addColorStop(0, "#171819");
  g.addColorStop(0.5, "#0d0d0d");
  g.addColorStop(1, "#08090a");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 512);
  const rg = ctx.createRadialGradient(150, 180, 0, 150, 180, 240);
  rg.addColorStop(0, "rgba(196,196,196,0.3)");
  rg.addColorStop(1, "rgba(196,196,196,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, 256, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Resultado de crear un teléfono: el grupo y los materiales del "color del equipo". */
export interface PhoneInstance {
  group: THREE.Group;
  /**
   * Materiales que representan el color del equipo (se tintan al elegir color).
   * Vacío = el modelo se muestra con su color/textura nativa (no se tinta).
   */
  colorMats: (THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial)[];
  /** Colores nativos de `colorMats` (para restaurar en vistas sin tinte). */
  nativeColors: THREE.Color[];
  dispose: () => void;
}

/** Nombres de material que corresponden al dorso/cuerpo coloreable del iPhone. */
const BODY_MAT_RE = /back[\s_-]?(cover|glass|panel)|\bbody\b|chassis/i;

/** Crea el iPhone placeholder generado por código. */
export function createProceduralPhone(): PhoneInstance {
  const group = new THREE.Group();
  const wallpaper = makeWallpaper();

  const frameMat = new THREE.MeshPhysicalMaterial({
    color: 0x85888b,
    metalness: 1,
    roughness: 0.36,
    clearcoat: 0.3,
    clearcoatRoughness: 0.45,
    envMapIntensity: 1.35,
  });
  const screenMat = new THREE.MeshPhysicalMaterial({
    color: 0x08090a,
    metalness: 0,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.5,
    map: wallpaper,
    emissive: 0x171819,
    emissiveMap: wallpaper,
    emissiveIntensity: 0.45,
  });
  const islandMat = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: 0.5 });
  const backMat = new THREE.MeshPhysicalMaterial({
    color: 0x242527,
    metalness: 0.42,
    roughness: 0.52,
    clearcoat: 0.5,
    clearcoatRoughness: 0.26,
    envMapIntensity: 0.95,
  });
  const bumpMat = new THREE.MeshPhysicalMaterial({
    color: 0x202123,
    metalness: 0.6,
    roughness: 0.38,
    clearcoat: 0.45,
    clearcoatRoughness: 0.3,
    envMapIntensity: 1.05,
  });
  const lensRingMat = new THREE.MeshStandardMaterial({
    color: 0x343638,
    metalness: 1,
    roughness: 0.26,
    envMapIntensity: 1.4,
  });
  const lensGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x08090a,
    metalness: 0,
    roughness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.7,
  });
  const lensHiMat = new THREE.MeshStandardMaterial({
    color: 0x777a7e,
    emissive: 0x777a7e,
    emissiveIntensity: 0.55,
    roughness: 0.3,
  });
  const flashMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    emissive: 0xe2e3e5,
    emissiveIntensity: 0.5,
    roughness: 0.4,
  });
  const sensorMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.4 });
  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0x343638,
    metalness: 1,
    roughness: 0.42,
  });

  const materials: THREE.Material[] = [
    frameMat, screenMat, islandMat, backMat, bumpMat, lensRingMat,
    lensGlassMat, lensHiMat, flashMat, sensorMat, buttonMat,
  ];
  const geometries: THREE.BufferGeometry[] = [];
  const track = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };

  // Body
  const bodyGeo = track(
    new THREE.ExtrudeGeometry(roundedRectShape(W, H, CORNER), {
      depth: D,
      bevelEnabled: true,
      bevelThickness: BEVEL,
      bevelSize: BEVEL,
      bevelSegments: 4,
      curveSegments: 28,
    })
  );
  bodyGeo.translate(0, 0, -D / 2);
  bodyGeo.computeVertexNormals();
  group.add(new THREE.Mesh(bodyGeo, frameMat));

  // Front
  const screenGeo = track(
    new THREE.ShapeGeometry(roundedRectShape(W - 0.07, H - 0.07, 0.26), 32)
  );
  normalizeUV(screenGeo);
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.z = D / 2 + 0.002;
  group.add(screen);

  const islandGeo = track(new THREE.ShapeGeometry(roundedRectShape(0.42, 0.12, 0.06), 24));
  const island = new THREE.Mesh(islandGeo, islandMat);
  island.position.set(0, H / 2 - 0.23, D / 2 + 0.004);
  group.add(island);

  // Back
  const backGroup = new THREE.Group();
  backGroup.rotation.y = Math.PI;

  const backGeo = track(new THREE.ShapeGeometry(roundedRectShape(W - 0.04, H - 0.04, 0.27), 28));
  const back = new THREE.Mesh(backGeo, backMat);
  back.position.z = D / 2 + 0.002;
  backGroup.add(back);

  const bumpGeo = track(
    new THREE.ExtrudeGeometry(roundedRectShape(BUMP, BUMP, BUMP_R), {
      depth: BUMP_DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 3,
      curveSegments: 24,
    })
  );
  const bump = new THREE.Mesh(bumpGeo, bumpMat);
  bump.position.set(BUMP_X, BUMP_Y, D / 2 + 0.001);
  backGroup.add(bump);

  const ringGeo = track(new THREE.TorusGeometry(0.1, 0.022, 18, 44));
  const glassGeo = track(new THREE.CircleGeometry(0.085, 44));
  const hiGeo = track(new THREE.CircleGeometry(0.03, 28));
  const lensPositions: [number, number][] = [
    [BUMP_X - 0.14, BUMP_Y + 0.14],
    [BUMP_X + 0.14, BUMP_Y + 0.14],
    [BUMP_X, BUMP_Y - 0.16],
  ];
  for (const [lx, ly] of lensPositions) {
    const lens = new THREE.Group();
    const ring = new THREE.Mesh(ringGeo, lensRingMat);
    ring.position.z = LENS_Z;
    const glass = new THREE.Mesh(glassGeo, lensGlassMat);
    glass.position.z = LENS_Z + 0.006;
    const hi = new THREE.Mesh(hiGeo, lensHiMat);
    hi.position.set(-0.03, 0.03, LENS_Z + 0.008);
    lens.add(ring, glass, hi);
    lens.position.set(lx, ly, 0);
    backGroup.add(lens);
  }

  const flashGeo = track(new THREE.CircleGeometry(0.04, 28));
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.set(BUMP_X + 0.22, BUMP_Y + 0.02, LENS_Z);
  backGroup.add(flash);

  const sensorGeo = track(new THREE.CircleGeometry(0.028, 24));
  const sensor = new THREE.Mesh(sensorGeo, sensorMat);
  sensor.position.set(BUMP_X + 0.22, BUMP_Y + 0.24, LENS_Z);
  backGroup.add(sensor);

  group.add(backGroup);

  // Buttons
  const mkButton = (x: number, y: number, sx: number, sy: number, sz: number) => {
    const geo = track(new THREE.BoxGeometry(sx, sy, sz));
    const m = new THREE.Mesh(geo, buttonMat);
    m.position.set(x, y, 0);
    group.add(m);
  };
  mkButton(W / 2 + 0.006, -0.12, 0.035, 0.5, 0.05);
  mkButton(-(W / 2 + 0.006), 0.3, 0.035, 0.16, 0.05);
  mkButton(-(W / 2 + 0.006), 0.06, 0.035, 0.16, 0.05);
  mkButton(-(W / 2 + 0.006), 0.52, 0.035, 0.11, 0.05);

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    wallpaper.dispose();
  };

  return {
    group,
    colorMats: [backMat],
    nativeColors: [backMat.color.clone()],
    dispose,
  };
}

/**
 * Carga un modelo .glb/.gltf real. Import dinámico para no pesar el bundle
 * cuando se usa el placeholder. Devuelve null si falla (el visor cae al placeholder).
 */
export async function loadGltfPhone(url: string): Promise<PhoneInstance | null> {
  try {
    const mod = await import("three/examples/jsm/loaders/GLTFLoader.js");
    const loader = new mod.GLTFLoader();
    // Los .glb están comprimidos con meshopt (EXT_meshopt_compression):
    // hace falta el decoder. WebP y quantization los maneja GLTFLoader nativo.
    const { MeshoptDecoder } = await import(
      "three/examples/jsm/libs/meshopt_decoder.module.js"
    );
    await MeshoptDecoder.ready;
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url);
    const model = gltf.scene;

    // ── Normalización de orientación ───────────────────────────
    // Distintos .glb vienen de costado o acostados. Detectamos por bounding box
    // el eje más fino (grosor del teléfono) y lo ponemos mirando a la cámara (Z),
    // y el eje más largo (alto) en vertical (Y). Rotamos en pasos de 90° sobre
    // ejes de mundo para que sea robusto.
    const WX = new THREE.Vector3(1, 0, 0);
    const WY = new THREE.Vector3(0, 1, 0);
    const WZ = new THREE.Vector3(0, 0, 1);
    const measure = () =>
      new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());

    let size = measure();
    const minDim = Math.min(size.x, size.y, size.z);
    if (size.x === minDim) model.rotateOnWorldAxis(WY, Math.PI / 2); // grosor X → Z
    else if (size.y === minDim) model.rotateOnWorldAxis(WX, Math.PI / 2); // grosor Y → Z
    model.updateMatrixWorld(true);

    size = measure();
    if (size.x > size.y) {
      model.rotateOnWorldAxis(WZ, Math.PI / 2); // alto X → Y
      model.updateMatrixWorld(true);
    }

    // Escala a la altura objetivo y centrado en el origen.
    size = measure();
    const scale = size.y > 0 ? (PHONE_HALF_HEIGHT * 2) / size.y : 1;
    model.scale.multiplyScalar(scale);
    model.updateMatrixWorld(true);
    const center = new THREE.Box3()
      .setFromObject(model)
      .getCenter(new THREE.Vector3());
    model.position.sub(center);

    // Contenedor exterior: el loop rota este grupo; el modelo conserva su
    // orientación/escala corregida adentro.
    const group = new THREE.Group();
    group.add(model);

    // Tintamos SOLO los materiales del dorso/cuerpo (por nombre). Si el modelo
    // no tiene materiales reconocibles (ej. scans con textura única), no se tinta
    // y se respeta su apariencia nativa (evita el "rectángulo negro").
    const colorMats: (THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial)[] = [];
    model.traverse((o) => {
      const mesh = o as THREE.Mesh;
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      const list = Array.isArray(mat) ? mat : mat ? [mat] : [];
      for (const m of list) {
        if (
          (m instanceof THREE.MeshStandardMaterial ||
            m instanceof THREE.MeshPhysicalMaterial) &&
          m.name &&
          BODY_MAT_RE.test(m.name) &&
          !colorMats.includes(m)
        ) {
          colorMats.push(m);
        }
      }
    });
    const dispose = () => {
      model.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
    };
    return {
      group,
      colorMats,
      nativeColors: colorMats.map((m) => m.color.clone()),
      dispose,
    };
  } catch (err) {
    console.warn("[phone] No se pudo cargar el modelo .glb, uso placeholder:", err);
    return null;
  }
}

/** Tinta el color del equipo (cuerpo/dorso) en los materiales correspondientes. */
export function setPhoneColor(inst: PhoneInstance, hex: string): void {
  for (const m of inst.colorMats) m.color.set(hex);
}

/** Restaura el color nativo (para vistas que respetan el color del modelo). */
export function resetPhoneColor(inst: PhoneInstance): void {
  for (let i = 0; i < inst.colorMats.length; i++) {
    const native = inst.nativeColors[i];
    if (native) inst.colorMats[i].color.copy(native);
  }
}
