import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';

/** Static prop model paths (all light — a few thousand tris each). */
export const PROP_URLS = {
  vase: `${BASE_URL}models/props/flower_vase.glb`,
  kiosk: `${BASE_URL}models/props/kiosk.glb`,
  atm: `${BASE_URL}models/props/atm_machine.glb`,
  fur: `${BASE_URL}models/props/fur_tree.glb`,
};

const NO_RAYCAST = () => {};

interface PropModelProps {
  url: string;
  /** Final height in world units (metres) — the model is scaled to this. */
  targetHeight: number;
  position: [number, number, number];
  rotationY?: number;
  /** Add a cheap cuboid collider so the player can't walk through it. */
  collide?: boolean;
  /** Optional per-material tweak (recolour etc.), applied once at clone time. */
  onMaterial?: (m: THREE.MeshStandardMaterial) => void;
  /** Auto-stand a lying-down model: rotate its longest axis up to Y before fitting. */
  autoStand?: boolean;
  /** If set, the prop becomes clickable and shows this in the inspect modal. */
  inspect?: InspectableObject;
}

// --- Per-model recolours (keyed by the GLB's own material names) -------------

/** Kiosk: white/silver body, black card panel, glowing blue screen. */
export const recolorKiosk = (m: THREE.MeshStandardMaterial) => {
  switch (m.name) {
    case 'Material.001': // body -> brushed white / silver
      m.color.set('#e9ebee');
      m.metalness = 0.3;
      m.roughness = 0.45;
      m.emissive.set('#c2c8ce');
      m.emissiveIntensity = 0.22;
      break;
    case 'Material.002': // card-reader / dark panel
      m.color.set('#1b1f24');
      m.metalness = 0.2;
      m.roughness = 0.5;
      m.emissiveIntensity = 0;
      break;
    case 'Material.003': // screen -> glowing blue
      m.color.set('#1a52a8');
      m.emissive.set('#2f78dd');
      m.emissiveIntensity = 0.75;
      m.metalness = 0;
      m.roughness = 0.25;
      break;
    default:
      break;
  }
};

/** ATM: single textured metal material — push to bright silver/white and
 *  self-illuminate so it doesn't read dark in the sun-less scene. */
export const recolorAtm = (m: THREE.MeshStandardMaterial) => {
  m.color.set('#dbe0e6');
  m.metalness = Math.min(m.metalness, 0.25);
  m.roughness = Math.max(m.roughness, 0.45);
  m.emissive.set('#aab2bc');
  m.emissiveIntensity = 0.26;
};

/** Fir tree: the GLB uses a Maya spec-gloss material that three r170 can't
 *  render (so it shows grey) — give it real colours: green foliage, brown wood. */
export const recolorFir = (m: THREE.MeshStandardMaterial) => {
  if (m.name === 'Branch') {
    m.color.set('#5a3d29'); // brown trunk / branches
    m.metalness = 0;
    m.roughness = 0.9;
  } else {
    m.color.set('#2f6b32'); // green foliage
    m.metalness = 0;
    m.roughness = 0.9;
    m.emissive.set('#1c3f1e');
    m.emissiveIntensity = 0.25; // slight self-lift so the green reads (no sun)
  }
};

/**
 * Generic ambient street/plaza prop loaded from a GLB and normalised to a target
 * HEIGHT (so several different models sit at a consistent, human-relative scale).
 * Performance-safe like the other model components: geometry/materials shared via
 * clone(), no shadows, raycast disabled on the visual mesh, metalness clamped,
 * and only a cheap cuboid collider — never a hull. `autoStand` stands up a
 * lying-down model; `inspect` makes it a named, clickable object. Wrap usages in
 * <SafeModel>.
 */
export const PropModel: React.FC<PropModelProps> = ({
  url,
  targetHeight,
  position,
  rotationY = 0,
  collide = true,
  onMaterial,
  autoStand = false,
  inspect,
}) => {
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const { scene } = useGLTF(url);

  const { model, footprint } = useMemo(() => {
    const cloned = scene.clone(true);

    const tune = (m: THREE.Material) => {
      const mm = m as THREE.MeshStandardMaterial;
      if (typeof mm.metalness === 'number') mm.metalness = Math.min(mm.metalness, 0.3);
      onMaterial?.(mm);
    };

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        child.raycast = () => {};
        const mat = child.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach(tune);
        else if (mat) tune(mat);
      }
    });

    // Auto-stand: if the model loads lying down (a horizontal axis is longest),
    // rotate its longest axis up to Y. Robust regardless of the source up-axis.
    if (autoStand) {
      const s0 = new THREE.Vector3();
      new THREE.Box3().setFromObject(cloned).getSize(s0);
      if (s0.z > s0.y && s0.z >= s0.x) cloned.rotation.x = -Math.PI / 2;
      else if (s0.x > s0.y && s0.x > s0.z) cloned.rotation.z = Math.PI / 2;
    }

    // bbox reflects any autoStand rotation (uniform scale below commutes with it).
    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    const rawH = Number.isFinite(size.y) && size.y > 1e-4 ? size.y : 1;
    let scale = targetHeight / rawH;
    if (!Number.isFinite(scale) || scale <= 0) scale = 1;

    const safe = (v: number) => (Number.isFinite(v) ? v : 0);
    const group = new THREE.Group();
    cloned.scale.setScalar(scale);
    cloned.position.set(safe(-center.x * scale), safe(-bbox.min.y * scale), safe(-center.z * scale));
    group.add(cloned);

    const footX = Math.max(safe(size.x * scale), 0.3);
    const footZ = Math.max(safe(size.z * scale), 0.3);
    return { model: group, footprint: [footX, targetHeight, footZ] as [number, number, number] };
  }, [scene, targetHeight, onMaterial, autoStand]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    if (inspect) setInspectedObject(inspect);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {collide && (
        <RigidBody type="fixed" colliders="cuboid">
          <mesh position={[0, footprint[1] / 2, 0]} visible={false} raycast={NO_RAYCAST}>
            <boxGeometry args={footprint} />
          </mesh>
        </RigidBody>
      )}

      {inspect && (
        <mesh
          position={[0, footprint[1] / 2, 0]}
          visible={false}
          userData={{ inspectData: inspect }}
          onClick={handleInspect}
          onPointerOver={(e: { stopPropagation: () => void }) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto';
          }}
        >
          <boxGeometry args={footprint} />
        </mesh>
      )}

      <primitive object={model} />
    </group>
  );
};

useGLTF.preload(PROP_URLS.vase);
useGLTF.preload(PROP_URLS.kiosk);
useGLTF.preload(PROP_URLS.atm);
useGLTF.preload(PROP_URLS.fur);
