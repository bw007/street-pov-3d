import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
const MODEL_PATH = `${BASE_URL}models/fauna/seagull.glb`;

// Fitted wingspan in world units (the model's long axis). Kept small so the bird
// reads at a realistic scale against the city (1 unit ~= 1 m); the per-bird
// `size` in SkyElements varies it a little further. The GLB's head points -X and
// wings span Z; a +90° yaw turns the forward axis into +Z, which is what the
// straight-flight code below expects (rotation.y = PI/2 - heading).
const TARGET_SPAN = 1.5;
const MODEL_YAW = Math.PI / 2;

export interface BirdFlightParams {
  heading: number; // travel direction (each bird gets its own)
  lateral: number; // perpendicular offset so paths don't overlap
  height: number;
  speed: number;
  offset: number; // phase along the path
  span: number; // wrap distance (kept beyond the fog so the wrap is hidden)
  flapSpeed: number;
  bob: number;
  size: number;
  animOffset: number;
}

/**
 * One animated seagull. Skinned + has a flap clip, so it's cloned with
 * SkeletonUtils (each bird gets its own skeleton) and driven by its own mixer
 * via useAnimations. Decorative: no shadows, no raycasting; geometry/material
 * are shared with the cached GLTF (SkeletonUtils.clone shares them), so nothing
 * is disposed here. Each bird flies a straight path on its own heading (so they
 * spread out and cross the sky rather than orbiting the player), wrapping far
 * away where the fog hides it. The parent SkyElements group keeps the whole
 * flock in the airspace around the player as they roam.
 */
export const SeagullBird: React.FC<{ params: BirdFlightParams }> = ({ params }) => {
  const { scene, animations } = useGLTF(MODEL_PATH);

  const model = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene) as THREE.Object3D;

    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      // Small, always moving — skip frustum culling so wings don't pop at edges.
      mesh.frustumCulled = false;
      // No sun / env map → clamp metalness so it isn't rendered near-black.
      const tune = (m: THREE.Material) => {
        const mm = m as THREE.MeshStandardMaterial;
        if (typeof mm.metalness === 'number') mm.metalness = Math.min(mm.metalness, 0.2);
      };
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach(tune);
      else if (mat) tune(mat);
    });

    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    const longest = Math.max(size.x, size.y, size.z);
    const safeLongest = Number.isFinite(longest) && longest > 1e-4 ? longest : 1;
    let scale = TARGET_SPAN / safeLongest;
    if (!Number.isFinite(scale) || scale <= 0) scale = 1;

    const safe = (v: number) => (Number.isFinite(v) ? v : 0);
    cloned.scale.setScalar(scale);
    cloned.position.set(safe(-center.x * scale), safe(-center.y * scale), safe(-center.z * scale));

    // Wrapper carries the forward-axis correction so centring stays valid.
    const inner = new THREE.Group();
    inner.rotation.y = MODEL_YAW;
    inner.add(cloned);
    return inner;
  }, [scene]);

  // Each bird gets its own mixer (root = its clone), so they flap independently.
  const { actions } = useAnimations(animations, model);
  useEffect(() => {
    const action = Object.values(actions)[0];
    if (!action) return;
    action.reset();
    action.time = params.animOffset; // desync the flock
    action.timeScale = params.flapSpeed;
    action.play();
  }, [actions, params.animOffset, params.flapSpeed]);

  const groupRef = useRef<THREE.Group>(null!);
  const dx = Math.cos(params.heading);
  const dz = Math.sin(params.heading);
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Straight cross-sky flight along this bird's own heading (birds diverge
    // instead of orbiting the player); wraps far away, hidden beyond the fog.
    const prog = ((t * params.speed + params.offset) % params.span) - params.span / 2;
    groupRef.current.position.set(
      -dz * params.lateral + dx * prog,
      params.height + Math.sin(t * 0.5 + params.offset) * params.bob,
      dx * params.lateral + dz * prog,
    );
    groupRef.current.rotation.y = Math.PI / 2 - params.heading; // forward (+Z) faces heading
  });

  return (
    <group ref={groupRef} scale={params.size}>
      <primitive object={model} />
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
