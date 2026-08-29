#!/usr/bin/env node
/**
 * 3D asset optimization service.
 *
 * Reads raw models from `config.srcDir`, applies mesh (meshopt) + texture (webp)
 * compression via glTF-Transform, and writes optimized `.glb` files to
 * `config.outDir`. Runs automatically before `dev` / `build`.
 *
 *   npm run optimize:models          # incremental (skips unchanged models)
 *   npm run optimize:models -- --force
 *
 * Design goals:
 *   - Idempotent & incremental: a content+settings hash cache skips unchanged files.
 *   - Fail-safe: if the toolchain is missing or a single model fails, the original is
 *     copied through verbatim so the app always has its assets and the build never
 *     breaks on an optimization hiccup.
 *   - Config-driven: all tunables live in `optimize-models.config.mjs`.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, copyFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import config from './optimize-models.config.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const SRC_DIR = resolve(ROOT, config.srcDir);
const OUT_DIR = resolve(ROOT, config.outDir);
const CACHE_FILE = resolve(ROOT, config.cacheFile);
const FORCE = process.argv.includes('--force');

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------

const humanSize = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'kB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
};

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** Deep-merge plain objects (used to apply per-model overrides). */
const deepMerge = (base, patch) => {
  if (!isObject(patch)) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    out[k] = isObject(v) && isObject(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out;
};

/** Recursively collect model files under `dir`, returned as paths relative to it. */
async function collectModels(dir) {
  const found = [];
  const walk = async (current) => {
    let entries = [];
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (config.include.includes(extname(entry.name).toLowerCase())) {
        found.push(relative(dir, full).split('\\').join('/'));
      }
    }
  };
  await walk(dir);
  return found.sort();
}

