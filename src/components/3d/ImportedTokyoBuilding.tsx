import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

interface TokyoBuildingProps {
  position: [number, number, number];
  rotationY?: number;
}

const BASE = import.meta.env?.BASE_URL || './';
const MODEL_PATH = `${BASE.endsWith('/') ? BASE : BASE + '/'}models/building_interior/littlest_tokyo.glb`;

// Merge every sub-mesh's vertex positions (in the model's fitted local frame)
// into ONE position-only geometry, so a single Rapier convex hull can replace the
// 71 hulls react-three-rapier would auto-derive. The GLB is split per-material, so
// 11 of those 71 meshes each span the WHOLE model — 11 redundant, model-sized
// convex hulls that are slow to cook and (per CLAUDE.md) a Rapier-WASM crash risk.
// A hull only needs positions, so materials/normals/uvs are dropped. Draco decodes
// to Float32, so no de-quantisation is needed here.
function buildCollisionGeometry(root: THREE.Object3D): THREE.BufferGeometry | null {
  try {
    root.updateWorldMatrix(true, true);
    const parts: Float32Array[] = [];
    const v = new THREE.Vector3();
    root.traverse((c) => {
      if (!(c instanceof THREE.Mesh)) return;
      const pos = c.geometry.getAttribute('position');
      if (!pos) return;
      const out = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(c.matrixWorld);
        out[i * 3] = v.x;
        out[i * 3 + 1] = v.y;
        out[i * 3 + 2] = v.z;
      }
      parts.push(out);
    });
    if (parts.length === 0) return null;
    let total = 0;
    for (const p of parts) total += p.length;
    const all = new Float32Array(total);
    let off = 0;
    for (const p of parts) {
      all.set(p, off);
      off += p.length;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(all, 3));
    return geo;
  } catch {
    return null;
  }
}

export const ImportedTokyoBuilding: React.FC<TokyoBuildingProps> = ({
  position,
  rotationY = 0,
}) => {
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);

  // Load the Tokyo 3D Model with dynamic base URL support
  const { scene } = useGLTF(MODEL_PATH);

  // Compute exact bounding box and scale to realistic multi-story architectural proportions
  const { modelGroup, collisionGeo, proxySize } = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Skip per-triangle raycasting on the ~142,000-tri visual mesh; a
        // cheap proxy box (below) handles click/hover detection instead.
        child.raycast = () => {};
      }
    });

    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Target Height: 15 meters
    const TARGET_HEIGHT = 15.0;
    const rawHeight = size.y > 0.001 ? size.y : 1;
    const autoScale = TARGET_HEIGHT / rawHeight;

    const group = new THREE.Group();
    // Center model squarely and place base at Y=0
    cloned.position.set(
      -center.x * autoScale,
      -bbox.min.y * autoScale,
      -center.z * autoScale
    );
    cloned.scale.set(autoScale, autoScale, autoScale);
    group.add(cloned);

    // One merged convex hull from all geometry (see buildCollisionGeometry) —
    // replaces the 71 auto-derived hulls. Built in the same fitted frame as the
    // visual, so the invisible collision mesh lines up with what's drawn.
    const collisionGeo = buildCollisionGeometry(cloned);

    return {
      modelGroup: group,
      collisionGeo,
      proxySize: [size.x * autoScale, TARGET_HEIGHT, size.z * autoScale] as [number, number, number],
    };
  }, [scene]);

  const inspectData: InspectableObject = useMemo(() => ({
    id: 'imported_tokyo_complex',
    title: "Tokio Me'moriy Majmuasi (Littlest Tokyo)",
    category: 'building',
    badge: "3D ARXITEKTURA MODELI",
    description: `${currentStreet?.name || "Markaziy ko'cha"} chorrahasida joylashgan, zinapoyalari, terrasalari, do'konlari va platformalariga piyoda ko'tarilish mumkin bo'lgan me'moriy shahar majmuasi.`,
    streetName: currentStreet?.name,
    details: [
      { label: "Manba", value: "Three.js Showcase (Littlest Tokyo)" },
      { label: "Balandligi", value: "15 metr (Ko'p qavatli)" },
      { label: "Zinapoya", value: "Piyoda chiqish va tushish to'liq silliq" },
      { label: "Xususiyati", value: "Do'konlar, kafelar, poyezd yo'lagi" },
      { label: "Holati", value: "Faol" },
    ],
  }), [currentStreet?.name]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/*
        Collision: ONE convex hull merged from ALL of the model's geometry
        instead of letting Rapier auto-derive 71 separate hulls. The GLB is split
        per-material, so 11 of those 71 meshes span the ENTIRE model — 11
        redundant, model-sized hulls, slow to cook and a Rapier-WASM crash risk
        (see CLAUDE.md). One merged hull is the same convex shape at a fraction of
        the cost. The 2 stair-ramp colliders below are unchanged. Falls back to
        the old per-mesh auto-hull if the merge ever fails.
        NOTE: this is behaviour-*approximating* — re-check that climbing the ramps
        onto the roof still feels right; if not, `git checkout` this file.
      */}
      {collisionGeo ? (
        <>
          <RigidBody type="fixed" colliders="hull">
            <mesh geometry={collisionGeo} visible={false}>
              <meshBasicMaterial />
            </mesh>
          </RigidBody>
          <primitive object={modelGroup} />
        </>
      ) : (
        <RigidBody type="fixed" colliders="hull">
          <primitive object={modelGroup} />
        </RigidBody>
      )}

      {/* Cheap invisible box standing in for the detailed visual mesh so the
          crosshair raycaster can detect hover/click without walking the full
          geometry every frame. */}
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

      {/* 
        Smooth Stair Ramps for effortless ascending and descending 
        without step catching
      */}
      <RigidBody type="fixed" colliders="cuboid" position={[1.5, 1.8, 4.2]} rotation={[-0.55, 0, 0]}>
        <mesh visible={false}>
          <boxGeometry args={[2.2, 0.2, 5.0]} />
        </mesh>
      </RigidBody>

      <RigidBody type="fixed" colliders="cuboid" position={[-3.2, 3.2, 1.0]} rotation={[0, 0, 0.55]}>
        <mesh visible={false}>
          <boxGeometry args={[5.0, 0.2, 2.2]} />
        </mesh>
      </RigidBody>
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
