# 🏙️ 100+ Ko'chali Open-World 3D Web POV Platformasi

O'zbekistonning 100 dan ortiq bog'langan ko'chalarini, zamonaviy binolarini, 3D me'moriy modellarini va shahar infratuzilmasini real vaqtda birinchi shaxs (First Person POV) ko'rinishida brauzerda ko'rsatib beruvchi yuqori unumdorlikdagi 3D Web platformasi.

---

## 🌐 Jonli Demo & Havolalar
- **🌍 Doimiy 24/7 Jonli Havola:** [https://jaloliddin-fozilov.github.io/street-pov-3d/](https://jaloliddin-fozilov.github.io/street-pov-3d/)
- **📦 GitHub Repository:** [https://github.com/Jaloliddin-Fozilov/street-pov-3d](https://github.com/Jaloliddin-Fozilov/street-pov-3d)

---

## ✨ Asosiy Xususiyatlar

- 🚶 **Erkin POV Harakatlanish & Real Fizika:**
  - Inson bo'yi balandligida (1.70m) erkin yurish (`WASD`), yugurish (`Shift`), sakrash (`Space`).
  - To'liq monolit devorlar va mustahkam to'siqlar (Continuous Collision Detection - CCD).
- 🪜 **Zinapoyalarga Chiqish va Tushish:**
  - 3D bino zinapoyalaridan 2-qavat terrasalari, do'konlari va platformalariga qadam-baqadam silliq ko'tarilish va tushish.
- 🗺️ **100+ Ochiq Ko'chalar To'plami:**
  - Toshkent shahri tumanlari bo'ylab haqiqiy ko'cha nomlari, uzunliklari, tezlik me'yorlari va POI nuqtalari.
- ⚡ **Spatially Chunked Streaming (Barqaror 60 FPS):**
  - 80m x 80m o'lchamdagi fazoviy to'r (Spatial Grid) orqali faqat o'yinchi atrofidagi 3x3 hudud render qilinadi.
- ☀️ **Dinamik Muhit (Kunduz / Botish / Tun):**
  - Quyosh burchagiga moslashuvchi yorug'lik, tungi neon peshlavhalar va ko'cha chiroqlarining nurlanishi.
- 🔍 **Interaktiv Obyektlar & Audio Gid:**
  - Markaziy nishon orqali bino, mashina yoki bekatga qaraganda ixcham `[E]` pastki paneli va Web Speech API orqali ovozli gid.
- 📱 **Kross-Platforma Boshqaruv:**
  - Desktop (klaviatura + sichqoncha qulflash) hamda mobil qurilmalar uchun virtual joystik va touch boshqaruv.

---

## 🛠️ Texnologiyalar Steki

- **Dvigatel & 3D Grafika:** React 18, TypeScript, Three.js, React Three Fiber (R3F), @react-three/drei
- **Fizika Simulyatsiyasi:** @react-three/rapier (WASM Physics Engine with CCD)
- **Vizual Dizayn:** Tailwind CSS, Lucide React Icons
- **Holat Boshqaruvi:** Zustand
- **Deploy & Hosting:** GitHub Pages (Global Cloud CDN)

---

## 🚀 Mahalliy Ishga Tushirish

```bash
# 1. Repositoriyani klonlash
git clone https://github.com/Jaloliddin-Fozilov/street-pov-3d.git
cd street-pov-3d

# 2. Bog'liqliklarni o'rnatish
npm install

# 3. Dasturchi serverini yoqish
npm run dev

# 4. Brauzerda ochish
# http://localhost:3000
```

---

## 🎨 3D Dizaynerlar (Blender) Uchun Qo'llanma
Blender dasturida tayyorlangan 3D modellarni platformaga to'g'ri eksport qilish va o'rnatish bo'yicha to'liq qo'llanma:
👉 [`BLENDER_GUIDE.md`](./BLENDER_GUIDE.md) faylida mavjud.
