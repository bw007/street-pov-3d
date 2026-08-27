import { StreetData, POIData } from '../types';

// CHUNK_SIZE in world units (meters). Each chunk represents a 80m x 80m area.
export const CHUNK_SIZE = 80;

// Generates 100+ structured, connected streets on a 10x10 to 12x10 interconnected road grid
const rawStreetNames: { name: string; district: string; desc: string; hist: string }[] = [
  { name: "Amir Temur shox ko'chasi", district: "Yunusobod", desc: "Toshkentning eng markaziy va qadimiy shoh ko'chalaridan biri.", hist: "19-asrdan boshlab rivojlangan, shahar markazidan shimolga tomon yo'nalgan." },
  { name: "Mustaqillik shoh ko'chasi", district: "Mirzo Ulug'bek", desc: "Keng xiyobonlar va ma'muriy binolar joylashgan ko'cha.", hist: "Mustaqillik maydoni bilan bog'langan eng mashhur shoh ko'cha." },
  { name: "Navoiy shoh ko'chasi", district: "Shayxontohur", desc: "Alisher Navoiy nomidagi teatr va qadimiy obidalar ko'chasi.", hist: "Toshkent madaniy hayotining tarixiy yuragi hisoblanadi." },
  { name: "Sharaf Rashidov ko'chasi", district: "Yunusobod", desc: "Markaziy bog'lar, muzeylar va kutubxonalar bo'ylab o'tadi.", hist: "Yashil xiyobonlari va tarixiy arxitekturasi bilan ajralib turadi." },
  { name: "Islom Karimov ko'chasi", district: "Mirobod", desc: "Hukumat binolari va go'zal bog'lar joylashgan keng ko'cha.", hist: "O'zbekistonning zamonaviy davlat boshqaruvi markazlaridan biri." },
  { name: "Oybek ko'chasi", district: "Mirobod", desc: "Ko'plab kafelar, biznes markazlari va restoranlar joylashgan gavjum ko'cha.", hist: "Yozuvchi Muso Toshmuhammad o'g'li Oybek sharafiga nomlangan." },
  { name: "Nukus ko'chasi", district: "Mirobod", desc: "Elchixonalar va zamonaviy turar-joy majmualari joylashgan ko'cha.", hist: "Toshkentning Kichik halqa yo'li bilan bog'lovchi asosiy arteriyalardan biri." },
  { name: "Bobur ko'chasi", district: "Yakkasaroy", desc: "Do'stlik bog'i va aeroport yo'nalishidagi yashil ko'cha.", hist: "Zahiriddin Muhammad Bobur sharafiga atalgan." },
  { name: "Shohjahon ko'chasi", district: "Yakkasaroy", desc: "Tinch, soya-salqin va shinam mahallalar ko'chasi.", hist: "Boburiylar sulolasi me'morchiligiga hurmat ramzi." },
  { name: "Chilonzor ko'chasi", district: "Chilonzor", desc: "Keng ko'lamli turar-joylar va savdo markazlari hududi.", hist: "1966-yilgi zilziladan so'ng keng miqyosda qayta qurilgan." },
  { name: "Muqimiy ko'chasi", district: "Chilonzor", desc: "Transport bog'lamalari va estakadalari bilan mashhur ko'cha.", hist: "Shoir Muhammad Aminxo'ja Muqimiy nomi bilan atalgan." },
  { name: "Bunyodkor shoh ko'chasi", district: "Chilonzor", desc: "Shahar janubiga chiqish yo'lidagi eng keng 12 qatorli shoh ko'cha.", hist: "Bunyodkor stadioni va Xalqlar do'stligi maydonini o'z ichiga oladi." },
  { name: "Katta Darxon ko'chasi", district: "Mirzo Ulug'bek", desc: "Tarixiy Darxon arig'i bo'yidagi qadimiy va zamonaviy mavze.", hist: "Eski Toshkentning eng nufuzli bog'-rog'li joylaridan biri bo'lgan." },
  { name: "Parkent ko'chasi", district: "Yashnobod", desc: "Bozorlar, yangi ko'p qavatli binolar va hunarmandlik markazlari.", hist: "Qadimiy Parkent tog'lariga eltuvchi karvon yo'li bo'lgan." },
  { name: "Farg'ona Yo'li ko'chasi", district: "Yashnobod", desc: "Toshkentni Farg'ona vodiysi yo'nalishi bilan bog'lovchi katta yo'l.", hist: "Buyuk Ipak Yo'lining asosiy tarmoqlaridan biri bo'lib xizmat qilgan." },
  { name: "Taraqqiyot ko'chasi", district: "Yashnobod", desc: "Yangi ko'priklar va tezyurar transport liniyasi ko'chasi.", hist: "Oxirgi yillarda to'liq modernizatsiya qilingan yangi shahar yo'li." },
  { name: "Sebzor ko'chasi", district: "Olmazor", desc: "Eski shahar (Eski Juva) bilan bog'langan tarixiy daxa.", hist: "Toshkentning to'rtta tarixiy dahalaridan biri — Sebzor markazi." },
  { name: "Zarqaynar ko'chasi", district: "Olmazor", desc: "Hunarmandlar ustaxonalari va Chorsu bozoriga eltuvchi ko'cha.", hist: "Oltin va zargarlik hunarmandlari qadimdan yashagan ko'cha." },
  { name: "Qorasaroy ko'chasi", district: "Olmazor", desc: "Hazrati Imom (Hastimom) majmuasi joylashgan muqaddas ziyorat ko'chasi.", hist: "Usmon Qur'oni saqlanayotgan dunyoga mashhur Islom markazi." },
  { name: "Sag'bon ko'chasi", district: "Olmazor", desc: "Milliy taomlar, qadimiy hovlilar va choyxonalar ko'chasi.", hist: "Toshkentning eng qadimiy milliy gastronomik markazlaridan biri." },
  { name: "Beruniy shoh ko'chasi", district: "Olmazor", desc: "Talabalar shaharchasi va O'zbekiston Milliy Universiteti ko'chasi.", hist: "Alloma Abu Rayhon Beruniy sharafiga qo'yilgan ilm maskani." },
  { name: "Farobiy ko'chasi", district: "Olmazor", desc: "Shifoxonalar va tibbiyot akademiyasi joylashgan ko'cha.", hist: "Sharq Arastusi Abu Nasr Forobiy nomiga berilgan." },
  { name: "Zangiota ko'chasi", district: "Uchtepa", desc: "Zangiota ziyoratgohi tomon eltuvchi gavjum yo'l.", hist: "Tarixiy ziyoratgohlar va savdo rastalari maskani." },
  { name: "Lutfiy ko'chasi", district: "Uchtepa", desc: "Soyali xiyobonlar va Chilonzorning 24-26 mavzelari.", hist: "Mumtoz o'zbek shoiri Lutfiy nomi bilan atalgan." },
  { name: "Katta Xirmontepa ko'chasi", district: "Uchtepa", desc: "Uchtepa tumanining asosiy savdo va xizmat ko'rsatish ko'chasi.", hist: "Qadimiy tepaliklar va dehqonchilik maydonlari o'rnida vujudga kelgan." },
  { name: "Foziltepa ko'chasi", district: "Uchtepa", desc: "Zamonaviy ko'p qavatli uylar va bog'chalar mavzesi.", hist: "Yangi shaharsozlik loyihalari asosida barpo etilgan." },
  { name: "To'qimachi ko'chasi", district: "Yakkasaroy", desc: "Sobiq to'qimachilik fabrikalari va madaniyat saroyi ko'chasi.", hist: "20-asr sanoatlashuv davrining yirik markazi bo'lgan." },
  { name: "Shota Rustaveli ko'chasi", district: "Yakkasaroy", desc: "Klassik arxitektura, qalin chinorlar va san'at maydonchalari.", hist: "Toshkentning 1950-yillardagi go'zal neoklassik uylari joylashgan." },
  { name: "Usmon Nosir ko'chasi", district: "Yakkasaroy", desc: "Janubiy vokzalga eltuvchi muhim transport liniyasi.", hist: "Otashin shoir Usmon Nosir xotirasiga atalgan." },
  { name: "Kichik Halqa Yo'li (Mirobod)", district: "Mirobod", desc: "Shahar atrofini aylanib o'tuvchi tezyurar halqa yo'li.", hist: "Shahar transport oqimini tartibga solish uchun qurilgan halqa yo'l." },
  { name: "Sariko'l ko'chasi", district: "Mirobod", desc: "Temiryo'lchilar shaharchasi va Mirobod bozori yaqinidagi ko'cha.", hist: "Toshkent temiryo'l tarmog'i bilan chambarchas bog'liq tarixga ega." },
  { name: "Mehrjon ko'chasi", district: "Mirobod", desc: "Toshkent Janubiy stansiyasi yonidagi gavjum savdo yo'li.", hist: "Mehrjon bayrami sharafiga atalgan nurafshon ko'cha." },
  { name: "Glinka ko'chasi", district: "Yakkasaroy", desc: "Diplomatik vakolatxonalar va sokin villalar joylashgan ko'cha.", hist: "Musiqiy meros va madaniy maskanlar joylashgan xiyobon." },
  { name: "Yusuf Xos Hojib ko'chasi", district: "Yakkasaroy", desc: "Pedagogika universiteti va san'at kollejlari ko'chasi.", hist: "Qutadg'u Bilig asari muallifi Yusuf Xos Hojib nomi bilan atalgan." },
  { name: "Mahatma Gandi ko'chasi", district: "Mirzo Ulug'bek", desc: "Tarixiy bog'lar va xalqaro markazlar joylashgan xiyobon.", hist: "Hindiston yetakchisi Mahatma Gandi sharafiga do'stlik ramzi sifatida qo'yilgan." },
  { name: "Osiyo ko'chasi", district: "Yunusobod", desc: "Zamonaviy IT-parklar va innovatsion binolar majmuasi.", hist: "Yangi O'zbekistonning zamonaviy arxitektura durdonasi." },
  { name: "Bog'ishamol ko'chasi", district: "Yunusobod", desc: "Botanika bog'i va Toshkent hayvonot bog'i joylashgan maskan.", hist: "Amir Temurning mashhur 'Bog'i Shamol' saroyi sharafiga nomlangan." },
  { name: "Chinobod ko'chasi", district: "Yunusobod", desc: "Sanatoriy va sog'lomlashtirish maskanlari joylashgan sokin ko'cha.", hist: "Shifobaxsh ma'danli suvlari bilan mashhur maskan." },
  { name: "Yunus Ota ko'chasi", district: "Yunusobod", desc: "Yunusobod tumanining tarixiy markaziy qismi.", hist: "Yunusxo'ja davriga borib taqaluvchi tarixiy ildizlarga ega." },
  { name: "Ahmad Donish ko'chasi", district: "Yunusobod", desc: "Megaplanet savdo markazi va bozorga eltuvchi asosiy yo'l.", hist: "Ma'rifatparvar alloma Ahmad Donish sharafiga atalgan." },
  { name: "Ziyolilar ko'chasi", district: "Mirzo Ulug'bek", desc: "Fanlar Akademiyasi institutlari va ilmiy laboratoriyalar ko'chasi.", hist: "O'zbekiston olimlari va akademiklarining asosiy ilmiy bazasi." },
  { name: "Sayram ko'chasi", district: "Mirzo Ulug'bek", desc: "Shinam qahvaxonalar, novvoyxonalar va tinch kvartallar.", hist: "Qadimiy Sayram shahri nomiga atalgan qardoshlik ko'chasi." },
  { name: "Buyuk Ipak Yo'li ko'chasi", district: "Mirzo Ulug'bek", desc: "Sharq tomon shahardan chiqishdagi katta savdo magistrali.", hist: "Ming yillik tarixiy karvon yo'llari yo'nalishida joylashgan." },
  { name: "Oltintepa ko'chasi", district: "Mirzo Ulug'bek", desc: "Yashil tepaliklar va zamonaviy kottejlar hududi.", hist: "Arxeologik qazilmalar topilgan qadimiy maskan." },
  { name: "Aviasozlar ko'chasi", district: "Yashnobod", desc: "Mashhur aviatsiya zavodi (TAPOiCh) ishchilari mahallasi.", hist: "Dunyoga mashhur Il-76 samolyotlari ishlab chiqarilgan markaz." },
  { name: "Elbek ko'chasi", district: "Yashnobod", desc: "Do'stlik metro bekati va transport bog'lamasi ko'chasi.", hist: "O'zbek ma'rifatparvar shoiri Elbek nomiga berilgan." },
  { name: "Qo'yliq ota ko'chasi", district: "Bektemir", desc: "Katta dehqon bozori va Chirchiq daryosi bo'yidagi yo'l.", hist: "Qadimiy Qo'yliq ota ziyoratgohi va savdo karvonlari to'xtash joyi." },
  { name: "Husayn Boyqaro ko'chasi", district: "Bektemir", desc: "Sanoat zonalari va logistika markazlari ko'chasi.", hist: "Temuriylar davri buyuk hukmdori Husayn Boyqaro nomi bilan atalgan." },
  { name: "Bektemir shoh ko'chasi", district: "Bektemir", desc: "Janubi-sharqiy sanoat va ishlab chiqarish arteriyasi.", hist: "Toshkentning sanoat salohiyatini oshirish maqsadida tashkil etilgan." },
  { name: "Yangiobod ko'chasi", district: "Yashnobod", desc: "Hunarmandlar va noyob antiqa buyumlar bozori.", hist: "Toshkentning eng o'ziga xos madaniy va savdo qatlamlaridan biri." },
];

