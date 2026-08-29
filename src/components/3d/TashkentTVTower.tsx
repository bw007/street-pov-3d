import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

interface TashkentTVTowerProps {
  position: [number, number, number];
  rotationY?: number;
}

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
const MODEL_PATH = `${BASE_URL}models/uzbek/tashkent_tv_tower.glb`;

// The Tashkent TV Tower is a tall, slender landmark (~4:1 tall:wide). Fit it by
// height — the footprint won't bind — so it towers above the rest of the city.
const MAX_HEIGHT = 95;
const MAX_FOOTPRINT = 60;

/**
 * Toshkent Teleminorasi (Tashkent TV Tower), placed on Oybek street as its own
 * plaza landmark. Robust monument pattern: fit-to-box with non-finite guards, a
 * cheap cuboid collider (never a convex hull), raycast disabled on the visual
 * mesh (a proxy box handles crosshair hover/click), and dusk/night floodlighting.
 */
export const TashkentTVTower: React.FC<TashkentTVTowerProps> = ({ position, rotationY = 0 }) => {
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  const { scene } = useGLTF(MODEL_PATH);

  const { modelGroup, colliderSize } = useMemo(() => {
    const cloned = scene.clone(true);

    // No directional sun + no env map in this scene → clamp metalness so a
    // metallic surface doesn't render near-black under the ambient fill.
    const tune = (m: THREE.Material) => {
      const mm = m as THREE.MeshStandardMaterial;
      if (typeof mm.metalness === 'number') mm.metalness = Math.min(mm.metalness, 0.3);
    };

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Skip per-triangle raycasting; the proxy box handles hover/click.
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

    // Defensive: a non-finite/degenerate bbox → NaN transforms → black screen.
    const rawHeight = Number.isFinite(size.y) && size.y > 0.001 ? size.y : 1;
    const rawFoot = Number.isFinite(Math.max(size.x, size.z)) ? Math.max(size.x, size.z, 0.001) : 1;
    let autoScale = Math.min(MAX_HEIGHT / rawHeight, MAX_FOOTPRINT / rawFoot);
    if (!Number.isFinite(autoScale) || autoScale <= 0) autoScale = 1;

    const safe = (v: number) => (Number.isFinite(v) ? v : 0);
    const group = new THREE.Group();
    cloned.position.set(
      safe(-center.x * autoScale),
      safe(-bbox.min.y * autoScale),
      safe(-center.z * autoScale),
    );
    cloned.scale.setScalar(autoScale);
    group.add(cloned);

    const footX = Number.isFinite(size.x) ? Math.max(size.x * autoScale, 1) : 8;
    const footZ = Number.isFinite(size.z) ? Math.max(size.z * autoScale, 1) : 8;
    const height = Number.isFinite(size.y) ? Math.max(size.y * autoScale, 1) : MAX_HEIGHT;

    return {
      modelGroup: group,
      colliderSize: [footX, height, footZ] as [number, number, number],
    };
  }, [scene]);

  const inspectData: InspectableObject = useMemo(
    () => ({
      id: `tashkent_tv_tower_${position[0]}_${position[2]}`,
      title: 'Toshkent Teleminorasi (Tashkent TV Tower)',
      category: 'landmark',
      badge: 'TELEMINORA',
      description:
        "1985-yilda qurilgan, balandligi 375 metr bo'lgan Toshkent teleminorasi — Markaziy Osiyodagi eng baland inshootlardan biri. Aylanma restoran va manzarali maydonchaga ega.",
      streetName: currentStreet?.name,
      details: [
        { label: 'Balandligi', value: '375 metr' },
        { label: 'Qurilgan', value: '1985-yil' },
        { label: 'Xususiyat', value: "Aylanma restoran, manzara maydonchasi" },
        { label: 'Turi', value: 'Teleradio uzatish minorasi' },
        { label: 'Holati', value: "Toshkent ramzlaridan biri" },
      ],
    }),
    [position, currentStreet?.name],
  );

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Cheap cuboid physics body + crosshair proxy. */}
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

      <primitive object={modelGroup} />

      {/* Floodlighting at dusk / night, plus a red aircraft-warning beacon on top. */}
      {(isNight || isSunset) && (
        <>
          <spotLight
            position={[0, 70, 34]}
            target-position={[0, 40, 0]}
            color={isNight ? '#e0f2fe' : '#fed7aa'}
            intensity={isNight ? 70 : 32}
            distance={140}
            angle={0.6}
            penumbra={0.5}
          />
          <pointLight
            position={[0, Math.min(colliderSize[1] - 4, 90), 0]}
            color="#f87171"
            intensity={isNight ? 22 : 9}
            distance={34}
            decay={2}
          />
        </>
      )}
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
