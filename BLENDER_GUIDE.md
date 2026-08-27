# 🏙️ 3D Modelchilar (Blender Artist) Uchun Qo'llanma & Standartlar

Ushbu qo'llanma 100+ ko'chali Open-World 3D Web platformasi uchun Blenderda modellarni to'g'ri tayyorlash, optimallashtirish va eksport qilish qoidalarini o'z ichiga oladi.

---

## 1. O'lchov va Masshtab Birligi (Units & Scale)
* **Masshtab:** `1 Blender Unit = 1 Metr` (Metric System).
* **Ko'cha bo'lagi (Chunk) o'lchami:** Har bir ko'cha/kvartal bo'lagi **`80m x 80m`** kvadrat maydonga moslab yasaladi.
* **Markaz (Origin Point):** Har bir chunkning origin nuqtasi `(0, 0, 0)` da, yer sathida (Ground Level $Z=0$ yoki $Y=0$) bo'lishi shart.
* **Transformatsiyalarni qo'llash:** Eksportdan oldin barcha obyektlar uchun `Ctrl + A -> Apply All Transforms (Location, Rotation, Scale)` qilinishi shart.

---

## 2. Koliziya va Fizika Qoidalari (Collisions Naming Convention)
O'yinchi ko'chada yurganda devorlar, binolar, bordyurlar va to'siqlardan o'tib ketmasligi uchun:
* **Fizik to'siq bo'ladigan sodda meshlar:** Nomining boshiga **`COL_`** yoki **`UCX_`** prefiksini qo'ying.
  - *Misol:* `COL_BuildingWall_01`, `COL_Curb_North`, `COL_Fence_03`.
  - Dvigatel ushbu meshlar bo'yicha avtomatik ravishda Rapier physics colliderlarini hosil qiladi va vizual ko'rinishini shaffof qiladi (rendering yengillashadi).
* **Koliziya meshlarini sodda tuting:** Binoning millionta poligonli bezagi emas, oddiy quti (Low-poly Box) shaklida `COL_` meshi qiling.

---

## 3. Diqqatga Sazovor Joylar (POI) va Interaktiv Nuqtalar
* Agar ko'chada bino, do'kon yoki muzey ustiga ma'lumot nishoni qo'yish kerak bo'lsa, o'sha joyga bitta **Empty (Axes)** qo'ying va nomini **`POI_`** bilan boshlang:
  - *Misol:* `POI_AmirTemurMuzeyi`, `POI_NavoiyTeatri`.

---

## 4. Tungi Yoritish va Emissive Materiallar
* Ko'cha chiroqlari lampochkalari, binolarning oynalari va reklama panellari uchun alohida **Emissive Material** ishlating (Blender Principled BSDF -> *Emission Color* & *Emission Strength*).
* Veb ilova tunda ushbu materiallarni avtomatik aniqlab, ularga nurlanish (Glow / Bloom) effektini qo'llaydi.

---

## 5. Eksport Sozlamalari (GLTF / GLB)
Blenderda eksport qilish uchun: **File -> Export -> glTF 2.0 (.glb)**

Sozlamalar:
1. **Format:** `glTF Binary (.glb)`
2. **Include:**
   - [x] Limit to Selected Objects (kerakli bo'lakni tanlab)
   - [x] Custom Properties
3. **Transform:**
   - `+Y Up` (Yoqilgan bo'lishi kerak)
4. **Geometry:**
   - [x] Apply Modifiers
   - [x] Tangents
   - [x] **Compression (Draco):** Yoqilsin (Hajmni 80-90% gacha qisqartiradi)
     - *Quantization Settings:* Position = 14, Normal = 10, TexCoord = 12
5. **Materials:**
   - Export Materials: `Export`
   - Images: `Automatic` (teksturalar hajmini $1024 \times 1024$ yoki $2048 \times 2048$ dan oshirmang, tercihan `.webp` yoki `.jpg`).

---

## 6. Fayllarni Joylashtirish (Fayl Nomlari)
Eksport qilingan `.glb` fayllarni loyihaning `public/models/` papkasiga quyidagi tartibda joylashtiring:
* `chunk_0_0.glb` (Markaziy ko'cha)
* `chunk_0_1.glb`, `chunk_1_0.glb`, ...
* Alohida binolar: `building_navoiy_theater.glb`, `building_tashkent_city.glb` va h.k.

---

## 7. Poligonlar Byudjeti (Performance Guidelines)
* Har bir $80m \times 80m$ ko'cha bo'lagi uchun maksimal **30,000 - 50,000 uchburchak (Triangles)**.
* Draw callslarni kamaytirish uchun bir xil materialga ega bo'lgan statik yo'llar yoki toshlarni bitta meshga birlashtiring (`Join` / `Ctrl + J`).
