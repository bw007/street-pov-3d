import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

interface StreetTreeProps {
  position: [number, number, number];
  inspectData: InspectableObject;
  // When false, skip this tree's own RigidBody (Rapier has to walk real mesh
  // geometry to derive its cuboid colliders, which adds up once a chunk has
  // a couple dozen trees mounting at once — see the stutter this caused in
  // PropsMesh.tsx). The caller is then responsible for its own, cheaper
  // trunk collider.
  physics?: boolean;
}

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
const MODEL_PATH = `${BASE_URL}models/props/street_tree.glb`;

// Real-world scanned/authored trees rarely come in at the scale a scene
// expects (this one is ~17.9m tall as exported) — auto-scaling from the
// model's own bounding box to a fixed target height, the same approach used
// for the vehicles and monument buildings, means it always comes out
// correctly sized regardless of the source file's native units.
const TARGET_HEIGHT = 5.5;

export const StreetTree: React.FC<StreetTreeProps> = ({ position, inspectData, physics = true }) => {
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const { scene } = useGLTF(MODEL_PATH);

  const { modelGroup, proxySize } = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Crosshair raycasting walks the whole scene every frame; skip the
        // detailed foliage geometry and rely on the cheap proxy box below.
        child.raycast = () => {};
      }
    });

    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    const rawHeight = size.y > 0.001 ? size.y : 1;
    const autoScale = TARGET_HEIGHT / rawHeight;

    const group = new THREE.Group();
    cloned.position.set(
      -center.x * autoScale,
      -bbox.min.y * autoScale,
      -center.z * autoScale
    );
    cloned.scale.set(autoScale, autoScale, autoScale);
    group.add(cloned);

    return {
      modelGroup: group,
      proxySize: [size.x * autoScale, TARGET_HEIGHT, size.z * autoScale] as [number, number, number],
    };
  }, [scene]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <group position={position}>
      {physics ? (
        <RigidBody type="fixed" colliders="cuboid">
          <primitive object={modelGroup} />
        </RigidBody>
      ) : (
        <primitive object={modelGroup} />
      )}

      {/* Cheap invisible proxy for click/hover detection instead of raycasting
          the full foliage mesh every frame. */}
      <mesh
        visible={false}
        position={[0, proxySize[1] / 2, 0]}
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
        <boxGeometry args={proxySize} />
      </mesh>
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
