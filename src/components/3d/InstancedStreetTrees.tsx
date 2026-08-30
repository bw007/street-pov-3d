import React, { useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';
import { StreetTree } from './StreetTree';

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
const MODEL_PATH = `${BASE_URL}models/props/street_tree.glb`;

const TARGET_HEIGHT = 5.5;

interface InstancedStreetTreesProps {
  positions: [number, number, number][];
  inspectData: InspectableObject;
  /** Override the fitted height (default TARGET_HEIGHT). */
  targetHeight?: number;
}

/**
 * All of a chunk's identical street trees drawn as ONE InstancedMesh per source
 * sub-mesh (trunk + foliage ≈ 2 draw calls) instead of a full clone per tree
 * (24 trees × 2 = ~48 draw calls). Same geometry, same materials, same look.
 *
 * `street_tree.glb` is meshopt-quantized (Int16 positions), so the fit-to-box
 * scale is applied through each instance's MATRIX and NEVER baked into the
 * geometry — baking a transform into an int attribute corrupts it (→ NaN). The
 * per-instance matrix already carries the node's de-quantization scale (it comes
 * from `matrixWorld`), so the shared quantized geometry renders correctly.
 *
 * Click/hover keeps the same cheap invisible proxy box per tree (the visual
 * instances don't raycast — the crosshair walks the scene every frame). If
 * instancing can't be built for any reason, it falls back to individual
 * <StreetTree>s, i.e. the previous behaviour.
 */
export const InstancedStreetTrees: React.FC<InstancedStreetTreesProps> = ({
  positions,
  inspectData,
  targetHeight = TARGET_HEIGHT,
}) => {
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const { scene } = useGLTF(MODEL_PATH);

  // Stable key so day/night re-renders don't rebuild the instance buffers.
  const posKey = positions.map((p) => `${p[0]},${p[1]},${p[2]}`).join('|');

  const built = useMemo(() => {
    if (positions.length === 0) return null;
    try {
      const cloned = scene.clone(true);
      const bbox = new THREE.Box3().setFromObject(cloned);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      const center = new THREE.Vector3();
      bbox.getCenter(center);
      const rawHeight = size.y > 1e-4 ? size.y : 1;
      const s = targetHeight / rawHeight;
      if (!Number.isFinite(s) || s <= 0) return null;

      // Reproduce StreetTree's fit (scale + centre, base on the ground) on the
      // clone root, then read each sub-mesh's resulting world matrix.
      cloned.position.set(-center.x * s, -bbox.min.y * s, -center.z * s);
      cloned.scale.setScalar(s);
      cloned.updateMatrixWorld(true);

      const sources: { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[]; matrix: THREE.Matrix4 }[] = [];
      cloned.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          sources.push({ geometry: c.geometry, material: c.material, matrix: c.matrixWorld.clone() });
        }
      });
      if (sources.length === 0) return null;

      const t = new THREE.Matrix4();
      const m = new THREE.Matrix4();
      const meshes = sources.map(({ geometry, material, matrix }) => {
        const inst = new THREE.InstancedMesh(geometry, material, positions.length);
        inst.castShadow = true;
        inst.receiveShadow = true;
        inst.raycast = () => {}; // proxy boxes handle clicks; keep it off the hot raycast
        for (let i = 0; i < positions.length; i++) {
          const [x, y, z] = positions[i];
          t.makeTranslation(x, y, z);
          m.multiplyMatrices(t, matrix); // T(worldPos) · (fit · node matrix)
          inst.setMatrixAt(i, m);
        }
        inst.instanceMatrix.needsUpdate = true;
        inst.computeBoundingSphere();
        return inst;
      });

      return { meshes, proxySize: [size.x * s, targetHeight, size.z * s] as [number, number, number] };
    } catch {
      return null;
    }
    // posKey encodes every position value; `positions`/length are covered by it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, targetHeight, posKey]);

  // Free the per-instance GPU buffers when this chunk unmounts. The shared
  // geometry/materials come from the useGLTF cache and are deliberately left intact.
  useEffect(() => {
    const meshes = built?.meshes;
    return () => meshes?.forEach((mesh) => mesh.dispose());
  }, [built]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  // Fallback: instancing unavailable → individual trees (previous behaviour).
  if (!built) {
    return (
      <>
        {positions.map((pos, i) => (
          <StreetTree key={`tree-${i}`} position={pos} inspectData={inspectData} physics={false} targetHeight={targetHeight} />
        ))}
      </>
    );
  }

  const { meshes, proxySize } = built;
  return (
    <group>
      {meshes.map((mesh, i) => (
        <primitive key={`tree-inst-${i}`} object={mesh} />
      ))}
      {positions.map((pos, i) => (
        <mesh
          key={`tree-proxy-${i}`}
          visible={false}
          position={[pos[0], proxySize[1] / 2, pos[2]]}
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
      ))}
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
