import React, { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';
import { CHUNK_SIZE } from '../../data/streetsData';

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';

interface CarModel {
  path: string;
  name: string;
  badge: string;
  /** Real length (m) — the model auto-scales to this. */
  length: number;
  /** Radians. Add Math.PI here if a model turns out to face backwards. */
  forwardOffset: number;
}

// Real traffic car variants, spread across every street for variety.
export const CAR_MODELS: CarModel[] = [
  { path: `${BASE_URL}models/vehicles/chevrolet_cobalt_ltz.glb`, name: 'Chevrolet Cobalt LTZ', badge: 'UZAUTO SEDAN',    length: 4.48, forwardOffset: 0 },
  { path: `${BASE_URL}models/vehicles/kia_k5_2025.glb`,          name: 'Kia K5 (2025)',        badge: 'BIZNES SEDAN',    length: 4.91, forwardOffset: 0 },
  { path: `${BASE_URL}models/vehicles/gentra.glb`,               name: 'Chevrolet Gentra',     badge: 'UZAUTO SEDAN',    length: 4.48, forwardOffset: 0 },
  { path: `${BASE_URL}models/vehicles/spark.glb`,                name: 'Chevrolet Spark',      badge: 'SHAHAR XETCHBEK', length: 3.64, forwardOffset: 0 },
];

const TRUCK_MODEL: CarModel = {
  path: `${BASE_URL}models/vehicles/truck.glb`, name: 'Yuk avtomobili', badge: 'MAXSUS TRANSPORT', length: 7.5, forwardOffset: 0,
};

interface VehicleProps {
  /** Spawn position along the lane; also the fixed perpendicular (lane) offset. */
  startPos: [number, number, number];
  /** Axis the car drives along. */
  axis: 'x' | 'z';
  /** Travel direction along that axis. */
  dir: 1 | -1;
  /** Metres per second. */
  speed: number;
  /** Chunk centre coordinate along `axis` — the car loops within centre ± 40 m. */
  axisCenter: number;
  /** Index into CAR_MODELS (ignored when isBus). */
  variant: number;
  isBus?: boolean;
  isActiveChunk?: boolean;
}

/**
 * A moving traffic vehicle. Drives along its lane at a slow, constant speed and
 * loops within its chunk. Pure visual (no physics collider) so it moves smoothly
 * and never shoves the walking player; the crosshair inspector still works via an
 * invisible proxy box. Keeps each model's original PBR materials.
 */
export const VehicleMesh: React.FC<VehicleProps> = ({
  startPos, axis, dir, speed, axisCenter, variant, isBus = false, isActiveChunk = true,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  const model = isBus
    ? TRUCK_MODEL
    : CAR_MODELS[((variant % CAR_MODELS.length) + CAR_MODELS.length) % CAR_MODELS.length];
  const { scene } = useGLTF(model.path);

  const { modelGroup, colliderSize } = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.raycast = () => {}; // let the invisible proxy handle the crosshair
      }
    });

    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    const rawLength = Math.max(size.x, size.z, 0.001);
    let autoScale = model.length / rawLength;
    if (!Number.isFinite(autoScale) || autoScale <= 0) autoScale = 1;
    const safe = (v: number) => (Number.isFinite(v) ? v : 0);

    cloned.position.set(
      safe(-center.x * autoScale),
      safe(-bbox.min.y * autoScale),
      safe(-center.z * autoScale)
    );
    cloned.scale.setScalar(autoScale);

    const group = new THREE.Group();
    group.add(cloned);
    // Normalize so the car's LENGTH runs along local +Z — otherwise a model
    // authored along X would drive sideways.
    if (size.x > size.z) group.rotation.y = Math.PI / 2;
    group.rotation.y += model.forwardOffset;

    const width = Math.min(size.x, size.z) * autoScale;
    const height = size.y * autoScale;
    return {
      modelGroup: group,
      colliderSize: [
        Math.max(width * 0.9, 0.6),
        Math.max(height, 0.6),
        Math.max(model.length * 0.9, 0.6),
      ] as [number, number, number],
    };
  }, [scene, model]);

  // Face travel direction: orient the normalized local +Z (car length) along it.
  const heading = axis === 'z'
    ? (dir > 0 ? 0 : Math.PI)
    : (dir > 0 ? Math.PI / 2 : -Math.PI / 2);

  // Constant lane geometry (loop the coordinate within chunk centre ± 40 m).
  const half = CHUNK_SIZE / 2;
  const min = axisCenter - half;
  const startCoord = axis === 'z' ? startPos[2] : startPos[0];
  const perp = axis === 'z' ? startPos[0] : startPos[2];
  const y = startPos[1];
  const base = startCoord - min;

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const coord = min + ((((base + speed * dir * t) % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE);
    if (axis === 'z') g.position.set(perp, y, coord);
    else g.position.set(coord, y, perp);
  });

  const inspectData: InspectableObject = useMemo(() => ({
    id: `veh_${startPos[0].toFixed(1)}_${startPos[2].toFixed(1)}_${axis}${dir}`,
    title: `${model.name} (3D Model)`,
    category: 'vehicle',
    badge: model.badge,
    description: `${currentStreet?.name || "Markaziy ko'cha"} bo'ylab harakatlanayotgan zamonaviy ${model.name}.`,
    streetName: currentStreet?.name,
    details: [
      { label: 'Model', value: model.name },
      { label: 'Uzunligi', value: `${model.length.toFixed(2)} m` },
      { label: 'Holati', value: 'Harakatda' },
    ],
  }), [model, startPos, axis, dir, currentStreet?.name]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <group ref={groupRef} position={startPos} rotation={[0, heading, 0]}>
      {/* Invisible proxy for the crosshair inspector (the detailed car mesh has
          raycasting disabled). No physics collider — smooth, player-safe traffic. */}
      <mesh
        position={[0, colliderSize[1] / 2, 0]}
        visible={false}
        userData={{ inspectData }}
        onClick={handleInspect}
        onPointerOver={(e: { stopPropagation: () => void }) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={colliderSize} />
      </mesh>

      {/* Real 3D GLTF vehicle (original materials preserved). */}
      <primitive object={modelGroup} />

      {/* Headlights at dusk/night (front is local +Z). */}
      {isActiveChunk && (isNight || isSunset) && (
        <>
          <spotLight
            position={[-0.6, 0.6, colliderSize[2] / 2 + 0.2]}
            target-position={[-0.6, 0, colliderSize[2] / 2 + 16]}
            angle={0.4}
            penumbra={0.4}
            color="#fef08a"
            intensity={isNight ? 28 : 14}
            distance={26}
            decay={2}
          />
          <spotLight
            position={[0.6, 0.6, colliderSize[2] / 2 + 0.2]}
            target-position={[0.6, 0, colliderSize[2] / 2 + 16]}
            angle={0.4}
            penumbra={0.4}
            color="#fef08a"
            intensity={isNight ? 28 : 14}
            distance={26}
            decay={2}
          />
          <pointLight
            position={[0, 0.6, -colliderSize[2] / 2 - 0.2]}
            color="#ef4444"
            intensity={isNight ? 10 : 4}
            distance={9}
            decay={2}
          />
        </>
      )}
    </group>
  );
};

// NOTE: intentionally NOT preloaded. These car models are large (15–31 MB);
// preloading them would block the initial loading screen on ~90 MB of traffic.
// They stream in per-chunk instead — the <SafeModel> wrapper's local Suspense
// keeps the scene rendering (cars just pop in) while each one loads.