const readCache = async () => {
  try {
    return JSON.parse(await readFile(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
};

const writeCache = async (cache) => {
  await mkdir(dirname(CACHE_FILE), { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
};

/** Optimized output path for a source-relative path — always `.glb`. */
const outPathFor = (relPath) => resolve(OUT_DIR, relPath.replace(/\.(gltf|glb)$/i, '.glb'));

// ---------------------------------------------------------------------------
// glTF-Transform pipeline (loaded lazily so a missing toolchain degrades gracefully)
// ---------------------------------------------------------------------------

/**
 * Build the optimizer. Returns `null` if the toolchain can't be loaded, signalling
 * the caller to fall back to verbatim copies instead of failing the build.
 */
async function createOptimizer() {
  let core, extensions, functions, meshoptimizer, sharpMod;
  try {
    [core, extensions, functions, meshoptimizer, sharpMod] = await Promise.all([
      import('@gltf-transform/core'),
      import('@gltf-transform/extensions'),
      import('@gltf-transform/functions'),
      import('meshoptimizer'),
      import('sharp'),
    ]);
  } catch (err) {
    console.warn(`  ⚠  optimization toolchain unavailable (${err.message.split('\n')[0]})`);
    return null;
  }

  const { NodeIO } = core;
  const { ALL_EXTENSIONS } = extensions;
  const { dedup, resample, prune, weld, flatten, join: joinMeshes, textureCompress, meshopt } = functions;
  const { MeshoptEncoder, MeshoptDecoder } = meshoptimizer;
  const sharp = sharpMod.default ?? sharpMod;

  await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);

  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'meshopt.decoder': MeshoptDecoder,
    'meshopt.encoder': MeshoptEncoder,
  });

  /** Optimize one file according to a (possibly overridden) config. */
  return async function optimize(srcPath, outPath, cfg) {
    const doc = await io.read(srcPath);

    const transforms = [];
    if (cfg.advanced.dedup) transforms.push(dedup());
    if (cfg.advanced.weld) transforms.push(weld());
    if (cfg.advanced.flatten) transforms.push(flatten());
    if (cfg.advanced.join) transforms.push(joinMeshes());
    if (cfg.advanced.resample) transforms.push(resample());
    if (cfg.advanced.prune) transforms.push(prune({ keepLeaves: true }));
    if (cfg.texture.format) {
      transforms.push(
        textureCompress({
          encoder: sharp,
          targetFormat: cfg.texture.format,
          quality: cfg.texture.quality,
          effort: cfg.texture.effort,
          resize: cfg.texture.maxSize ? [cfg.texture.maxSize, cfg.texture.maxSize] : undefined,
        }),
      );
    }
    if (cfg.meshopt.enabled) transforms.push(meshopt({ encoder: MeshoptEncoder, level: cfg.meshopt.level }));

    await doc.transform(...transforms);

    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, await io.writeBinary(doc));
  };
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.log(`[optimize-models] source dir "${config.srcDir}" not found — nothing to do.`);
    return;
  }

  const models = await collectModels(SRC_DIR);
  if (models.length === 0) {
    console.log(`[optimize-models] no models found in "${config.srcDir}".`);
    return;
  }

  console.log(`[optimize-models] ${models.length} model(s) in "${config.srcDir}" → "${config.outDir}"`);

  const optimize = await createOptimizer();
  const cache = FORCE ? {} : await readCache();
  const nextCache = {};

  let optimized = 0;
  let skipped = 0;
  let copied = 0;
  let srcTotal = 0;
  let outTotal = 0;

  for (const relPath of models) {
    const srcPath = join(SRC_DIR, relPath);
    const outPath = outPathFor(relPath);
    const cfg = deepMerge(config, config.overrides?.[relPath] ?? {});

    const bytes = await readFile(srcPath);
    const srcSize = bytes.length;
    srcTotal += srcSize;

    // Cache key = source content + the settings that affect its output.
    const settingsKey = JSON.stringify({ t: cfg.texture, m: cfg.meshopt, a: cfg.advanced });
    const hash = createHash('sha256').update(bytes).update(settingsKey).digest('hex');

    // Already compressed with these exact settings and the output is present →
    // reuse it, never re-compress. (A previously *copied-through* unoptimized
    // entry is only skipped when the toolchain still isn't available; once it is,
    // that model gets compressed for real.)
    const cached = cache[relPath];
    const canSkip =
      !FORCE &&
      cached?.hash === hash &&
      existsSync(outPath) &&
      (cached.optimized || !optimize);
    if (canSkip) {
      const { size } = await stat(outPath);
      outTotal += size;
      nextCache[relPath] = cached;
      skipped++;
      console.log(`  ⏭  ${relPath}  (already compressed — skipped)`);
      continue;
    }

    if (optimize) {
      try {
        await optimize(srcPath, outPath, cfg);
        const { size } = await stat(outPath);
        outTotal += size;
        nextCache[relPath] = { hash, size, optimized: true };
        optimized++;
        const pct = srcSize ? Math.round((1 - size / srcSize) * 100) : 0;
        console.log(`  ✓  ${relPath}  ${humanSize(srcSize)} → ${humanSize(size)}  (-${pct}%)`);
        continue;
      } catch (err) {
        console.warn(`  ⚠  ${relPath}: optimization failed, copying original (${err.message.split('\n')[0]})`);
      }
    }

    // Fallback: copy the original through so the app always has its asset.
    await mkdir(dirname(outPath), { recursive: true });
    await copyFile(srcPath, outPath);
    outTotal += srcSize;
    nextCache[relPath] = { hash, size: srcSize, optimized: false };
    copied++;
    console.log(`  ↪  ${relPath}  copied (unoptimized)`);
  }

  await writeCache(nextCache);

  const saved = srcTotal - outTotal;
  console.log(
    `[optimize-models] done: ${optimized} optimized, ${skipped} cached, ${copied} copied — ` +
      `${humanSize(srcTotal)} → ${humanSize(outTotal)}` +
      (saved > 0 ? ` (saved ${humanSize(saved)})` : ''),
  );
}

main().catch((err) => {
  // Never take the whole build down over the asset step.
  console.error(`[optimize-models] unexpected error: ${err.stack ?? err}`);
  process.exitCode = 0;
});
