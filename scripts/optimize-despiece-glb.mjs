// ─────────────────────────────────────────────────────────────
//  Copia liviana del iPhone 14 Pro desarmable para la web.
//
//  Entrada: deliverables/iphone14pro/iphone14pro-assembled.glb (maestro,
//  ~24 MB, NO se toca). Salida: public/glb/iphone_14_pro_despiece.glb.
//
//  Qué hace:
//   - Texturas PNG grandes → WebP (mismo tamaño en píxeles). Eran ~14 MB
//     de los 24. Las de 128 px se quedan en PNG (pesan 17 KB).
//   - dedup: une texturas y accesorios repetidos. Los materiales con
//     nombre propio se conservan (keepUniqueNames).
//   - join: une las mallas hermanas de cada pieza que comparten material
//     (614 → ~100 dibujados por frame). Solo junta DENTRO de cada grupo:
//     los 12 grupos, sus nombres, pivotes (matrix) y extras quedan igual.
//   - meshopt + cuantización: la geometría baja a una fracción. El motor
//     ya trae el decoder (lo usan los otros .glb).
//
//  Al final compara los 12 grupos contra el maestro y corta si algo cambió.
//
//  Cómo correrlo (las dependencias no están en el proyecto a propósito,
//  se usan una sola vez):
//    npm i --no-save @gltf-transform/core@4 @gltf-transform/extensions@4 \
//      @gltf-transform/functions@4 meshoptimizer sharp
//    node scripts/optimize-despiece-glb.mjs
//  (Ojo: en esta PC el textureCompress de gltf-transform falla por un bug
//  de libvips; por eso acá las texturas se convierten con sharp a mano.)
// ─────────────────────────────────────────────────────────────
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTTextureWebP } from "@gltf-transform/extensions";
import { dedup, join, meshopt, prune } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC =
  process.argv[2] ??
  path.join(root, "deliverables/iphone14pro/iphone14pro-assembled.glb");
const OUT =
  process.argv[3] ?? path.join(root, "public/glb/iphone_14_pro_despiece.glb");

/** Texturas por debajo de esto quedan como están. */
const SMALL_BYTES = 64 * 1024;
const WEBP_QUALITY = 86;

await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder });

const doc = await io.read(SRC);
const docRoot = doc.getRoot();

/** Nombre, matrix y extras de los grupos con metadatos de despiece. */
function snapshotParts(d) {
  return d
    .getRoot()
    .listNodes()
    .filter((n) => n.getExtras()?.assembledPosition)
    .map((n) => ({
      name: n.getName(),
      matrix: n.getMatrix().map((v) => +v.toFixed(9)),
      extras: JSON.stringify(n.getExtras()),
      parent: n.getParentNode()?.getName() ?? null,
    }));
}
const before = snapshotParts(doc);
const materialNames = new Set(docRoot.listMaterials().map((m) => m.getName()));

// ── Texturas → WebP ──────────────────────────────────────────
const webp = doc.createExtension(EXTTextureWebP).setRequired(true);
let converted = 0;
for (const tex of docRoot.listTextures()) {
  const img = tex.getImage();
  if (!img || img.byteLength < SMALL_BYTES) continue;
  const out = await sharp(Buffer.from(img))
    .webp({ quality: WEBP_QUALITY, alphaQuality: 90, effort: 6 })
    .toBuffer();
  tex.setImage(new Uint8Array(out)).setMimeType("image/webp");
  if (tex.getURI()) tex.setURI(tex.getURI().replace(/\.png$/i, ".webp"));
  converted++;
}
if (!converted) webp.dispose();

// ── Geometría ────────────────────────────────────────────────
await doc.transform(
  dedup({ keepUniqueNames: true }),
  // Solo se juntan hijos de un mismo grupo de pieza: los grupos no tienen
  // malla propia, así que join nunca los toca.
  join({ keepNamed: false }),
  prune({ keepExtras: true }),
  meshopt({ encoder: MeshoptEncoder, level: "medium" })
);

// ── Verificación ─────────────────────────────────────────────
const after = snapshotParts(doc);
const same =
  before.length === 12 &&
  after.length === before.length &&
  before.every((b, i) => JSON.stringify(b) === JSON.stringify(after[i]));
if (!same) {
  console.error("Los grupos cambiaron:", { before, after });
  process.exit(1);
}
const lostMaterials = [...materialNames].filter(
  (n) => !docRoot.listMaterials().some((m) => m.getName() === n)
);
if (lostMaterials.length) {
  console.error("Se perdieron materiales:", lostMaterials);
  process.exit(1);
}

await io.write(OUT, doc);
const mb = (f) => (fs.statSync(f).size / 1e6).toFixed(2) + " MB";
console.log(
  `${path.basename(SRC)} (${mb(SRC)}) → ${path.relative(root, OUT)} (${mb(OUT)})`
);
console.log(
  `grupos intactos: ${after.length}, mallas: ${docRoot.listMeshes().length}, ` +
    `materiales: ${docRoot.listMaterials().length}, texturas WebP: ${converted}`
);
