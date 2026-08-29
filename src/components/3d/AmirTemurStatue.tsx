import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

interface AmirTemurStatueProps {
  position: [number, number, number];
  rotationY?: number;
}

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
const MODEL_PATH = `${BASE_URL}models/uzbek/amir_temur_statue.glb`;

// Equestrian statue + stone pedestal — target the whole thing at ~12 m tall.
const TARGET_HEIGHT = 12.0;

/**
 * The Amir Temur equestrian statue — centrepiece of Amir Temur Square. Robust
 * showcase pattern: height-normalised with non-finite guards, a cheap cuboid
 * collider (never a convex hull), and grand night spotlighting.
 */
export const AmirTemurStatue: React.FC<AmirTemurStatueProps> = ({ position, rotationY = 0 }) => {
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
        child.raycast = () => {};
      }
    });

    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    const rawHeight = Number.isFinite(size.y) && size.y > 0.001 ? size.y : 1;
    let autoScale = TARGET_HEIGHT / rawHeight;
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

    const footX = Number.isFinite(size.x) ? Math.max(size.x * autoScale, 1) : 4;
    const footZ = Number.isFinite(size.z) ? Math.max(size.z * autoScale, 1) : 4;
    return {
      modelGroup: group,
      colliderSize: [footX * 0.7, TARGET_HEIGHT, footZ * 0.7] as [number, number, number],
    };
  }, [scene]);

  const inspectData: InspectableObject = useMemo(() => ({
    id: `amir_temur_${position[0]}_${position[2]}`,
    title: "Amir Temur Haykali (Toshkent)",
    category: 'landmark',
    badge: "MILLIY YODGORLIK",
    description: "Sohibqiron Amir Temurning otliq haykali — Amir Temur xiyobonining markazi. Poydevorда \"Kuch — adolatda\" shiori bitilgan.",
    streetName: currentStreet?.name,
    details: [
      { label: "Kimga", value: "Sohibqiron Amir Temur" },
      { label: "O'rnatilgan", value: "1994-yil" },
      { label: "Turi", value: "Bronza otliq haykal" },
      { label: "Shiori", value: "Kuch — adolatda" },
      { label: "Joylashuvi", value: "Amir Temur xiyoboni, Toshkent" },
    ],
  }), [position, currentStreet?.name]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
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

      <primitive object={modelGroup} />

      {(isNight || isSunset) && (
        <>
          <spotLight
            position={[0, 20, 14]}
            target-position={[0, 8, 0]}
            color={isNight ? '#ffffff' : '#fed7aa'}
            intensity={isNight ? 55 : 28}
            distance={45}
            angle={0.6}
            penumbra={0.5}
          />
          <pointLight position={[0, 14, 0]} color="#fcd34d" intensity={isNight ? 26 : 10} distance={26} decay={2} />
        </>
      )}
    </group>
  );
};

// NOT preloaded — this model is large (~54 MB raw). It streams in per-chunk via
// the <SafeModel> wrapper so it doesn't block the initial loading screen.
