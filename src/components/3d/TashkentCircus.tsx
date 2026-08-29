import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

interface TashkentCircusProps {
  position: [number, number, number];
  rotationY?: number;
}

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
const MODEL_PATH = `${BASE_URL}models/uzbek/tashkent_sirk.glb`;

// The Tashkent Circus is a wide domed rotunda — scale it to a ~20 m tall dome;
// its footprint follows the model's own proportions and stays inside the 80 m
// plaza chunk.
const TARGET_HEIGHT = 20.0;

/**
 * Showcase landmark: the Tashkent State Circus, placed at the centre of its own
 * plaza chunk (see StreetChunk). Mirrors the other monument components — scale
 * by height, drop onto Y=0, cheap hull collider + proxy box for inspection,
 * and grand spotlighting at dusk/night.
 */
export const TashkentCircus: React.FC<TashkentCircusProps> = ({ position, rotationY = 0 }) => {
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

    // Defensive: a model with empty/degenerate geometry yields non-finite bbox
    // values, which become NaN transforms and render as a black screen. Fall
    // back to a neutral scale/position if anything isn't finite.
    const rawHeight = Number.isFinite(size.y) && size.y > 0.001 ? size.y : 1;
    let autoScale = TARGET_HEIGHT / rawHeight;
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

    return {
      modelGroup: group,
      colliderSize: [footX, TARGET_HEIGHT, footZ] as [number, number, number],
    };
  }, [scene]);

  const inspectData: InspectableObject = useMemo(() => ({
    id: `tashkent_circus_${position[0]}_${position[2]}`,
    title: "Toshkent Davlat Sirki (3D Model)",
    category: 'landmark',
    badge: "MADANIY YODGORLIK",
    description: "O'zbekistonning bosh sirki — dumaloq gumbazli me'moriy yodgorlik. Akrobatlar, hajviychilar va milliy dorbozlik tomoshalari maskani.",
    streetName: currentStreet?.name,
    details: [
      { label: "Bino turi", value: "Davlat sirki (rotonda gumbaz)" },
      { label: "Ochilgan yili", value: "1976-yil" },
      { label: "O'rindiqlar", value: "~3000 tomoshabin" },
      { label: "Me'moriy uslub", value: "Sovet modernizmi + milliy naqsh" },
      { label: "Joylashuvi", value: "Toshkent, Xadra maydoni" },
    ],
  }), [position, currentStreet?.name]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Cheap cuboid physics body + crosshair proxy. A convex-hull collider
          (one hull per mesh) can be very slow to cook — or crash Rapier's WASM —
          on a detailed/degenerate landmark mesh, which is a likely cause of the
          black screen when the player reaches the circus. A single box is robust
          and enough to stop the player walking through it. */}
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

      {/* Grand architectural spotlighting at dusk/night. */}
      {(isNight || isSunset) && (
        <>
          <spotLight
            position={[0, 24, 18]}
            target-position={[0, 8, 0]}
            color={isNight ? '#ffffff' : '#fed7aa'}
            intensity={isNight ? 55 : 28}
            distance={50}
            angle={0.7}
            penumbra={0.5}
          />
          <pointLight
            position={[0, 18, 0]}
            color="#f472b6"
            intensity={isNight ? 34 : 14}
            distance={30}
            decay={2}
          />
        </>
      )}
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