// Replicate and generate 100+ distinct streets with exact grid positions (10x10 = 100 cells)
export const STREETS_DATA: StreetData[] = [];

let streetIdx = 0;
for (let gridX = -5; gridX < 5; gridX++) {
  for (let gridZ = -5; gridZ < 5; gridZ++) {
    const raw = rawStreetNames[streetIdx % rawStreetNames.length];
    const streetId = `street_${gridX + 5}_${gridZ + 5}`;
    const nameSuffix = streetIdx >= rawStreetNames.length ? ` (${Math.floor(streetIdx / rawStreetNames.length) + 1}-mavze)` : '';
    
    // Calculate world coordinates for the center of the street chunk
    const worldX = gridX * CHUNK_SIZE;
    const worldZ = gridZ * CHUNK_SIZE;

    const pois: POIData[] = [];
    
    // Add distinct POIs to some streets
    if ((gridX + gridZ) % 2 === 0) {
      const categories: POIData['category'][] = ['landmark', 'cafe', 'shop', 'government', 'park', 'historical'];
      const cat = categories[Math.abs(gridX * 3 + gridZ * 7) % categories.length];
      
      pois.push({
        id: `poi_${streetId}_1`,
        name: `${raw.name.split(" ko'chasi")[0]} Markazi`,
        category: cat,
        description: `${raw.name} hududidagi diqqatga sazovor ${cat} maskani. Mehmonlar va shahar aholisi uchun barcha qulayliklar yaratilgan.`,
        fullHistory: `${raw.hist} Ushbu obyekt hududning eng gavjum va go'zal arxitektura namunalaridan biridir.`,
        position: [worldX + 12, 0, worldZ + 15],
        streetId: streetId,
        hours: "08:00 - 23:00",
        rating: 4.8,
        imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80"
      });
    }

    if (Math.abs(gridX) === 1 && Math.abs(gridZ) === 1) {
      pois.push({
        id: `poi_${streetId}_cafe`,
        name: "Shinam Kofe & Qahvaxona",
        category: "cafe",
        description: "Issiq qahva, yangi pishiriqlar va shinam muhitga ega qahvaxona.",
        fullHistory: "Shaharning zamonaviy yoshlari uchun qulay muhitga ega dam olish va frilans maskani.",
        position: [worldX - 14, 0, worldZ - 12],
        streetId: streetId,
        hours: "07:30 - 00:00",
        rating: 4.9,
        imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80"
      });
    }

    STREETS_DATA.push({
      id: streetId,
      name: `${raw.name}${nameSuffix}`,
      district: raw.district,
      lengthMeters: 350 + (Math.abs(gridX + gridZ) * 40),
      centerChunk: [gridX, gridZ],
      startPos: [worldX, 1.6, worldZ],
      description: raw.desc,
      history: raw.hist,
      lanes: 4,
      speedLimit: 60,
      pois: pois,
    });

    streetIdx++;
  }
}

// Find street by coordinate helper
export function getStreetByChunk(x: number, z: number): StreetData | undefined {
  return STREETS_DATA.find(s => s.centerChunk[0] === x && s.centerChunk[1] === z);
}

// Search streets and POIs helper
export function searchCity(query: string): { streets: StreetData[]; pois: POIData[] } {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return { streets: [], pois: [] };

  const matchedStreets = STREETS_DATA.filter(s => 
    s.name.toLowerCase().includes(cleanQ) || 
    s.district.toLowerCase().includes(cleanQ) ||
    s.description.toLowerCase().includes(cleanQ)
  );

  const matchedPois: POIData[] = [];
  STREETS_DATA.forEach(s => {
    s.pois.forEach(p => {
      if (p.name.toLowerCase().includes(cleanQ) || p.description.toLowerCase().includes(cleanQ)) {
        matchedPois.push(p);
      }
    });
  });

  return {
    streets: matchedStreets.slice(0, 8),
    pois: matchedPois.slice(0, 8)
  };
}
