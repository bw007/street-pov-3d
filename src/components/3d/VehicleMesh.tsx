import React, { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';
import { CHUNK_SIZE } from '../../data/streetsData';
import { getIntersectionSignal, groupForAxis } from '../../utils/trafficSignal';
import { mergeByMaterial } from '../../utils/mergeByMaterial';

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
  // Cobalt, K5 and Gentra are modelled facing the opposite way, so they get a
  // Math.PI heading flip; Spark already faces forward.
  { path: `${BASE_URL}models/vehicles/chevrolet_cobalt_ltz.glb`, name: 'Chevrolet Cobalt LTZ', badge: 'UZAUTO SEDAN',    length: 4.48, forwardOffset: Math.PI },
  { path: `${BASE_URL}models/vehicles/kia_k5_2025.glb`,          name: 'Kia K5 (2025)',        badge: 'BIZNES SEDAN',    length: 4.91, forwardOffset: Math.PI },
  { path: `${BASE_URL}models/vehicles/gentra.glb`,               name: 'Chevrolet Gentra',     badge: 'UZAUTO SEDAN',    length: 4.48, forwardOffset: Math.PI },
  { path: `${BASE_URL}models/vehicles/spark.glb`,                name: 'Chevrolet Spark',      badge: 'SHAHAR XETCHBEK', length: 3.64, forwardOffset: 0 },
];

// Public transport: a proper city bus that runs in the traffic (obeys signals,
// stops at red like everything else).
const BUS_MODEL: CarModel = {
  path: `${BASE_URL}models/vehicles/bus_maz_203.glb`, name: 'MAZ 203 Avtobusi', badge: 'JAMOAT TRANSPORTI', length: 12.0, forwardOffset: Math.PI,
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
  /** Shared per-intersection signal phase (must match this chunk's lights). */
  signalPhase: number;
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
  startPos, axis, dir, speed, axisCenter, signalPhase, variant, isBus = false, isActiveChunk = true,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  const model = isBus
    ? BUS_MODEL
    : CAR_MODELS[((variant % CAR_MODELS.length) + CAR_MODELS.length) % CAR_MODELS.length];
  const { scene } = useGLTF(model.path);

  const { modelGroup, colliderSize } = useMemo(() => {
    // Merge the raw Sketchfab car (62–155 sub-meshes) down to ~one mesh per
    // material — same look, ~10 draw calls instead of 155. Behaviour-preserving;
    // <SafeModel> still guards it if a model ever fails to merge.
    const cloned = mergeByMaterial(scene);
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Small, fast-moving background traffic: skip the shadow-CASTING pass
        // (it only runs at sunset) to save the shadow-map redraw with ~30-50
        // cars on screen. Still RECEIVES shadows so it stays visually grounded.
        child.castShadow = false;
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

  // Lane geometry — the car loops within chunk centre ± 40 m, but obeys the
  // signal with realistic acceleration/braking: it eases to a stop at the line on
  // red/amber and pulls away smoothly on green.
  const half = CHUNK_SIZE / 2;
  const min = axisCenter - half;
  const startCoord = axis === 'z' ? startPos[2] : startPos[0];
  const perp = axis === 'z' ? startPos[0] : startPos[2];
  const y = startPos[1];
  const coordRef = useRef(startCoord);
  const velRef = useRef(speed);
  const dwellRef = useRef(0);          // remaining bus dwell time (s)
  const busServicedRef = useRef(false); // has this bus already stopped at its stop this loop
  const group = groupForAxis(axis);
  const BUS_STOP_OFFSET = 24;  // metres past the centre where the bus stop sits
  const BUS_DWELL = 2.5;       // seconds a bus waits at the stop
  const busStopCoord = axisCenter + dir * BUS_STOP_OFFSET;
  const STOP_LINE_DIST = 11.5; // drawn stop line, just before the crosswalk (±9)
  const ACCEL = 3.0;           // m/s² — how briskly it pulls away on green
  const BRAKE = 6;             // m/s² — max deceleration
  const APPROACH_DECEL = 2.2;  // m/s² — gentle planning decel (starts braking early)
  // Stop so the car's FRONT (not its centre) reaches the line — so long cars and
  // the truck also halt short of the zebra.
  const halfLen = colliderSize[2] / 2;
  const stopLine = axisCenter - dir * (STOP_LINE_DIST + halfLen);

  useFrame((state, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05); // clamp long frame gaps (backgrounded tab)
    const color = getIntersectionSignal(state.clock.elapsedTime, signalPhase)[group];
    const braking = color === 'red' || color === 'amber';

    let coord = coordRef.current;
    const distToStop = dir * (stopLine - coord); // > 0 → stop line still ahead

    // Target speed: full, unless we must brake to stop by the line.
    let target = speed;
    if (braking && distToStop > -0.1) {
      const d = Math.max(0, distToStop);
      target = Math.min(speed, Math.sqrt(2 * APPROACH_DECEL * d)); // ease down early
      if (d < 0.5) target = 0;
    }

    // Bus service: a bus also eases to a halt at its stop (past the junction) and
    // dwells there for a few seconds before pulling away.
    if (isBus) {
      const distBus = dir * (busStopCoord - coord); // > 0 → stop still ahead
      if (dwellRef.current > 0) {
        dwellRef.current -= dt;
        target = 0;
      } else if (!busServicedRef.current && distBus > 0.05 && distBus < half) {
        target = Math.min(target, Math.sqrt(2 * APPROACH_DECEL * distBus));
        if (distBus < 0.6) {
          dwellRef.current = BUS_DWELL;
          busServicedRef.current = true;
        }
      }
      if (distBus < -1.5) busServicedRef.current = false; // re-arm after leaving
    }

    // Ease the actual speed toward the target (smooth accel / decel).
    let vel = velRef.current;
    vel = vel < target ? Math.min(target, vel + ACCEL * dt) : Math.max(target, vel - BRAKE * dt);

    coord += dir * vel * dt;

    // Never roll past the stop line while red/amber — pin exactly to it.
    if (braking && distToStop >= -0.1 && dir * (stopLine - coord) < 0) {
      coord = stopLine;
      vel = 0;
    }
    velRef.current = vel;

    const rel = (((coord - min) % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    coord = min + rel;
    coordRef.current = coord;
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
