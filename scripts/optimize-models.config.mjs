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
    // Traffic cars are seen at a distance and rendered many at once — cap their
    // (large) textures harder to save VRAM and download. To also cut their
    // triangle count, decimate them in Blender or enable a simplify step here.
    'vehicles/chevrolet_cobalt_ltz.glb': { texture: { maxSize: 1024 } },
    'vehicles/kia_k5_2025.glb': { texture: { maxSize: 1024 } },
    'vehicles/gentra.glb': { texture: { maxSize: 1024 } },
    'vehicles/spark.glb': { texture: { maxSize: 1024 } },
  },
};

export default config;
