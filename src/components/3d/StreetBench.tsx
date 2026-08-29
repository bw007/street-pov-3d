import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';

interface BenchModel {
  path: string;
  /** Real length (m) — the model auto-scales to this. */
  targetLength: number;
}

// Two roadside bench designs. Index 0 is the LARGER one (and PropsMesh places it
// more often). If it turns out modern_bench_2 is actually the bigger design,
// just swap the two entries below — index 0 stays "the big, frequent one".
export const BENCH_MODELS: BenchModel[] = [
  { path: `${BASE_URL}models/props/modern_bench_1.glb`, targetLength: 2.1 },
  { path: `${BASE_URL}models/props/modern_bench_2.glb`, targetLength: 1.6 },
];

interface StreetBenchProps {
  position: [number, number, number];
  rotationY: number;
  variant: number;
  inspectData: InspectableObject;
  /** When false, PropsMesh provides a shared cheap collider instead. */
  physics?: boolean;
}

/**
 * A roadside bench. Auto-scales the model to its variant's real length, drops it
 * onto Y=0, and normalizes so its LENGTH runs along local +X (PropsMesh rotates
 * it to sit parallel to whichever sidewalk it's on). Same pattern as StreetTree.
 */
export const StreetBench: React.FC<StreetBenchProps> = ({ position, rotationY, variant, inspectData, physics = false }) => {
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const model = BENCH_MODELS[((variant % BENCH_MODELS.length) + BENCH_MODELS.length) % BENCH_MODELS.length];
  const { scene } = useGLTF(model.path);

  const { modelGroup, proxySize } = useMemo(() => {
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

    const rawLength = Math.max(size.x, size.z, 0.001);
    let autoScale = model.targetLength / rawLength;
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
    // Normalize so the bench LENGTH runs along local +X.
    if (size.z > size.x) group.rotation.y = Math.PI / 2;

    const width = Math.min(size.x, size.z) * autoScale;
    const height = size.y * autoScale;
    return {
      modelGroup: group,
      proxySize: [model.targetLength, Math.max(height, 0.4), Math.max(width, 0.4)] as [number, number, number],
    };
  }, [scene, model]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {physics ? (
        <RigidBody type="fixed" colliders="cuboid">
          <primitive object={modelGroup} />
        </RigidBody>
      ) : (
        <primitive object={modelGroup} />
      )}

      {/* Cheap invisible proxy for the crosshair inspector. */}
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

BENCH_MODELS.forEach((m) => useGLTF.preload(m.path));
