import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
const MODEL_PATH = `${BASE_URL}models/aircraft/uzbekistan_airways.glb`;

// Fuselage length the model is normalised to, in world units (before the
// per-plane group scale applied in SkyElements). The GLB's nose already points
// +Z — matching the flight animation — so no yaw offset is needed here.
const TARGET_LENGTH = 12;

/**
 * The Uzbekistan Airways plane, normalised to a fixed size and centred on the
 * origin so SkyElements can position/rotate/scale it freely. Purely decorative:
 * no physics, no shadows, no raycasting (it's small and far up in the sky, and
 * several copies fly at once, so it must stay cheap). Geometry is shared across
 * instances via clone(), and the heavy source mesh is merged down by the asset
 * optimizer (see the override in optimize-models.config.mjs).
 */
export const PlaneModel: React.FC = () => {
  const { scene } = useGLTF(MODEL_PATH);

  const model = useMemo(() => {
    const cloned = scene.clone(true);

    // The scene has no directional sun (removed) and no environment map, so a PBR
    // plane renders as a dark grey blob against the bright sky. Clamp metalness AND
    // add a gentle emissive floor so it always reads as a light aircraft, never a
    // dark blob. Materials are shared across clones, so this applies once for all.
    const tune = (m: THREE.Material) => {
      const mm = m as THREE.MeshStandardMaterial;
      if (typeof mm.metalness === 'number') mm.metalness = Math.min(mm.metalness, 0.15);
      if (mm.emissive && typeof mm.emissiveIntensity === 'number') {
        mm.emissive.set('#dfe6ee');
        mm.emissiveIntensity = 0.3;
      }
    };

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        // Small + always moving high up: keep it from being wrongly frustum-culled
        // (which reads as the plane "disappearing" as it/the camera moves).
        child.frustumCulled = false;
        // Decorative + far away: never spend raycasts walking this mesh.
        child.raycast = () => {};
        const mat = child.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach(tune);
        else if (mat) tune(mat);
      }
    });

    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Fit the longest side to TARGET_LENGTH, with non-finite guards so a
    // degenerate bbox can never produce NaN transforms (which black-screen R3F).
    const longest = Math.max(size.x, size.y, size.z);
    const safeLongest = Number.isFinite(longest) && longest > 1e-4 ? longest : 1;
    let scale = TARGET_LENGTH / safeLongest;
    if (!Number.isFinite(scale) || scale <= 0) scale = 1;

    const safe = (v: number) => (Number.isFinite(v) ? v : 0);
    const group = new THREE.Group();
    // Centre on the origin (it flies, so no "base at ground" offset).
    cloned.position.set(safe(-center.x * scale), safe(-center.y * scale), safe(-center.z * scale));
    cloned.scale.setScalar(scale);
    group.add(cloned);
    return group;
  }, [scene]);

  return <primitive object={model} />;
};

useGLTF.preload(MODEL_PATH);
