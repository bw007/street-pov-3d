import React, { useMemo } from 'react';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { CHUNK_SIZE } from '../../data/streetsData';
import { InspectableObject } from '../../types';
import { InstancedStreetTrees } from './InstancedStreetTrees';
import { StreetBench, BENCH_MODELS } from './StreetBench';

interface PropsMeshProps {
  chunkX: number;
  chunkZ: number;
  streetName?: string;
  isActiveChunk?: boolean;
  // Quadrant indices (0=+X+Z, 1=-X+Z, 2=+X-Z, 3=-X-Z) to keep clear of
  // lamps/trees/bollards/bus stop — used where a large showcase monument
  // occupies that quadrant and needs open plaza space instead of standard
  // street furniture crowding its base.
  excludeQuadrants?: number[];
}

function quadrantOf(dx: number, dz: number): number {
  return (dx >= 0 ? 0 : 1) + (dz >= 0 ? 0 : 2);
}

export const PropsMesh: React.FC<PropsMeshProps> = ({ chunkX, chunkZ, isActiveChunk = true, excludeQuadrants = [] }) => {
  const worldX = chunkX * CHUNK_SIZE;
  const worldZ = chunkZ * CHUNK_SIZE;
  const isExcluded = (pos: [number, number, number]) =>
    excludeQuadrants.includes(quadrantOf(pos[0] - worldX, pos[2] - worldZ));
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

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

  const benchData: InspectableObject = useMemo(() => ({
    id: `bench_${chunkX}_${chunkZ}`,
    title: "Zamonaviy Ko'cha O'rindig'i",
    category: 'infrastructure',
    badge: "SHAHAR JIHOZI",
    description: `${currentStreet?.name || "Markaziy ko'cha"} bo'yida piyodalar dam olishi uchun zamonaviy dizayndagi o'rindiq.`,
    streetName: currentStreet?.name,
    details: [
      { label: "Turi", value: "Ko'cha o'rindig'i (modern)" },
      { label: "Material", value: "Metall karkas + kompozit" },
      { label: "Joylashuvi", value: "Piyodalar yo'lkasi bo'yida" },
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

  // Elevated slim trees along sidewalk planter corners — a row along each
  // of the two sidewalks bordering every quadrant's building, at a few
  // depths per row, instead of just one tree per corner.
  const TREE_ROW_OFFSET = 11;
  const TREE_ROW_DEPTHS = [14, 26, 34];
  const treePositions: [number, number, number][] = [];
  ([-1, 1] as const).forEach((sx) => {
    ([-1, 1] as const).forEach((sz) => {
      TREE_ROW_DEPTHS.forEach((depth) => {
        // Row parallel to the N-S road
        treePositions.push([worldX + sx * TREE_ROW_OFFSET, 0, worldZ + sz * depth]);
        // Row parallel to the E-W road
        treePositions.push([worldX + sx * depth, 0, worldZ + sz * TREE_ROW_OFFSET]);
      });
    });
  });

  // Benches along both sidewalks, sitting parallel to the adjacent road.
  // `variant` mixes the two designs (0 = larger/more frequent, 1 = smaller):
  // every third bench is the small one, so ~2/3 are the big design.
  const BENCH_OFFSET = 9;
  const BENCH_ALONG = [-22, 22];
  const benches: { pos: [number, number, number]; rotationY: number; variant: number }[] = [];
  let benchIdx = 0;
  ([-1, 1] as const).forEach((s) => {
    BENCH_ALONG.forEach((along) => {
      // North–south sidewalk (x = ±offset): bench length runs along Z.
      benches.push({
        pos: [worldX + s * BENCH_OFFSET, 0, worldZ + along],
        rotationY: Math.PI / 2,
        variant: (benchIdx + chunkX + chunkZ) % 3 === 2 ? 1 : 0,
      });
      benchIdx++;
      // East–west sidewalk (z = ±offset): bench length runs along X.
      benches.push({
        pos: [worldX + along, 0, worldZ + s * BENCH_OFFSET],
        rotationY: 0,
        variant: (benchIdx + chunkX + chunkZ) % 3 === 2 ? 1 : 0,
      });
      benchIdx++;
    });
  });

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

  const hydrantPos: [number, number, number] = [worldX + 8.2, 0.16, worldZ - 14];
  const binPos: [number, number, number] = [worldX - 8.2, 0.16, worldZ + 14];

  // The two bus-stop shelters (see StreetChunk `busStops`). Keep benches clear of
  // them so a shelter never lands on top of a bench.
  const busStopSpots: [number, number][] = [
    [worldX - 8, worldZ + 24],
    [worldX + 24, worldZ + 8],
  ];
  const nearBusStop = (p: [number, number, number]) =>
    busStopSpots.some(([sx, sz]) => Math.hypot(p[0] - sx, p[2] - sz) < 5);

  const visibleLampPositions = lampPositions.filter((p) => !isExcluded(p));
  const visibleTreePositions = treePositions.filter((p) => !isExcluded(p));
  const visibleBenches = benches.filter((b) => !isExcluded(b.pos) && !nearBusStop(b.pos));
  const visibleBollardPositions = bollardPositions.filter((p) => !isExcluded(p));
  const showHydrant = !isExcluded(hydrantPos);
  const showBin = !isExcluded(binPos);

  const handleLampClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(lampData);
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
        {visibleLampPositions.map((pos, idx) => (
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

        {/* Tree trunks — a plain cylinder standing in for each tree's
            collider instead of letting Rapier derive one from the real GLTF
            foliage geometry (the trees render without their own physics below).
            With a couple dozen trees per chunk, deriving colliders from
            actual mesh geometry on every mount was the main source of the
            stutter when a new chunk streamed in. */}
        {visibleTreePositions.map((pos, idx) => (
          <mesh key={`tree-collider-${idx}`} visible={false} position={[pos[0], 1, pos[2]]}>
            <cylinderGeometry args={[0.25, 0.3, 2, 8]} />
          </mesh>
        ))}

        {/* Bench colliders — a cheap box per bench (StreetBench renders with
            physics={false} below), sized to its variant and rotated to match. */}
        {visibleBenches.map((b, idx) => (
          <mesh key={`bench-collider-${idx}`} visible={false} position={[b.pos[0], 0.45, b.pos[2]]} rotation={[0, b.rotationY, 0]}>
            <boxGeometry args={[BENCH_MODELS[b.variant].targetLength, 0.9, 0.6]} />
          </mesh>
        ))}


        {/* Sidewalk bollards */}
        {visibleBollardPositions.map((pos, idx) => (
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
        {showHydrant && (
          <>
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
          </>
        )}

        {/* Waste & recycling bin */}
        {showBin && (
          <mesh position={[binPos[0], binPos[1] + 0.45, binPos[2]]}>
            <boxGeometry args={[0.5, 0.9, 0.5]} />
            <meshStandardMaterial color="#0284c7" metalness={0.5} roughness={0.5} />
          </mesh>
        )}
      </RigidBody>

      {/* Non-colliding decorative parts, kept in their own small groups so
          clicking anywhere on a lamp/tree/bus stop still opens its info card. */}
      {visibleLampPositions.map((pos, idx) => (
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


      {/* All of this chunk's street trees as ~2 instanced draw calls (see
          InstancedStreetTrees) instead of 24 separate GLB clones (~48 draw
          calls). Their colliders stay in the shared RigidBody above. */}
      <InstancedStreetTrees positions={visibleTreePositions} inspectData={treeData} />

      {visibleBenches.map((b, idx) => (
        <StreetBench
          key={`bench-${idx}`}
          position={b.pos}
          rotationY={b.rotationY}
          variant={b.variant}
          inspectData={benchData}
          physics={false}
        />
      ))}
    </group>
  );
};
