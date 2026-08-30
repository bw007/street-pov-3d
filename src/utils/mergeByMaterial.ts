import * as THREE from 'three';
import { mergeBufferGeometries } from 'three-stdlib';

/**
 * Collapse a loaded GLTF scene into ~one mesh per material, baking each mesh's
 * world transform into its geometry. This is a pure DRAW-CALL optimisation: the
 * result looks identical (same triangles, same materials, same world positions)
 * but a 155-mesh Sketchfab car renders in ~10 draw calls instead of 155.
 *
 * Drop-in for `scene.clone(true)`: it returns a fresh `THREE.Group` in the
 * scene's local frame, so the caller's usual fit-to-box (bbox → scale → centre)
 * and its `traverse` (to set shadow/raycast flags) keep working unchanged.
 *
 * The merged template is cached per source scene at module scope and handed back
 * as a `clone(true)`, so it is built ONCE per model URL and every instance shares
 * the merged geometry & materials — exactly the sharing `scene.clone(true)` gave.
 *
 * Correctness guards (behaviour-preserving by construction):
 *  - Only single-material, non-mirrored, non-vertex-coloured `Mesh`es are merged.
 *  - Mirrored (negative-determinant), multi-material or vertex-coloured meshes are
 *    kept as their own mesh WITH their transform on the object (geometry
 *    untouched) so the renderer still resolves their winding/vertex data right —
 *    they just don't fold into a batch.
 *  - Any `SkinnedMesh` aborts the merge and falls back to a plain clone: baking a
 *    world matrix would freeze the skin. NEVER call this on skinned/animated rigs.
 *  - Any throw falls back to `source.clone(true)`, so a model can never blank the
 *    <Canvas>. (Callers should still wrap usage in <SafeModel>.)
 */

const KEEP_ATTRS = ['position', 'normal', 'uv'] as const;

/** Built merged template per source scene — cloned per instance. */
const TEMPLATE_CACHE = new WeakMap<THREE.Object3D, THREE.Group>();

/**
 * Re-lay an attribute as a plain, de-interleaved, un-normalized Float32
 * BufferAttribute. mergeBufferGeometries requires every geometry in a bucket to
 * expose each attribute with the SAME array type; source GLBs freely mix Float32
 * with normalized-int and interleaved attributes, which is exactly what threw
 * "BufferAttribute.array must be of consistent array types across matching
 * attributes" (and left NaN positions in the half-merged result). getX/Y/Z/W
 * transparently handle interleaving + normalization.
 */
function toFloat32(
  attr: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  itemSize: number,
): THREE.BufferAttribute {
  // Fast path: already a plain, non-normalized Float32 attribute of the right
  // width — leave it as-is (no per-vertex copy). Buckets still end up uniform
  // because any mismatched sibling is converted to Float32 too.
  const plain = attr as THREE.BufferAttribute;
  if (
    !(attr as { isInterleavedBufferAttribute?: boolean }).isInterleavedBufferAttribute &&
    plain.array instanceof Float32Array &&
    plain.itemSize === itemSize &&
    plain.normalized === false
  ) {
    return plain;
  }
  const count = attr.count;
  const out = new Float32Array(count * itemSize);
  for (let i = 0; i < count; i++) {
    const o = i * itemSize;
    out[o] = attr.getX(i);
    if (itemSize > 1) out[o + 1] = attr.getY(i);
    if (itemSize > 2) out[o + 2] = attr.getZ(i);
    if (itemSize > 3) out[o + 3] = attr.getW(i);
  }
  return new THREE.BufferAttribute(out, itemSize);
}

/** Keep only position/normal/uv, each re-laid as a plain Float32 attribute, so
 *  every geometry in a bucket shares one identical layout. */
function normalizeGeometry(geo: THREE.BufferGeometry): void {
  if (!geo.getAttribute('normal')) geo.computeVertexNormals();
  const pos = geo.getAttribute('position');
  if (pos && !geo.getAttribute('uv')) {
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2));
  }
  for (const name of Object.keys(geo.attributes)) {
    if (!(KEEP_ATTRS as readonly string[]).includes(name)) geo.deleteAttribute(name);
  }
  const p = geo.getAttribute('position');
  const n = geo.getAttribute('normal');
  const u = geo.getAttribute('uv');
  if (p) geo.setAttribute('position', toFloat32(p, 3));
  if (n) geo.setAttribute('normal', toFloat32(n, 3));
  if (u) geo.setAttribute('uv', toFloat32(u, 2));
  geo.morphAttributes = {};
  geo.clearGroups();
}

function buildTemplate(source: THREE.Object3D): THREE.Group {
  const work = source.clone(true);
  work.updateMatrixWorld(true);

  const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
  const order: THREE.Material[] = [];
  const passthrough: THREE.Mesh[] = [];

  work.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    // Skinned rigs must never be baked — bail out to a plain clone entirely.
    if (child instanceof THREE.SkinnedMesh) throw new Error('skinned mesh: not mergeable');

    const geo = child.geometry as THREE.BufferGeometry;
    const mat = child.material;
    const single = Array.isArray(mat) ? null : mat;
    const mirrored = child.matrixWorld.determinant() < 0;

    // Merge only single-material, non-mirrored, non-vertex-coloured meshes.
    // Anything else is kept as its own mesh WITH its transform on the object
    // (geometry untouched) so the renderer resolves winding / groups itself.
    if (!single || mirrored || !geo.getAttribute('position') || single.vertexColors) {
      const keep = new THREE.Mesh(geo.clone(), mat);
      keep.applyMatrix4(child.matrixWorld);
      passthrough.push(keep);
      return;
    }

    const g = geo.clone();
    normalizeGeometry(g);
    g.applyMatrix4(child.matrixWorld);
    const list = buckets.get(single);
    if (list) {
      list.push(g);
    } else {
      buckets.set(single, [g]);
      order.push(single);
    }
  });

  const group = new THREE.Group();
  for (const mat of order) {
    let geoms = buckets.get(mat)!;
    // mergeBufferGeometries needs a uniform index presence across the batch.
    const allIndexed = geoms.every((g) => g.index);
    const anyIndexed = geoms.some((g) => g.index);
    if (anyIndexed && !allIndexed) geoms = geoms.map((g) => g.toNonIndexed());

    const merged = geoms.length === 1 ? geoms[0] : mergeBufferGeometries(geoms, false);
    if (merged) {
      group.add(new THREE.Mesh(merged, mat));
    } else {
      // Attribute mismatch → keep them separate rather than lose any geometry.
      for (const g of geoms) group.add(new THREE.Mesh(g, mat));
    }
  }
  for (const m of passthrough) group.add(m);
  return group;
}

/** Draw-call-merged replacement for `scene.clone(true)` (see file header). */
export function mergeByMaterial(source: THREE.Object3D): THREE.Group {
  const cached = TEMPLATE_CACHE.get(source);
  if (cached) return cached.clone(true) as THREE.Group;
  try {
    const template = buildTemplate(source);
    TEMPLATE_CACHE.set(source, template);
    return template.clone(true) as THREE.Group;
  } catch {
    // Skinned model or an unexpected failure — fall back to the plain clone.
    return source.clone(true) as THREE.Group;
  }
}
