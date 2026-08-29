# 3D asset optimization pipeline

Automatic build-time compression for the project's `.glb` models. Cuts download
size and — more importantly — reduces the GPU/CPU hitching ("freezing") that large
Sketchfab-style models cause when they first render.

## How it works

```
models-src/**            (raw, committed source of truth)
        │
        ▼   scripts/optimize-models.mjs   (runs on predev / prebuild)
        │     • meshopt geometry compression   (EXT_meshopt_compression)
        │     • webp texture recompression + resize (EXT_texture_webp)
        │     • dedup + animation resample
        ▼
public/models/**         (compressed .glb — COMMITTED, built once)
        │
        ▼
   app loads /models/... via drei useGLTF
```

`useGLTF` decodes meshopt geometry and webp textures out of the box, so **no runtime
code changes are needed** — optimized models are drop-in replacements.

## Compress once, then reuse — never re-compress

Each model is compressed **exactly once**. Both the compressed output
(`public/models/`) and the manifest (`models-optimize.cache.json`) are **committed to
git**. On every later build the service sees the manifest entry + existing output and
**skips** that model — so builds (including fresh CI checkouts) never re-compress work
that's already done. A model is (re-)compressed only when:

- its raw source in `models-src/` changes, or
- its settings in `optimize-models.config.mjs` change, or
- you run `npm run optimize:models:force`.

**First-time setup:** the very first `npm run build` / `npm run optimize:models` on a
machine that has the deps installed does the initial compression and writes
`public/models/` + `models-optimize.cache.json`. **Commit those** — from then on the
compressed models are saved and reused everywhere.

## When it runs

The service is wired into npm lifecycle hooks in `package.json`:

| Command | Triggers | Notes |
| --- | --- | --- |
| `npm run dev` | `predev` → optimize | Compresses only new/changed models, then serves. |
| `npm run build` | `prebuild` → optimize | Same; in CI everything is usually already cached → no-op. |
| `npm run optimize:models` | — | Run manually anytime. Incremental. |
| `npm run optimize:models:force` | — | Ignore the manifest, re-compress everything. |

It is **incremental**: a `sha256(content + settings)` manifest
(`models-optimize.cache.json`) records what's already compressed, so unchanged models
are skipped and repeated builds/dev starts are instant.

## Configuration

All tunables live in `scripts/optimize-models.config.mjs` — no need to touch the
pipeline code. Highlights:

```js
texture: { format: 'webp', maxSize: 2048, quality: 85 }, // set format: null to skip textures
meshopt: { enabled: true, level: 'high' },               // 'medium' | 'high'
advanced: { dedup: true, resample: true, /* prune/weld/flatten/join off */ },
overrides: {
  'uzbek/bibi_khanym.glb': { texture: { maxSize: 1024 } }, // per-model tuning
},
```

### Why the `advanced` transforms are off by default

`flatten` and `join` rename or merge scene nodes, and `prune` can delete empty
nodes. Some models encode meaning in node names (e.g. `COL_`/`UCX_` colliders,
`POI_` anchors — see `src/utils/blenderLoader.ts`). Keeping these off preserves that
metadata. Enable them per-model via `overrides` once you've verified the result.

## Safety / failure behavior

The build never breaks on an asset hiccup:

- If the optimization toolchain can't load (e.g. deps not installed), every model is
  **copied through unoptimized** and a warning is printed.
- If a single model fails to optimize, only that one is copied through; the rest
  still optimize.

So `public/models/` is always fully populated after the script runs.

## Adding a model

Drop the raw `.glb` into the right subfolder under `models-src/`, reference it in
code as `/models/<subfolder>/<name>.glb`, and run dev/build. That's it. Prefer
**GLB** over FBX/USDZ/glTF — it's the single-file format three.js is built around.

## Dependencies (devDependencies)

- `@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions` — the pipeline
- `meshoptimizer` — meshopt encoder/decoder
- `sharp` — texture (webp) encoder

## Tuning tips for "freezing"

Download size is only half the story; runtime cost matters more:

- **Textures dominate GPU upload cost.** Lower `texture.maxSize` (1024 for props) is
  usually the biggest win against first-render hitches.
- **Very high-poly models** (common on Sketchfab) may still stutter after meshopt.
  For those, decimate in Blender or enable `weld` in `overrides`.
- Keep `useGLTF.preload('/models/...')` calls (already used across the 3D components)
  so models are fetched/decoded before they enter the scene.
