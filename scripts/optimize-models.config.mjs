/**
 * Configuration for the 3D asset optimization service (`scripts/optimize-models.mjs`).
 *
 * The pipeline reads raw `.glb` / `.gltf` files from `srcDir`, applies mesh + texture
 * compression, and writes optimized `.glb` files (mirroring the folder structure) to
 * `outDir`. It runs automatically before `dev` and `build` (see package.json `predev`
 * / `prebuild`), and can also be run on demand with `npm run optimize:models`.
 *
 * Everything here is data — tweak values without touching pipeline code. Anything you
 * are unsure about, leave at its default: the defaults are deliberately conservative
 * and never rename, merge, or delete scene nodes (so collider / POI / anchor naming
 * conventions in models stay intact).
 */

/** @typedef {'webp' | 'jpeg' | 'png' | 'avif' | null} TextureFormat */

const config = {
  /** Where the raw, source-of-truth models live (committed to git). */
  srcDir: 'models-src',

  /** Where optimized models are written (generated — git-ignored). */
  outDir: 'public/models',

  /**
   * Incremental-build manifest — records which source (content + settings) has
   * already been compressed, so a model is compressed ONCE and never re-compressed
   * on later builds. Committed to git (together with the compressed output in
   * `outDir`) so the skip also works on fresh checkouts / CI. Deleting it forces a
   * full re-optimize.
   */
  cacheFile: 'models-optimize.cache.json',

  /** File extensions treated as models. Output is always `.glb`. */
  include: ['.glb', '.gltf'],

  /** Texture recompression. Set `format: null` to leave textures untouched. */
  texture: {
    /** @type {TextureFormat} */
    format: 'webp',
    /** Cap the longest edge (px). `null` keeps original resolution. */
    maxSize: 2048,
    /** 1–100. Higher = better quality, larger file. */
    quality: 85,
    /** sharp encode effort 0–6 (webp/avif). Higher = smaller but slower. */
    effort: 4,
  },

  /** Geometry compression (EXT_meshopt_compression). Decoded natively by drei's useGLTF. */
  meshopt: {
    enabled: true,
    /** 'medium' | 'high' */
    level: 'high',
  },

  /**
   * Geometry decimation (meshopt simplifier). OFF by default — it removes
   * triangles, so enable it PER MODEL and eyeball the result. `ratio` is the
   * target fraction of triangles to KEEP; `error` (as a fraction of the model's
   * size) is the hard quality guard that stops decimation before the silhouette
   * visibly degrades — so a low `ratio` never over-simplifies, it just stops
   * early. This is the only step that cuts the runtime triangle load (meshopt
   * compression only shrinks download/parse, not GPU cost).
   */
  simplify: {
    enabled: false,
    ratio: 1,
    error: 0.001,
    /** Keep open-boundary edges pinned (helps flat/cut-open meshes hold shape). */
    lockBorder: false,
  },

  /**
   * Advanced structural transforms. All OFF by default because they can rename,
   * merge, or drop scene nodes — only enable for models you have verified.
   */
  advanced: {
    dedup: true, // merge duplicate accessors/textures — safe, keeps nodes
    resample: true, // drop redundant animation keyframes — safe
    prune: false, // remove unused data (may delete empty POI/anchor nodes)
    weld: false, // merge equal vertices — safe geometry-wise, minor risk
    flatten: false, // collapse node hierarchy — DROPS node names
    join: false, // merge meshes — DROPS node names & separate materials
  },

  /**
   * Per-model overrides, keyed by path relative to `srcDir` (forward slashes).
   * Deep-merged over the defaults above. Example:
   *
   *   overrides: {
   *     'uzbek/bibi_khanym.glb': { texture: { maxSize: 1024 } },
   *   }
   */
  overrides: {
    // Traffic cars: 0.3–1.05M raw tris and 60–155 sub-meshes EACH, several on
    // screen at once — the dominant runtime cost. They're background props, so
    // merge hard (flatten+join → ~one mesh per material) AND halve the triangles
    // (simplify). No node names are used by VehicleMesh, so this is safe.
    // Tune `ratio` down (e.g. 0.3) once verified — 0.5 is a conservative start.
    'vehicles/chevrolet_cobalt_ltz.glb': {
      texture: { maxSize: 1024 },
      advanced: { weld: true, flatten: true, join: true, prune: true },
      simplify: { enabled: true, ratio: 0.5, error: 0.01 },
    },
    'vehicles/kia_k5_2025.glb': {
      texture: { maxSize: 1024 },
      advanced: { weld: true, flatten: true, join: true, prune: true },
      simplify: { enabled: true, ratio: 0.5, error: 0.01 },
    },
    'vehicles/gentra.glb': {
      texture: { maxSize: 1024 },
      advanced: { weld: true, flatten: true, join: true, prune: true },
      simplify: { enabled: true, ratio: 0.5, error: 0.01 },
    },
    'vehicles/spark.glb': {
      texture: { maxSize: 1024 },
      advanced: { weld: true, flatten: true, join: true, prune: true },
      simplify: { enabled: true, ratio: 0.5, error: 0.01 },
    },
    'vehicles/bus_maz_203.glb': {
      texture: { maxSize: 1024 },
      advanced: { weld: true, flatten: true, join: true, prune: true },
      simplify: { enabled: true, ratio: 0.5, error: 0.01 },
    },
    // Chevrolet Onix: the showcase "hero" on the spawn plaza — 574k tris across
    // 442 sub-meshes / 1266 nodes. Seen up close, so decimate gently (keep 60%,
    // tight error) but still collapse the 442 meshes → ~8 draw calls.
    'vehicles/chevrolet_onix_2024.glb': {
      texture: { maxSize: 2048 },
      advanced: { weld: true, flatten: true, join: true, prune: true },
      simplify: { enabled: true, ratio: 0.6, error: 0.005 },
    },
    // Tashkent circus: only ~4.6k tris but authored as 1,273 separate primitives
    // (1,273 draw calls!) sharing 2 materials. Pure draw-call bomb — join it to
    // ~2 meshes. No simplify needed (already low-poly). No node names used.
    'uzbek/tashkent_sirk.glb': {
      advanced: { weld: true, flatten: true, join: true, prune: true },
    },
    // Amir Temur statue is a large centrepiece — cap its (very large) textures and
    // gently halve its 1.48M tris (tight error to protect the silhouette). Left
    // un-joined (only ~15 meshes) to stay conservative on the hero monument.
    'uzbek/amir_temur_statue.glb': {
      texture: { maxSize: 2048 },
      advanced: { weld: true, prune: true },
      simplify: { enabled: true, ratio: 0.5, error: 0.004 },
    },
    // Bus stop shelter: 29 sub-meshes sharing ~9 materials, rendered twice per
    // chunk. Only ~7.8k tris (no simplify needed) but a draw-call sink — join it
    // to ~9 meshes. BusStop.tsx uses no node names, so this is safe.
    'props/bus_stop.glb': {
      advanced: { weld: true, flatten: true, join: true, prune: true },
    },
    // Uzbekistan Airways plane: a Sketchfab import with ~378 sub-meshes / 833
    // nodes. It flies decoratively (no collider / POI / anchor nodes, no
    // animation), several copies at once, so merge it hard — flatten + join
    // collapse it to ~one mesh per material (~16 draw calls instead of 378).
    // Dropping node names is safe precisely because nothing here depends on them.
    'aircraft/uzbekistan_airways.glb': {
      texture: { maxSize: 1024 },
      advanced: { dedup: true, resample: true, weld: true, flatten: true, join: true, prune: true },
    },
  },
};

export default config;
