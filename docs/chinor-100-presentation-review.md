# "CHINOR 100" taqdimoti — o'rganish natijasi va 3D-veb loyihasiga daxldorligi

**Manba:** `100_улиц_Ташкента_Единая_городская_система_впечатлений_Продюсерский.pdf` (Telegram Desktop yuklamalari), 7 sahifa, versiya №1, 19.08.2026. Mualliflik huquqi: prodyuserlik markazi "Начало" (hujjatda ko'rsatilgan).

## ⚠️ O'qishning texnik cheklovi (muhim)

Bu muhitda PDF sahifalarini rasmga aylantiruvchi standart vositalar (`poppler`/`pdftoppm`, ImageMagick, Ghostscript) o'rnatilmagan edi. Windowsning o'rnatilgan PDF renderi (`Windows.Data.Pdf`) orqali barcha 7 sahifani rasmga chiqardim, lekin **3 sahifa (1, 3, 6) va 7-sahifaning katta qismi bo'sh/oq chiqdi** — sabab, ehtimol, ushbu renderning ba'zi o'rnatilgan rasm formatlarini (fon fotosuratlari, ikonka grafikalari) dekodlay olmasligi. Matnli ekstraktsiya (`pdftotext`) ham asosiy o'zbek/rus matnini shrift kodlash muammosi tufayli o'qiy olmadi (harflar bo'sh joy sifatida chiqdi), faqat lotin harflarida yozilgan brend nomlari va raqamlar saqlanib qoldi.

**Xulosa:** Quyidagi ma'lumot **to'liq emas, qisman rekonstruksiya** — 4 ta sahifa (2, 4, 5, 7ning sarlavhasi) to'liq o'qildi, qolganlari qisman matn parchalaridan taxmin qilindi. Agar hujjatning to'liq, aniq mazmuni kerak bo'lsa, uni PowerPoint/Figma originalidan yoki PDF eksportini boshqa muhitda (masalan, poppler o'rnatilgan) qayta ochib ko'rish tavsiya etiladi.

## Hujjat nima haqida

Bu — **haqiqiy, jismoniy shahar dasturi** haqidagi prodyuserlik taqdimoti: "CHINOR 100 — 100 ko'cha, yagona shahar taassurotlari tizimi" (Toshkent uchun). Bu **3D, veb yoki virtual ilova uchun texnik topshiriq emas** — bu turizm/gastronomiya/tadbirlar sohasidagi biznes va shahar rivojlantirish strategiyasi.

O'qilgan qismlarda **"3D", "veb-sayt", "virtual", "3D shahar"** kabi so'zlarga umuman duch kelinmadi.

### Kontekst (2-sahifa, to'liq o'qildi)
- Toshkentda xorijiy turistlar oqimi +36,6% o'sgan (2026-yil yanvar-mart, O'zbekiston Respublikasi Milliy statistika qo'mitasi manbasi).
- Toshkent — dunyoning eng tez o'sayotgan turizm yo'nalishlaridan TOP-5 ichida.
- Asosiy g'oya: "aholi ham turist" — tashkentliklarning o'zi ham o'z shahrini yangidan kashf qilishi kerak.
- Talab "joylar"dan (restoranlar, parklar) "stsenariylar"ga (kontsert, festival, gastronomik tajriba) siljimoqda.

### Biznes-model (4-sahifa, to'liq o'qildi)
- Hozirgi holat: 26 ta turistik/gastronomik ko'chada 1 103 ta savdo/xizmat ob'ekti, 30+ xalqaro brend, 4 900 doimiy ish o'rni, soliq tushumlari x3 o'sgan.
- Uch darajali hamkorlik: **Bosh hamkor** (butun ko'cha/yo'nalish ekskluzivligi) → **Dasturiy hamkor** (brendlangan zona + tadbir) → **Hamkor-ishtirokchi** (kalendar/marshrutda ishtirok).
- Biznes toifalari: Gastronomik, Musiqiy, Bolalar, Moda, Sport — har biri turli hamkorlarni (FMCG, ritel, bank, media) birlashtiradi.
- Monetizatsiya yo'nalishlari: sponsorlik, servis (taksi/yetkazib berish/to'lov), savdo, tadbirlar, media.

### Ekotizim / sub-brendlar (5 va 6-sahifalar, qisman — ikonkalar/matn ko'rinmadi)
Kartochkalar bo'sh chiqdi, lekin matn parchalaridan quyidagi sub-brendlar aniqlandi:
- **CHINOR 100** — bosh dastur/brend
- **CHINOR INFO POINT** — jismoniy ma'lumot nuqtalari (QR-kodlar bilan)
- **CHINOR BUS** — transport xizmati
- **CHINOR GUIDE** — gid/navigatsiya xizmati
- **CHINOR GASTRO** — gastronomiya bo'limi (pastda batafsil)
- **CHINOR beyond** — (aniq vazifasi noma'lum, taxminan "shahar tashqarisiga" kengayish)

"Yagona kalendar" mexanizmi: Bugun / Dam olish kunlari / Mavsum / Katta bahona — turli ko'chalar bitta tadbirni birgalikda "ko'tarib olishi" mumkin.

### CHINOR GASTRO (7-sahifa — sarlavhadan tashqari asosiy matn ko'rinmadi)
Matn parchalaridan: **Street Food Lab** (pop-up format), **Gastro School** (Basque Culinary Center bilan hamkorlikda), **Gastro Accelerator** (Fast Track dasturi), **JUMBO Academy** ishtiroki.

## Bu 3D loyihaga qanday aloqador

Eng muhim topilma: **bu hujjat 3D vizualizatsiya yoki veb-ilova haqida hech narsa demaydi.** "Loyihada 3D shahar bo'ladi" degan taxmin — ehtimol og'zaki brifingdan yoki alohida (bu faylda yo'q) texnik topshiriqdan kelib chiqqan, prodyuserlik taqdimotining o'zidan emas.

Bu amaliy oqibatlarga ega:
1. Mijoz bilan **"3D" so'zi aniq nimani anglatishini** rasman aniqlash kerak — 100 ta ko'chani fotorealistik, yurish mumkin bo'lgan 3D dunyo sifatidami, yoki interaktiv 2D/2.5D xarita, 360° foto-tur, yoki reklama uchun qisqa 3D-render videomi. Bularning har birining murakkabligi, narxi va muddati butunlay boshqacha.
2. Agar haqiqatan ham "100 ko'chani to'liq, sifatli 3D dunyoda" talab qilinsa — bu katta studiya darajasidagi (AAA) asset-ishlab chiqarish va optimallashtirish quvur liniyasini talab qiladi (o'nlab 3D dizaynerlar, oylar davomida), va buni committing qilishdan oldin mijozga real muddat/byudjet taqdim etish kerak.
