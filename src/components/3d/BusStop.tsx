import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
const MODEL_PATH = `${BASE_URL}models/props/bus_stop.glb`;

// Auto-scale the shelter to a realistic height.
const TARGET_HEIGHT = 3.0;

interface BusStopProps {
  /** Curb position of the shelter. */
  position: [number, number, number];
  /** Rotate so the open front faces the road. */
  rotationY?: number;
}

/**
 * Roadside bus-stop shelter (real GLB model). Buses (see VehicleMesh) pull up to
 * the matching stop coordinate and dwell here. Same load pattern as StreetBench.
 */
export const BusStop: React.FC<BusStopProps> = ({ position, rotationY = 0 }) => {
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);
  const { scene } = useGLTF(MODEL_PATH);

  const { modelGroup, colliderSize } = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((c) => {
      if (c instanceof THREE.Mesh) {
        c.castShadow = true;
        c.receiveShadow = true;
        c.raycast = () => {};
      }
    });

    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    const rawH = Number.isFinite(size.y) && size.y > 0.001 ? size.y : 1;
    let s = TARGET_HEIGHT / rawH;
    if (!Number.isFinite(s) || s <= 0) s = 1;
    const safe = (v: number) => (Number.isFinite(v) ? v : 0);

    cloned.position.set(safe(-center.x * s), safe(-bbox.min.y * s), safe(-center.z * s));
    cloned.scale.setScalar(s);
    const g = new THREE.Group();
    g.add(cloned);

    return {
      modelGroup: g,
      colliderSize: [
        Math.max(size.x * s, 0.5),
        Math.max(size.y * s, 0.5),
        Math.max(size.z * s, 0.5),
      ] as [number, number, number],
    };
  }, [scene]);

  const inspectData: InspectableObject = useMemo(() => ({
    id: `busstop_${position[0].toFixed(0)}_${position[2].toFixed(0)}`,
    title: "Avtobus Bekati",
    category: 'infrastructure',
    badge: "JAMOAT TRANSPORTI",
    description: `${currentStreet?.name || "Markaziy ko'cha"} bo'yidagi avtobus bekati. Shahar avtobuslari shu yerda to'xtab yo'lovchilarni oladi.`,
    streetName: currentStreet?.name,
    details: [
      { label: "Turi", value: "Shahar avtobus bekati" },
      { label: "Xizmat", value: "Jamoat transporti (muntazam qatnov)" },
    ],
  }), [position, currentStreet?.name]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[colliderSize[0] / 2, colliderSize[1] / 2, colliderSize[2] / 2]} position={[0, colliderSize[1] / 2, 0]} />
        <primitive object={modelGroup} />
      </RigidBody>

      <mesh
        visible={false}
        position={[0, colliderSize[1] / 2, 0]}
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
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
