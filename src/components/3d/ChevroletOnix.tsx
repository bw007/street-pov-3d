import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';
import { mergeByMaterial } from '../../utils/mergeByMaterial';

interface ChevroletOnixProps {
  position: [number, number, number];
  rotationY?: number;
}

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
const MODEL_PATH = `${BASE_URL}models/vehicles/chevrolet_onix_2024.glb`;

// Real Chevrolet Onix sedan is ~4.47 m long — auto-scale the imported model to
// that so it sits at a believable size next to the walking player.
const TARGET_LENGTH = 4.47;

/**
 * Showcase "hero" car placed on the spawn plaza (see StreetChunk chunk 0,0).
 *
 * Unlike the recolored traffic cars in VehicleMesh, this keeps the model's own
 * PBR paint / glass / chrome materials — it's a featured model, not background
 * traffic. It only enables shadows, skips per-triangle raycasting on the heavy
 * visual mesh, and delegates click/hover + physics to a cheap cuboid proxy.
 */
export const ChevroletOnix: React.FC<ChevroletOnixProps> = ({ position, rotationY = 0 }) => {
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);
  const timeOfDay = useWorldStore((s) => s.timeOfDay);

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  const { scene } = useGLTF(MODEL_PATH);

  const { modelGroup, colliderSize } = useMemo(() => {
    // Merge the raw import (442 sub-meshes / 1266 nodes) down to ~one mesh per
    // material: ~15 draw calls instead of 442, identical look. It's the showcase
    // hero (only one on screen), so it keeps its shadows.
    const cloned = mergeByMaterial(scene);

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // The crosshair raycaster tests the whole scene every frame; skip the
        // detailed car geometry and let the invisible collider box handle it.
        child.raycast = () => {};
      }
    });

    // Measure, then normalize to TARGET_LENGTH and drop the wheels onto Y=0.
    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    const rawLength = Math.max(size.x, size.z, 0.001);
    const autoScale = TARGET_LENGTH / rawLength;

    const group = new THREE.Group();
    cloned.position.set(
      -center.x * autoScale,
      -bbox.min.y * autoScale,
      -center.z * autoScale
    );
    cloned.scale.setScalar(autoScale);
    group.add(cloned);

    const actualHeight = size.y * autoScale;
    const actualWidth = Math.min(size.x, size.z) * autoScale;

    return {
      modelGroup: group,
      colliderSize: [actualWidth * 0.9, actualHeight, TARGET_LENGTH * 0.9] as [number, number, number],
    };
  }, [scene]);

  const inspectData: InspectableObject = useMemo(() => ({
    id: `chevrolet_onix_${position[0]}_${position[2]}`,
    title: 'Chevrolet Onix 2024 (3D Model)',
    category: 'vehicle',
    badge: "UZAUTO · 3D REAL MODEL",
    description: `${currentStreet?.name || "Markaziy maydon"}da namoyish etilgan UzAuto Motors ishlab chiqargan zamonaviy Chevrolet Onix sedani. Turbo dvigatel, LED optikasi va boy jihozlar bilan.`,
    streetName: currentStreet?.name,
    details: [
      { label: "Ishlab chiqaruvchi", value: "UzAuto Motors (Asaka, O'zbekiston)" },
      { label: "Kuzov", value: "Sedan (B-klass)" },
      { label: "Dvigatel", value: "1.2L Turbo, 3 silindr" },
      { label: "Quvvat", value: "~110 ot kuchi" },
      { label: "Uzatmalar qutisi", value: "6 pog'onali avtomat" },
      { label: "Uzunligi", value: "4.47 metr" },
    ],
  }), [position, currentStreet?.name]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Solid cuboid physics body — also the cheap raycast target for the
          crosshair (instead of the full car geometry). */}
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

      {/* Real 3D GLTF Chevrolet Onix (original materials preserved) */}
      <primitive object={modelGroup} />

      {/* Headlights at dusk/night, matching the traffic cars' look. */}
      {(isNight || isSunset) && (
        <>
          <spotLight
            position={[-0.7, 0.6, colliderSize[2] / 2 + 0.2]}
            target-position={[-0.7, 0, colliderSize[2] / 2 + 18]}
            angle={0.4}
            penumbra={0.4}
            color="#fef08a"
            intensity={isNight ? 30 : 16}
            distance={30}
            decay={2}
          />
          <spotLight
            position={[0.7, 0.6, colliderSize[2] / 2 + 0.2]}
            target-position={[0.7, 0, colliderSize[2] / 2 + 18]}
            angle={0.4}
            penumbra={0.4}
            color="#fef08a"
            intensity={isNight ? 30 : 16}
            distance={30}
            decay={2}
          />
        </>
      )}
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
