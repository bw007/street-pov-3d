import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';

export const PEOPLE_URLS = {
  human: `${BASE_URL}models/people/human_walking.glb`,
  man: `${BASE_URL}models/people/man_walking.glb`,
};

const TARGET_HEIGHT = 1.75; // human height (m)

// Bind-pose metrics measured from each GLB (height + centre offsets). three's
// setFromObject collapses for these skinned rigs and returns a tiny box (which
// made the people giant), so we scale from these known values instead.
const MODEL_FIT: Record<string, { height: number; cx: number; cz: number; minY: number }> = {
  [PEOPLE_URLS.human]: { height: 186.91, cx: -0.76, cz: 4.04, minY: -1.31 },
  [PEOPLE_URLS.man]: { height: 3.31, cx: 0, cz: 0.08, minY: 0 },
};

export interface WalkParams {
  url: string;
  /** Segment start (world). The person paces from here along `dir` and back. */
  start: [number, number, number];
  /** Walk direction on the XZ plane (normalised internally). */
  dir: [number, number];
  length: number; // pace segment length (m)
  speed: number; // m/s
  phase: number; // offset in the ping-pong + flap cycle
  /** Per-model forward correction if it walks sideways/backwards (radians). */
  facingYaw?: number;
}

/**
 * A skinned, animated pedestrian. Cloned with SkeletonUtils (own skeleton) and
 * driven by its own AnimationMixer via useAnimations (the walk clip). Auto-stands
 * upright regardless of the source up-axis, fits to human height, and paces back
 * and forth along a segment, turning to face its direction of travel. Decorative:
 * no shadows, raycast off, metalness clamped (sun-less scene).
 */
export const WalkingPerson: React.FC<{ params: WalkParams }> = ({ params }) => {
  const { scene, animations } = useGLTF(params.url);

  const model = useMemo(() => {
    const cloned = SkeletonUtils.clone(scene) as THREE.Object3D;

    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.frustumCulled = false;
      const tune = (m: THREE.Material) => {
        const mm = m as THREE.MeshStandardMaterial;
        if (typeof mm.metalness === 'number') mm.metalness = Math.min(mm.metalness, 0.2);
      };
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach(tune);
      else if (mat) tune(mat);
    });

    // Scale from the measured bind-pose height (both models are Y-up, so no
    // rotation). Fall back to a runtime bbox only for unlisted models.
    const fit = MODEL_FIT[params.url];
    let scale = 1;
    let cx = 0;
    let cz = 0;
    let minY = 0;
    if (fit) {
      scale = TARGET_HEIGHT / fit.height;
      cx = fit.cx;
      cz = fit.cz;
      minY = fit.minY;
    } else {
      const b = new THREE.Box3().setFromObject(cloned);
      const s = new THREE.Vector3();
      b.getSize(s);
      const c = new THREE.Vector3();
      b.getCenter(c);
      scale = TARGET_HEIGHT / Math.max(s.y, 1e-3);
      cx = c.x;
      cz = c.z;
      minY = b.min.y;
    }
    if (!Number.isFinite(scale) || scale <= 0) scale = 1;

    const safe = (v: number) => (Number.isFinite(v) ? v : 0);
    cloned.scale.setScalar(scale);
    cloned.position.set(safe(-cx * scale), safe(-minY * scale), safe(-cz * scale));

    const inner = new THREE.Group();
    inner.add(cloned);
    return inner;
  }, [scene, params.url]);

  const { actions } = useAnimations(animations, model);
  useEffect(() => {
    const action = Object.values(actions)[0];
    if (!action) return;
    action.reset();
    action.time = params.phase;
    action.play();
  }, [actions, params.phase]);

  const group = useRef<THREE.Group>(null!);
  const dir = useMemo(() => {
    const d = new THREE.Vector2(params.dir[0], params.dir[1]);
    if (d.lengthSq() < 1e-6) d.set(0, 1);
    return d.normalize();
  }, [params.dir]);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime * (params.speed / Math.max(params.length, 0.5)) + params.phase;
    const u = t % 2; // 0..2
    const tri = u < 1 ? u : 2 - u; // 0..1..0 ping-pong along the segment
    const fwd = u < 1;
    group.current.position.set(
      params.start[0] + dir.x * tri * params.length,
      params.start[1],
      params.start[2] + dir.y * tri * params.length,
    );
    // Face the direction of travel (smoothly, so the U-turn isn't a hard snap).
    const sx = fwd ? dir.x : -dir.x;
    const sz = fwd ? dir.y : -dir.y;
    const target = Math.atan2(sx, sz) + (params.facingYaw ?? 0);
    let diff = target - group.current.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    group.current.rotation.y += diff * Math.min(1, delta * 8);
  });

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  );
};

useGLTF.preload(PEOPLE_URLS.human);
useGLTF.preload(PEOPLE_URLS.man);
