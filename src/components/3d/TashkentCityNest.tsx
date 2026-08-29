import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

interface TashkentCityNestProps {
  position: [number, number, number];
  rotationY?: number;
}

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
const MODEL_PATH = `${BASE_URL}models/uzbek/tashkent_city_nest_one.glb`;

// "Fit within a box": scale the complex so it fits both a max height AND a max
// footprint (whichever binds), so an unknown-sized model never spills out of its
// 80 m plaza chunk. Tweak these to make it bigger/smaller.
const MAX_HEIGHT = 40;
const MAX_FOOTPRINT = 62;

/**
 * Showcase landmark: the Tashkent City "NEST One" residential complex, at the
 * centre of its own plaza chunk. Uses the robust monument pattern — fit-to-box
 * scale with non-finite guards, a cheap cuboid collider (never a convex hull,
 * which can crash Rapier on a detailed mesh), and grand night spotlighting.
 */
export const TashkentCityNest: React.FC<TashkentCityNestProps> = ({ position, rotationY = 0 }) => {
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);
  const timeOfDay = useWorldStore((s) => s.timeOfDay);

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  const { scene } = useGLTF(MODEL_PATH);

  const { modelGroup, colliderSize } = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Skip per-triangle raycasting on the detailed mesh; the proxy box below
        // handles crosshair hover/click instead.
        child.raycast = () => {};
      }
    });

    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Defensive: non-finite/degenerate bbox → NaN transforms → black screen.
    const rawHeight = Number.isFinite(size.y) && size.y > 0.001 ? size.y : 1;
    const rawFoot = Number.isFinite(Math.max(size.x, size.z)) ? Math.max(size.x, size.z, 0.001) : 1;
    let autoScale = Math.min(MAX_HEIGHT / rawHeight, MAX_FOOTPRINT / rawFoot);
    if (!Number.isFinite(autoScale) || autoScale <= 0) autoScale = 1;

    const safe = (v: number) => (Number.isFinite(v) ? v : 0);

    const group = new THREE.Group();
    cloned.position.set(
      safe(-center.x * autoScale),
      safe(-bbox.min.y * autoScale),
      safe(-center.z * autoScale)
    );
    cloned.scale.setScalar(autoScale);
    group.add(cloned);

    const footX = Number.isFinite(size.x) ? Math.max(size.x * autoScale, 1) : 8;
    const footZ = Number.isFinite(size.z) ? Math.max(size.z * autoScale, 1) : 8;
    const height = Number.isFinite(size.y) ? Math.max(size.y * autoScale, 1) : MAX_HEIGHT;

    return {
      modelGroup: group,
      colliderSize: [footX, height, footZ] as [number, number, number],
    };
  }, [scene]);

  const inspectData: InspectableObject = useMemo(() => ({
    id: `tashkent_city_nest_${position[0]}_${position[2]}`,
    title: "Tashkent City — NEST One (3D Model)",
    category: 'building',
    badge: "ZAMONAVIY TURAR-JOY",
    description: "Toshkent City xalqaro biznes markazidagi zamonaviy premium turar-joy majmuasi. Panoramali oynalar, yashil hovlilar va yuqori darajali infratuzilma bilan.",
    streetName: currentStreet?.name,
    details: [
      { label: "Majmua", value: "NEST One turar-joy majmuasi" },
      { label: "Hudud", value: "Tashkent City IBC" },
      { label: "Turi", value: "Ko'p qavatli premium apartamentlar" },
      { label: "Me'moriy uslub", value: "Zamonaviy shisha-panel arxitektura" },
      { label: "Holati", value: "Zamonaviy Toshkent ramzlaridan biri" },
    ],
  }), [position, currentStreet?.name]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Cheap cuboid physics body + crosshair proxy (never a convex hull —
          hull cooking can crash Rapier's WASM on a detailed complex mesh). */}
      <RigidBody type="fixed" colliders="cuboid">
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
      </RigidBody>

      {/* Detailed visual model — kept out of physics entirely. */}
      <primitive object={modelGroup} />

      {/* Architectural spotlighting at dusk/night. */}
      {(isNight || isSunset) && (
        <>
          <spotLight
            position={[0, 44, 26]}
            target-position={[0, 14, 0]}
            color={isNight ? '#e0f2fe' : '#fed7aa'}
            intensity={isNight ? 60 : 30}
            distance={70}
            angle={0.7}
            penumbra={0.5}
          />
          <pointLight
            position={[0, 30, 0]}
            color="#38bdf8"
            intensity={isNight ? 34 : 14}
            distance={40}
            decay={2}
          />
        </>
      )}
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
