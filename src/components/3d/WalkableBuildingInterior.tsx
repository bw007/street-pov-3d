import React, { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

interface WalkableBuildingProps {
  position: [number, number, number];
  rotationY?: number;
}

export const WalkableBuildingInterior: React.FC<WalkableBuildingProps> = ({
  position,
  rotationY = 0,
}) => {
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);

  const isNight = timeOfDay === 'night';

  // 1st Floor Inspection Data
  const cafeBarData: InspectableObject = useMemo(() => ({
    id: 'interior_cafe_bar',
    title: "Premium Kofe Bori & Espresso Zonasi",
    category: 'shop',
    badge: "1-QAVAT INTERYER",
    description: "Binoning 1-qavatidagi shinam qahvaxona. Italiya espresso mashinalari, yangi qovurilgan donli kofe va pishiriqlar.",
    streetName: currentStreet?.name,
    details: [
      { label: "Menyu", value: "Espresso, Cappuccino, Flat White, Desertlar" },
      { label: "Ish vaqti", value: "08:00 - 23:00" },
      { label: "Wi-Fi tezligi", value: "100 Mbps (Mehmonlar uchun bepul)" },
      { label: "Xizmat ko'rsatish", value: "O'z-o'ziga xizmat va ofitsiant" },
    ],
  }), [currentStreet?.name]);

  const receptionData: InspectableObject = useMemo(() => ({
    id: 'interior_reception',
    title: "Markaziy Qabulxona & Reception Stoli",
    category: 'building',
    badge: "1-QAVAT INTERYER",
    description: "Tashrif buyuruvchilar va mehmonlarni ro'yxatga olish, ma'lumot berish va yo'naltirish xizmati.",
    streetName: currentStreet?.name,
    details: [
      { label: "Xodimlar", value: "Administrator & Konsyerj" },
      { label: "Tizim", value: "Smart Access Card & Face ID" },
      { label: "Bog'lanish", value: "+998 71 200-00-00" },
    ],
  }), [currentStreet?.name]);

  const loungeData: InspectableObject = useMemo(() => ({
    id: 'interior_lounge',
    title: "Yumshoq Mebel & Dam Olish Zonasi (Lounge)",
    category: 'building',
    badge: "1-QAVAT INTERYER",
    description: "Mehmonlar va ish uchrashuvlari uchun qulay charm divanlar, jurnal stollari va dekorativ o'simliklar bilan jihozlangan zal.",
    streetName: currentStreet?.name,
    details: [
      { label: "Mebel turi", value: "Premium Skandinaviya uslubi" },
      { label: "Sig'imi", value: "12 kishilik shinam o'rinlar" },
      { label: "Atmosfera", value: "Yumshoq sokin musiqa" },
    ],
  }), [currentStreet?.name]);

  const galleryData: InspectableObject = useMemo(() => ({
    id: 'interior_gallery',
    title: "Zamonaviy San'at & Rasm Ko'rgazmasi",
    category: 'landmark',
    badge: "GALEREYA",
    description: "Devorlarda zamonaviy o'zbek rassomlari va arxitektura durdonalari aks etgan yorqin san'at asarlari.",
    streetName: currentStreet?.name,
    details: [
      { label: "Eksponatlar", value: "15 ta original kartina" },
      { label: "Yoritish", value: "Fokuslangan muzey LED chiroqlari" },
      { label: "Kirish", value: "Barcha uchun bepul" },
    ],
  }), [currentStreet?.name]);

  // 2nd Floor Inspection Data
  const stairsData: InspectableObject = useMemo(() => ({
    id: 'interior_stairs',
    title: "2-Qavatga Ko'tarilish Zinapoyasi",
    category: 'building',
    badge: "ZINAPOYA",
    description: "1-qavat kofe zolidan 2-qavatdagi VIP konferentsiya zali va kutubxonaga olib chiquvchi zamonaviy me'moriy zinapoya.",
    streetName: currentStreet?.name,
    details: [
      { label: "Pillapoyalar", value: "14 ta qattiq eman yog'ochli zina" },
      { label: "Tutqich", value: "Zanglamas po'lat va shisha" },
      { label: "Balandligi", value: "4.2 metr" },
    ],
  }), [currentStreet?.name]);

  const conferenceData: InspectableObject = useMemo(() => ({
    id: 'interior_conference',
    title: "2-Qavat VIP Konferentsiya & Majlislar Zali",
    category: 'building',
    badge: "2-QAVAT INTERYER",
    description: "Biznes muzokaralari, taqdimotlar va strategik uchrashuvlar uchun jihozlangan shinam oval stol va ergonomik kreslolar.",
    streetName: currentStreet?.name,
    details: [
      { label: "Sig'imi", value: "10 kishilik majlislar stoli" },
      { label: "Uskunalar", value: "Smart 4K Ekran, Video Konferentsiya" },
      { label: "Panoramik ko'rinish", value: "Amir Temur ko'chasiga qaragan" },
    ],
  }), [currentStreet?.name]);

  const libraryData: InspectableObject = useMemo(() => ({
    id: 'interior_library',
    title: "Biznes & IT Kitob Javoni (Library Wall)",
    category: 'building',
    badge: "2-QAVAT KUTUBXONA",
    description: "Dasturlash, arxitektura, biznes boshqaruvi va san'at bo'yicha eng sara xalqaro kitoblar to'plami.",
    streetName: currentStreet?.name,
    details: [
      { label: "Kitoblar soni", value: "250+ kitob" },
      { label: "Janrlar", value: "IT, Arxitektura, Biznes, Tarix" },
      { label: "Foydalanish", value: "O'quv zali mehmonlari uchun ochiq" },
    ],
  }), [currentStreet?.name]);

  const handleInspect = (data: InspectableObject) => (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(data);
  };

  const width = 24;
  const height = 10;
  const depth = 22;
  const secondFloorY = 4.2;

  // Staircase steps generator (14 steps)
  const stairSteps = useMemo(() => {
    const steps: { x: number; y: number; z: number; w: number; h: number; d: number }[] = [];
    const count = 14;
    const totalH = secondFloorY;
    const startZ = -depth / 2 + 1.5;
    const stepDepth = 0.65;
    const stepHeight = totalH / count;

    for (let i = 0; i < count; i++) {
      steps.push({
        x: -width / 2 + 3.0,
        y: i * stepHeight + stepHeight / 2,
        z: startZ + (count - 1 - i) * stepDepth,
        w: 2.6,
        h: stepHeight,
        d: stepDepth,
      });
    }
    return steps;
  }, [depth, width, secondFloorY]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* 1. SOLID BUILDING STRUCTURAL ENVELOPE (Thick Walls) */}
      
      {/* 1st Floor Ground Base */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[width, 0.1, depth]} />
          <meshStandardMaterial color="#78350f" roughness={0.4} metalness={0.1} />
        </mesh>
      </RigidBody>

      {/* Main Roof Plate */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, height + 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[width + 1.2, 0.6, depth + 1.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Back Solid Wall (0.8m Thick) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, height / 2, -depth / 2 - 0.2]} castShadow receiveShadow>
          <boxGeometry args={[width, height, 0.8]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Left Solid Wall (0.8m Thick) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-width / 2 - 0.2, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, height, depth]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Right Solid Wall (0.8m Thick) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[width / 2 + 0.2, height / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, height, depth]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Front Facade with Wide Open Center Portal */}
      <RigidBody type="fixed" colliders="cuboid">
        {/* Left Glass Facade */}
        <mesh position={[-width * 0.36, height / 2, depth / 2 + 0.1]}>
          <boxGeometry args={[width * 0.28, height, 0.6]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.45} />
        </mesh>
        {/* Right Glass Facade */}
        <mesh position={[width * 0.36, height / 2, depth / 2 + 0.1]}>
          <boxGeometry args={[width * 0.28, height, 0.6]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.45} />
        </mesh>
        {/* Top Header over portal */}
        <mesh position={[0, height - 1.2, depth / 2 + 0.1]}>
          <boxGeometry args={[width * 0.44, 2.4, 0.6]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Modern Entrance Canopy & Neon Plate */}
      <group position={[0, 4.5, depth / 2 + 2.0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[9.5, 0.2, 4.0]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.7, 2.0]}>
          <boxGeometry args={[7.0, 0.9, 0.1]} />
          <meshStandardMaterial color="#0284c7" emissive="#38bdf8" emissiveIntensity={isNight ? 3 : 0.9} />
        </mesh>
      </group>

      {/* 2. FUNCTIONAL 2ND FLOOR (MEZZANINE LOFT) */}
      <group position={[0, secondFloorY, -depth * 0.15]}>
        {/* 2nd Floor Solid Walking Plate */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh receiveShadow position={[2.5, 0, 0]}>
            <boxGeometry args={[width - 6.5, 0.3, depth * 0.65]} />
            <meshStandardMaterial color="#78350f" roughness={0.4} />
          </mesh>
        </RigidBody>

        {/* Protective Glass Railing overlooking 1st Floor */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[2.5, 0.6, depth * 0.32]}>
            <boxGeometry args={[width - 6.5, 1.1, 0.08]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.4} />
          </mesh>
          {/* Steel Top Handrail */}
          <mesh position={[2.5, 1.18, depth * 0.32]}>
            <boxGeometry args={[width - 6.5, 0.06, 0.12]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
          </mesh>
        </RigidBody>
      </group>

      {/* 3. CLIMBABLE STAIRCASE WITH SMOOTH RAMP PHYSICS */}
      <group
        userData={{ inspectData: stairsData }}
        onClick={handleInspect(stairsData)}
      >
        {/* Visual Wooden Step Blocks */}
        {stairSteps.map((s, idx) => (
          <group key={`stair-${idx}`} position={[s.x, s.y, s.z]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[s.w, s.h, s.d]} />
              <meshStandardMaterial color="#451a03" roughness={0.5} />
            </mesh>
            {/* LED Stair Tread Light Strip */}
            <mesh position={[0, s.h / 2 + 0.01, -s.d / 2 + 0.05]}>
              <boxGeometry args={[s.w - 0.2, 0.02, 0.06]} />
              <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={isNight ? 2 : 0.5} />
            </mesh>
          </group>
        ))}

        {/* INVISIBLE SMOOTH RAMP COLLIDER (Allows 100% smooth walking up and down!) */}
        <RigidBody type="fixed" colliders="cuboid" position={[-width / 2 + 3.0, secondFloorY / 2, -depth / 2 + 5.7]} rotation={[-0.45, 0, 0]}>
          <mesh visible={false}>
            <boxGeometry args={[2.8, 0.2, 10.0]} />
          </mesh>
        </RigidBody>

        {/* Stair Glass Handrail */}
        <RigidBody type="fixed" colliders="cuboid" position={[-width / 2 + 4.3, secondFloorY / 2 + 0.6, -depth / 2 + 5.7]} rotation={[-0.45, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.06, 1.0, 10.0]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.4} />
          </mesh>
        </RigidBody>
      </group>

      {/* 4. 2ND FLOOR VIP ROOM OBJECTS */}

      {/* A. VIP Conference & Meeting Table */}
      <group
        position={[3.0, secondFloorY + 0.15, -depth * 0.15]}
        userData={{ inspectData: conferenceData }}
        onClick={handleInspect(conferenceData)}
      >
        <RigidBody type="fixed" colliders="cuboid">
          {/* Executive Table */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[5.5, 0.1, 2.4]} />
            <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Steel Pedestal Legs */}
          <mesh position={[-1.8, 0.25, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.5, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>
          <mesh position={[1.8, 0.25, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.5, 12]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>
        </RigidBody>

        {/* 6 Executive Conference Chairs */}
        {[-1.8, 0, 1.8].map((x, i) => (
          <React.Fragment key={`chair-pair-${i}`}>
            <mesh position={[x, 0.45, 1.5]}>
              <boxGeometry args={[0.6, 0.9, 0.6]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.8} />
            </mesh>
            <mesh position={[x, 0.45, -1.5]}>
              <boxGeometry args={[0.6, 0.9, 0.6]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.8} />
            </mesh>
          </React.Fragment>
        ))}

        {/* Laptops on Table */}
        <mesh position={[-1.2, 0.6, 0.4]}>
          <boxGeometry args={[0.5, 0.04, 0.35]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        <mesh position={[1.2, 0.6, -0.4]}>
          <boxGeometry args={[0.5, 0.04, 0.35]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
      </group>

      {/* B. 2nd Floor Bookshelf Wall */}
      <group
        position={[width / 2 - 1.2, secondFloorY + 0.15, -depth * 0.15]}
        userData={{ inspectData: libraryData }}
        onClick={handleInspect(libraryData)}
      >
        <RigidBody type="fixed" colliders="cuboid">
          {/* Main Bookcase Structure */}
          <mesh position={[0, 1.8, 0]} castShadow>
            <boxGeometry args={[0.8, 3.6, 6.0]} />
            <meshStandardMaterial color="#451a03" roughness={0.7} />
          </mesh>
        </RigidBody>
        {/* Book rows */}
        {[-1.8, 0, 1.8].map((z, idx) => (
          <mesh key={`book-${idx}`} position={[-0.25, 1.8, z]}>
            <boxGeometry args={[0.3, 3.2, 1.4]} />
            <meshStandardMaterial color={idx === 0 ? '#3b82f6' : idx === 1 ? '#eab308' : '#10b981'} roughness={0.8} />
          </mesh>
        ))}
      </group>

      {/* 5. 1ST FLOOR OBJECTS (RECEPTION, CAFE BAR, LOUNGE, GALLERY) */}

      {/* Reception Desk */}
      <group
        position={[6, 0.1, 4]}
        userData={{ inspectData: receptionData }}
        onClick={handleInspect(receptionData)}
      >
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[3.8, 1.2, 1.4]} />
            <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0, 1.22, 0]}>
            <boxGeometry args={[4.0, 0.08, 1.6]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.1} metalness={0.8} />
          </mesh>
        </RigidBody>
        <mesh position={[0.5, 1.55, -0.2]}>
          <boxGeometry args={[0.9, 0.55, 0.08]} />
          <meshStandardMaterial color="#0f172a" emissive="#60a5fa" emissiveIntensity={0.6} />
        </mesh>
      </group>

      {/* Coffee & Espresso Bar */}
      <group
        position={[-5.5, 0.1, 2]}
        userData={{ inspectData: cafeBarData }}
        onClick={handleInspect(cafeBarData)}
      >
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 0.6, 0]} castShadow>
            <boxGeometry args={[1.5, 1.2, 6.0]} />
            <meshStandardMaterial color="#451a03" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.22, 0]}>
            <boxGeometry args={[1.7, 0.08, 6.2]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.2} metalness={0.3} />
          </mesh>
        </RigidBody>

        <mesh position={[0, 1.55, 1.2]} castShadow>
          <boxGeometry args={[0.8, 0.6, 1.1]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>

        {[-1.8, -0.6, 0.6, 1.8].map((z, i) => (
          <group key={`stool-${i}`} position={[1.2, 0, z]}>
            <RigidBody type="fixed" colliders="hull">
              <mesh position={[0, 0.8, 0]}>
                <cylinderGeometry args={[0.25, 0.25, 0.08, 16]} />
                <meshStandardMaterial color="#b91c1c" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} />
              </mesh>
            </RigidBody>
          </group>
        ))}
      </group>

      {/* Lounge Sofa */}
      <group
        position={[0, 0.1, -4]}
        userData={{ inspectData: loungeData }}
        onClick={handleInspect(loungeData)}
      >
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, 0.45, -2]} castShadow>
            <boxGeometry args={[5.5, 0.9, 1.4]} />
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>
          <mesh position={[-2.2, 0.45, 0]} castShadow>
            <boxGeometry args={[1.4, 0.9, 3.2]} />
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[2.4, 0.5, 1.4]} />
            <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.8} transparent opacity={0.6} />
          </mesh>
        </RigidBody>
      </group>

      {/* Art Gallery Paintings */}
      <group
        position={[0, 3.2, -depth / 2 + 0.45]}
        userData={{ inspectData: galleryData }}
        onClick={handleInspect(galleryData)}
      >
        {[-6, -2, 2, 6].map((x, idx) => (
          <group key={`art-${idx}`} position={[x, 0, 0]}>
            <mesh>
              <boxGeometry args={[2.4, 1.8, 0.06]} />
              <meshStandardMaterial color="#78350f" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.04]}>
              <planeGeometry args={[2.2, 1.6]} />
              <meshStandardMaterial
                color={idx % 2 === 0 ? '#38bdf8' : '#f59e0b'}
                emissive={idx % 2 === 0 ? '#0284c7' : '#d97706'}
                emissiveIntensity={0.3}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* 6. Dynamic Interior Lighting */}
      {[
        [0, 1.8, 3],
        [0, 1.8, -4],
        [3, secondFloorY + 3.0, -depth * 0.15],
        [-width / 2 + 3.0, secondFloorY + 2.0, -depth / 2 + 5.7],
      ].map(([lx, ly, lz], i) => (
        <group key={`interior-light-${i}`} position={[lx, ly, lz]}>
          <pointLight
            color="#fef08a"
            intensity={isNight ? 22 : 14}
            distance={16}
            decay={2}
          />
        </group>
      ))}
    </group>
  );
};
