# 3D Modellar — XOM MANBA (`models-src/`)

Bu papka — barcha `.glb` / `.gltf` modellarning **asl (xom) manbasi**. Shu papka
git'ga saqlanadi va o'zgartirilmaydi.

Build yoki `npm run dev` oldidan `scripts/optimize-models.mjs` servisi shu yerdagi
fayllarni **meshopt + webp** bilan siqib, `public/models/` ga chiqaradi. Ilova
faqat `public/models/` dagi optimizatsiya qilingan versiyalardan foydalanadi.

Har bir model **faqat bir marta** siqiladi: natija `public/models/` ga saqlanib
git'ga commit qilinadi, keyingi build'larda esa qayta siqilmaydi (manba
o'zgarmaguncha). Buni `models-optimize.cache.json` manifesti kuzatadi.

> `public/models/` va `models-optimize.cache.json` — servis generatsiya qiladi,
> lekin **git'ga saqlanadi**. Qo'lda tahrirlamang.

## Yangi model qo'shish

1. Modelni (afzali **GLB**) mos kichik papkaga tashlang, masalan:
   - `uzbek/`, `vehicles/`, `props/`, `building_interior/` …
2. Kodda odatdagidek `/models/<papka>/<nom>.glb` yo'lini ishlating (papka tuzilishi
   ayni holida ko'chiriladi).
3. Tamom — keyingi `npm run dev` / `npm run build` avtomatik optimizatsiya qiladi.

Sozlash: `scripts/optimize-models.config.mjs`. Batafsil: `docs/asset-pipeline.md`.

Blenderda chunk tayyorlash bo'yicha: loyiha ildizidagi `BLENDER_GUIDE.md`.
