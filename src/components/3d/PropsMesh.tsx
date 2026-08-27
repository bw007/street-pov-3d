import React, { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { CHUNK_SIZE } from '../../data/streetsData';
import { InspectableObject } from '../../types';

interface PropsMeshProps {
  chunkX: number;
  chunkZ: number;
  streetName?: string;
  isActiveChunk?: boolean;
}

export const PropsMesh: React.FC<PropsMeshProps> = ({ chunkX, chunkZ, isActiveChunk = true }) => {
  const worldX = chunkX * CHUNK_SIZE;
  const worldZ = chunkZ * CHUNK_SIZE;
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  const busStopData: InspectableObject = useMemo(() => ({
    id: `busstop_${chunkX}_${chunkZ}`,
    title: "Zamonaviy Aqlli Avtobus Bekati",
    category: 'infrastructure',
    badge: "BEKAT",
    description: `${currentStreet?.name || 'Markaziy ko\'cha'} bo'yidagi zamonaviy shisha bekat. Kutish uchun qulay shinam o'rindiqlar va axborot monitori mavjud.`,
    streetName: currentStreet?.name,
    details: [
      { label: "Keluvchi avtobuslar", value: "№ 24, 38, 51, 93" },
      { label: "Oraliq vaqt", value: "7-10 daqiqa" },
      { label: "Wi-Fi & Zaryadlash", value: "Mavjud (Free Wi-Fi)" },
      { label: "Xavfsizlik", value: "24/7 Video kuzatuv" },
    ],
  }), [chunkX, chunkZ, currentStreet?.name]);

  const lampData: InspectableObject = useMemo(() => ({
    id: `lamp_${chunkX}_${chunkZ}`,
    title: "LED Ko'cha Yoritish Chirog'i",
    category: 'infrastructure',
    badge: "YORITISH",
    description: "Kechasi ko'chani yorqin yorituvchi, quyosh energiyasi va tejamkor LED chiroqlar bilan ishlovchi tizim.",
    streetName: currentStreet?.name,
    details: [
      { label: "Yorug'lik kuchi", value: "15,000 Lumen" },
      { label: "Texnologiya", value: "Smart LED & Dimmer" },
      { label: "Avtomatika", value: "Qorong'uda o'zi yoqiladi" },
    ],
  }), [chunkX, chunkZ, currentStreet?.name]);

  const treeData: InspectableObject = useMemo(() => ({
    id: `tree_${chunkX}_${chunkZ}`,
    title: "Soyali Yashil Chinor Daraxti",
    category: 'nature',
    badge: "TABIAT & EKO",
    description: "Shahar iqlimini yumshatuvchi, havoni tozalovchi va ko'kalamzorlashtirish uchun ekilgan tabiiy manzarali daraxt.",
    streetName: currentStreet?.name,
    details: [
      { label: "Turi", value: "Sharq Chinori" },
      { label: "Balandligi", value: "5.5 metr" },
      { label: "Sug'orish tizimi", value: "Avtomat tomchilatib sug'orish" },
      { label: "Ekologik foydasi", value: "Kuniga 120kg kislorod" },
    ],
  }), [chunkX, chunkZ, currentStreet?.name]);

  // Street Lamps along sidewalk
  const lampPositions: [number, number, number][] = [
    [worldX - 7.8, 0, worldZ - 18],
    [worldX - 7.8, 0, worldZ + 18],
    [worldX + 7.8, 0, worldZ - 18],
    [worldX + 7.8, 0, worldZ + 18],
    [worldX - 18, 0, worldZ - 7.8],
    [worldX + 18, 0, worldZ - 7.8],
    [worldX - 18, 0, worldZ + 7.8],
    [worldX + 18, 0, worldZ + 7.8],
  ];

  // Elevated slim trees along sidewalk planter corners
  const treePositions: [number, number, number][] = [
    [worldX - 11, 0, worldZ - 26],
    [worldX - 11, 0, worldZ + 26],
    [worldX + 11, 0, worldZ - 26],
    [worldX + 11, 0, worldZ + 26],
  ];

  // Stainless steel bollards along curbs
  const bollardPositions: [number, number, number][] = [
    [worldX - 7.4, 0, worldZ - 12],
    [worldX - 7.4, 0, worldZ - 6],
    [worldX - 7.4, 0, worldZ + 6],
    [worldX - 7.4, 0, worldZ + 12],
    [worldX + 7.4, 0, worldZ - 12],
    [worldX + 7.4, 0, worldZ - 6],
    [worldX + 7.4, 0, worldZ + 6],
    [worldX + 7.4, 0, worldZ + 12],
  ];

  const busStopPos: [number, number, number] = [worldX - 10, 0.16, worldZ - 10];
  const hydrantPos: [number, number, number] = [worldX + 8.2, 0.16, worldZ - 14];
  const binPos: [number, number, number] = [worldX - 8.2, 0.16, worldZ + 14];

  const handleLampClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(lampData);
  };
  const handleTreeClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(treeData);
  };
  const handleBusStopClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(busStopData);
  };

  return (
    <group>
      {/*
        All static street-furniture colliders for this chunk share ONE fixed
        RigidBody (react-three-rapier still generates one collider per mesh
        child) instead of ~23 separate RigidBodies (one per lamp/tree/bollard/
        etc). Same physical shapes, far fewer rigid bodies for Rapier to
        register — this mainly shows up as less stutter when a new chunk
        streams in while walking.
      */}
      <RigidBody type="fixed" colliders="cuboid">
        {/* Lamp posts */}
        {lampPositions.map((pos, idx) => (
          <mesh
            key={`lamp-collider-${idx}`}
            position={[pos[0], 2.8, pos[2]]}
            castShadow
            userData={{ inspectData: lampData }}
            onClick={handleLampClick}
          >
            <cylinderGeometry args={[0.09, 0.14, 5.6, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
          </mesh>
        ))}

        {/* Bus stop shelter panels */}
        <mesh position={[busStopPos[0], busStopPos[1] + 1.4, busStopPos[2] - 0.9]} userData={{ inspectData: busStopData }} onClick={handleBusStopClick}>
          <boxGeometry args={[4.2, 2.6, 0.08]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.5} />
        </mesh>
        <mesh position={[busStopPos[0] - 2.1, busStopPos[1] + 1.4, busStopPos[2]]} userData={{ inspectData: busStopData }} onClick={handleBusStopClick}>
          <boxGeometry args={[0.08, 2.6, 1.8]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.1} transparent opacity={0.5} />
        </mesh>
        <mesh position={[busStopPos[0], busStopPos[1] + 2.7, busStopPos[2]]} userData={{ inspectData: busStopData }} onClick={handleBusStopClick}>
          <boxGeometry args={[4.6, 0.15, 2.2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <mesh position={[busStopPos[0], busStopPos[1] + 0.45, busStopPos[2] - 0.6]} userData={{ inspectData: busStopData }} onClick={handleBusStopClick}>
          <boxGeometry args={[3.2, 0.08, 0.45]} />
          <meshStandardMaterial color="#92400e" roughness={0.8} />
        </mesh>

        {/* Tree trunks */}
        {treePositions.map((pos, idx) => (
          <mesh
            key={`tree-collider-${idx}`}
            position={[pos[0], 1.6, pos[2]]}
            castShadow
            userData={{ inspectData: treeData }}
            onClick={handleTreeClick}
          >
            <cylinderGeometry args={[0.18, 0.28, 3.2, 8]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
        ))}

        {/* Sidewalk bollards */}
        {bollardPositions.map((pos, idx) => (
          <React.Fragment key={`bollard-${idx}`}>
            <mesh position={[pos[0], 0.45, pos[2]]}>
              <cylinderGeometry args={[0.08, 0.08, 0.9, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[pos[0], 0.8, pos[2]]}>
              <cylinderGeometry args={[0.085, 0.085, 0.1, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={isNight ? 1.5 : 0.2} />
            </mesh>
          </React.Fragment>
        ))}

        {/* Fire hydrant */}
        <mesh position={[hydrantPos[0], hydrantPos[1] + 0.35, hydrantPos[2]]}>
          <cylinderGeometry args={[0.14, 0.16, 0.7, 8]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[hydrantPos[0], hydrantPos[1] + 0.75, hydrantPos[2]]}>
          <sphereGeometry args={[0.16, 8, 8]} />
          <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.6} />
        </mesh>
        <mesh position={[hydrantPos[0], hydrantPos[1] + 0.45, hydrantPos[2]]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 0.45, 8]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.9} />
        </mesh>

        {/* Waste & recycling bin */}
        <mesh position={[binPos[0], binPos[1] + 0.45, binPos[2]]}>
          <boxGeometry args={[0.5, 0.9, 0.5]} />
          <meshStandardMaterial color="#0284c7" metalness={0.5} roughness={0.5} />
        </mesh>
      </RigidBody>

      {/* Non-colliding decorative parts, kept in their own small groups so
          clicking anywhere on a lamp/tree/bus stop still opens its info card. */}
      {lampPositions.map((pos, idx) => (
        <group key={`lamp-visual-${idx}`} position={pos} userData={{ inspectData: lampData }} onClick={handleLampClick}>
          <mesh position={[pos[0] > worldX ? -0.4 : 0.4, 5.4, 0]} rotation={[0, 0, pos[0] > worldX ? 0.35 : -0.35]}>
            <cylinderGeometry args={[0.07, 0.07, 1.2, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} />
          </mesh>

          <mesh position={[pos[0] > worldX ? -0.8 : 0.8, 5.5, 0]}>
            <boxGeometry args={[0.5, 0.15, 0.3]} />
            <meshStandardMaterial
              color={isNight || isSunset ? '#fef08a' : '#e2e8f0'}
              emissive={isNight ? '#fef08a' : isSunset ? '#fdba74' : '#000000'}
              emissiveIntensity={isNight ? 3.0 : isSunset ? 1.5 : 0}
            />
          </mesh>

          {isActiveChunk && (isNight || isSunset) && idx < 4 && (
            <pointLight
              position={[pos[0] > worldX ? -0.8 : 0.8, 5.2, 0]}
              color={isNight ? '#fef08a' : '#fed7aa'}
              intensity={isNight ? 30 : 15}
              distance={25}
              decay={2}
            />
          )}
        </group>
      ))}

      <group position={busStopPos} userData={{ inspectData: busStopData }} onClick={handleBusStopClick}>
        <mesh position={[2.1, 1.4, 0]} userData={{ inspectData: busStopData }}>
          <boxGeometry args={[0.12, 2.2, 1.4]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive={isNight ? '#60a5fa' : '#ffffff'}
            emissiveIntensity={isNight ? 1.5 : 0.2}
          />
        </mesh>
      </group>

      {treePositions.map((pos, idx) => (
        <group key={`tree-visual-${idx}`} position={pos} userData={{ inspectData: treeData }} onClick={handleTreeClick}>
          <mesh position={[0, 4.0, 0]} castShadow userData={{ inspectData: treeData }}>
            <dodecahedronGeometry args={[1.8, 1]} />
            <meshStandardMaterial color={idx % 2 === 0 ? '#15803d' : '#166534'} roughness={0.8} />
          </mesh>
          <mesh position={[0, 5.1, 0]} castShadow userData={{ inspectData: treeData }}>
            <dodecahedronGeometry args={[1.3, 1]} />
            <meshStandardMaterial color="#22c55e" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
