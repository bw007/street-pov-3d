import React, { useMemo } from 'react';
import { Instances, Instance } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { BuildingData, InspectableObject } from '../../types';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';

interface BuildingMeshProps {
  building: BuildingData;
}

const SIGN_TEXTS = ['SUPERMARKET', 'COFFEE & BAKERY', 'BANK', 'APTEKA 24/7', 'RESTORAN', 'HOTEL & SPA'];
const SIGN_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];
const WINDOW_H = 1.6;
const WINDOW_W = 1.4;

export const BuildingMesh: React.FC<BuildingMeshProps> = ({ building }) => {
  const { id, position, size, color, roofColor, floors, type } = building;
  const [width, height, depth] = size;
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  const seed = useMemo(() => {
    return Math.abs(id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
  }, [id]);

  const signText = SIGN_TEXTS[seed % SIGN_TEXTS.length];
  const signColor = SIGN_COLORS[seed % SIGN_COLORS.length];

  // Inspect data memoized
  const inspectData: InspectableObject = useMemo(() => {
    const typeNames: Record<string, string> = {
      skyscraper: "Zamonaviy Osmono'par Biznes Markazi",
      commercial: "Tijorat va Xizmat Ko'rsatish Majmuasi",
      office: "Innovatsion Ofislar Binosi",
      residential: "Ko'p Qavatli Zamonaviy Turar-Joy",
      historical: "Tarixiy Arxitektura Obidasi",
      cafe: "Shinam Qahvaxona va Restoran",
    };

    return {
      id,
      title: `${typeNames[type] || 'Shahar Binosi'} (${signText})`,
      category: 'building',
      badge: type.toUpperCase(),
      description: `${currentStreet?.name || 'Markaziy ko\'cha'} bo'yida joylashgan zamonaviy shahar binosi. 1-qavatida ${signText} xizmati mavjud bo'lib, energiya tejamkor tizimlar bilan jihozlangan.`,
      streetName: currentStreet?.name,
      details: [
        { label: "Qavatlar soni", value: `${floors} qavat` },
        { label: "Balandligi", value: `${Math.round(height)} metr` },
        { label: "O'lchamlari", value: `${Math.round(width)}m x ${Math.round(depth)}m` },
        { label: "1-qavat xizmati", value: signText },
        { label: "Seysmik chidamlilik", value: "9 ball" },
        { label: "Holati", value: "Faol foydalanishda" },
      ],
    };
  }, [id, type, signText, currentStreet?.name, floors, height, width, depth]);

  const windowProps = useMemo(() => {
    const list: { x: number; y: number; z: number; w: number; h: number; face: 'front' | 'back' | 'left' | 'right' }[] = [];
    const windowH = 1.6;
    const windowW = 1.4;
    const spacingX = 3.2;

    const colsFront = Math.floor(width / spacingX);
    const colsSide = Math.floor(depth / spacingX);

    for (let f = 1; f < floors; f++) {
      const y = f * 3.6 - height / 2 + 1.8;

      for (let c = 0; c < colsFront; c++) {
        const x = (c - (colsFront - 1) / 2) * spacingX;
        list.push({ x, y, z: depth / 2 + 0.05, w: windowW, h: windowH, face: 'front' });
        list.push({ x, y, z: -depth / 2 - 0.05, w: windowW, h: windowH, face: 'back' });
      }

      for (let c = 0; c < colsSide; c++) {
        const z = (c - (colsSide - 1) / 2) * spacingX;
        list.push({ x: -width / 2 - 0.05, y, z, w: windowW, h: windowH, face: 'left' });
        list.push({ x: width / 2 + 0.05, y, z, w: windowW, h: windowH, face: 'right' });
      }
    }

    return list;
  }, [width, height, depth, floors]);

  const acUnits = useMemo(() => {
    const units: { x: number; y: number }[] = [];
    for (let f = 1; f < Math.min(floors, 6); f++) {
      if ((f + seed) % 2 === 0) {
        units.push({
          x: ((f % 2 === 0 ? 1 : -1) * width) / 3.5,
          y: f * 3.6 - height / 2 + 0.9,
        });
      }
    }
    return units;
  }, [floors, height, width, seed]);

  const windowEmissive = isNight ? '#fef08a' : isSunset ? '#fdba74' : '#38bdf8';
  const windowEmissiveIntensity = isNight ? 2.0 : isSunset ? 0.8 : 0.05;

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <RigidBody type="fixed" colliders="cuboid" position={position}>
      <group
        userData={{ inspectData }}
        onClick={handleInspect}
      >
        {/* 1. Main Building Body */}
        <mesh castShadow receiveShadow userData={{ inspectData }}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial
            color={color}
            roughness={0.7}
            metalness={type === 'skyscraper' ? 0.5 : 0.1}
          />
        </mesh>

        {/* 2. Roof Parapet */}
        <mesh position={[0, height / 2 + 0.3, 0]}>
          <boxGeometry args={[width + 0.4, 0.6, depth + 0.4]} />
          <meshStandardMaterial color={roofColor} roughness={0.9} />
        </mesh>

        {/* 3. Rooftop Equipment */}
        {type === 'skyscraper' ? (
          <group position={[0, height / 2 + 0.6, 0]}>
            <mesh position={[0, 2.5, 0]}>
              <boxGeometry args={[width * 0.4, 5, depth * 0.4]} />
              <meshStandardMaterial color="#475569" roughness={0.5} />
            </mesh>
            <mesh position={[0, 7.5, 0]}>
              <cylinderGeometry args={[0.08, 0.18, 5, 8]} />
              <meshStandardMaterial
                color="#ef4444"
                emissive="#ef4444"
                emissiveIntensity={isNight ? 3 : 0.5}
              />
            </mesh>
          </group>
        ) : (
          <group position={[0, height / 2 + 1.2, 0]}>
            <mesh position={[-width * 0.25, 0, -depth * 0.25]}>
              <cylinderGeometry args={[1.2, 1.2, 2.0, 12]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        )}

        {/* 4. Ground Floor Commercial Storefront */}
        <group position={[0, -height / 2 + 1.7, depth / 2 + 0.08]} userData={{ inspectData }}>
          <mesh>
            <planeGeometry args={[width * 0.85, 3.4]} />
            <meshStandardMaterial
              color="#0f172a"
              roughness={0.1}
              metalness={0.9}
              emissive={isNight ? '#60a5fa' : '#1e293b'}
              emissiveIntensity={isNight ? 0.8 : 0.1}
            />
          </mesh>

          <mesh position={[0, -0.2, 0.05]}>
            <planeGeometry args={[2.4, 2.6]} />
            <meshStandardMaterial color="#93c5fd" roughness={0.1} metalness={0.9} transparent opacity={0.7} />
          </mesh>

          {/* Shop Canopy / Awning */}
          <mesh position={[0, 1.6, 0.9]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[width * 0.9, 0.1, 1.8]} />
            <meshStandardMaterial color={signColor} roughness={0.8} />
          </mesh>

          {/* Illuminated Storefront Signboard */}
          <group position={[0, 2.3, 0.2]}>
            <mesh>
              <boxGeometry args={[width * 0.65, 0.6, 0.15]} />
              <meshStandardMaterial color="#090d16" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0.09]}>
              <planeGeometry args={[width * 0.6, 0.45]} />
              <meshStandardMaterial
                color={signColor}
                emissive={signColor}
                emissiveIntensity={isNight ? 2.8 : 0.8}
              />
            </mesh>
          </group>
        </group>

        {/* 5. AC Outdoor Units */}
        {acUnits.map((ac, i) => (
          <group key={`ac-${i}`} position={[ac.x, ac.y, depth / 2 + 0.35]}>
            <mesh castShadow>
              <boxGeometry args={[0.9, 0.6, 0.5]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 0.02, 12]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
          </group>
        ))}

        {/* 6. Windows — all windows on a building share the same size and
            material, differing only by transform, so they're batched into a
            single instanced draw call instead of one mesh each (a 15-floor
            tower can have 250+ windows). */}
        <Instances limit={Math.max(windowProps.length, 1)} range={windowProps.length}>
          <planeGeometry args={[WINDOW_W, WINDOW_H]} />
          <meshStandardMaterial
            color={isNight ? '#fef08a' : '#93c5fd'}
            roughness={0.1}
            metalness={0.8}
            emissive={windowEmissive}
            emissiveIntensity={windowEmissiveIntensity}
          />
          {windowProps.map((w, i) => (
            <Instance
              key={i}
              position={[w.x, w.y, w.z]}
              rotation={[
                0,
                w.face === 'left' ? -Math.PI / 2 : w.face === 'right' ? Math.PI / 2 : w.face === 'back' ? Math.PI : 0,
                0,
              ]}
            />
          ))}
        </Instances>
      </group>
    </RigidBody>
  );
};
