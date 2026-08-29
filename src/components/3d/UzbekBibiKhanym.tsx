import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

interface BibiKhanymProps {
  position: [number, number, number];
  rotationY?: number;
}

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
const MODEL_PATH = `${BASE_URL}models/uzbek/bibi_khanym.glb`;

// The raw photogrammetry scan's absolute lowest point is well below the
// building's actual courtyard/pavement surface — drone scans reconstruct a
// noisy, sparse "tail" beneath the true ground near grazing camera angles.
// Measured directly from the scan's vertex Y distribution: there's a sharp
// density peak (the real, densely-sampled courtyard slab) at this raw local
// Y — the raw bbox minimum sits about 2 raw units below it, which is that
// noise tail, not real ground. This is the ONE measurement the alignment
// below depends on; everything else (auto-scale, meters offsets) derives
// from it at runtime so it can't drift out of sync if TARGET_HEIGHT changes.
const PAVEMENT_LOCAL_Y = -11.9;

// How far below world Y=0 the clip plane sits, in final scene meters. Must
// be > 0: a clip plane placed exactly at (or above) ground level leaves a
// hairline gap where clipped-away geometry reveals the background right at
// the building's base, making it look like it's floating. Keeping it a few
// centimeters *below* ground instead lets the flat street mesh cover the
// seam.
const CLIP_BURY_MARGIN = 0.05;

export const UzbekBibiKhanym: React.FC<BibiKhanymProps> = ({
  position,
  rotationY = 0,
}) => {
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const currentStreet = useWorldStore((s) => s.currentStreet);
  const timeOfDay = useWorldStore((s) => s.timeOfDay);

  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  const { scene } = useGLTF(MODEL_PATH);

  const { modelGroup, proxySize } = useMemo(() => {
    const cloned = scene.clone(true);

    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Target Height: 24 meters (Grand monumental scale)
    const TARGET_HEIGHT = 24.0;
    const rawHeight = size.y > 0.001 ? size.y : 1;
    const autoScale = TARGET_HEIGHT / rawHeight;

    // Places the real pavement (not the raw bbox minimum, which includes
    // the noise tail below it) exactly at world Y=0.
    const groupPositionY = -PAVEMENT_LOCAL_Y * autoScale;

    // This is a raw drone photogrammetry scan, and every one of its 25 mesh
    // pieces is split by texture-atlas material, not by structural part —
    // each piece already spans almost the model's entire footprint. That
    // means the scanned excavation-site ground/dirt mound around the base
    // isn't isolated in its own mesh; it's mixed into all of them, and
    // renders as a dark, jagged mass poking up through the game's flat
    // ground. A world-space clipping plane just below the real courtyard
    // level discards that terrain without needing to touch the geometry
    // itself — see CLIP_BURY_MARGIN above for why it's below ground rather
    // than exactly at it.
    const clipWorldY = position[1] - CLIP_BURY_MARGIN;
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -clipWorldY);

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // The crosshair raycaster tests the whole scene every frame; this
        // model's ~2,000,000 triangles make per-triangle raycasting against
        // it very expensive up close. Skip it here — a cheap proxy box
        // (below) handles click/hover detection instead.
        child.raycast = () => {};

        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          mat.clippingPlanes = [clipPlane];
          mat.clipShadows = true;
        });
      }
    });

    const group = new THREE.Group();
    cloned.position.set(
      -center.x * autoScale,
      groupPositionY,
      -center.z * autoScale
    );
    cloned.scale.set(autoScale, autoScale, autoScale);
    group.add(cloned);

    return {
      modelGroup: group,
      proxySize: [size.x * autoScale, TARGET_HEIGHT, size.z * autoScale] as [number, number, number],
    };
  }, [scene, position[1]]);

  const inspectData: InspectableObject = useMemo(() => ({
    id: `bibi_khanym_${position[0]}_${position[2]}`,
    title: "Bibixonim Jome Masjidi (Samarqand)",
    category: 'landmark',
    badge: "XIV ASR ME'MORIY DURDONASI",
    description: "1399-1404 yillarda Sohibqiron Amir Temur tomonidan Samarqandda bunyod etilgan ulug'vor moviy gumbazli jome masjidi. O'rta asrlar sharq me'morchiligining eng yuksak cho'qqilaridan biri.",
    streetName: currentStreet?.name,
    details: [
      { label: "Asos solingan davr", value: "1399-1404 yillar" },
      { label: "Balandligi", value: "36 metr (Ulkan peshtoq)" },
      { label: "Me'moriy uslub", value: "Temuriylar davri feruza mozaikasi" },
      { label: "UNESCO maqomi", value: "Butunjahon merosi ro'yxatida" },
      { label: "Manba", value: "Global Digital Heritage Photogrammetry 3D" },
    ],
  }), [position, currentStreet?.name]);

  const handleInspect = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    soundManager.playClick();
    setInspectedObject(inspectData);
  };

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/*
        Convex-hull collider (one hull per mesh, since the model is already
        split into ~25 pieces) instead of an exact trimesh. The raw scan has
        ~2,000,000 triangles — using it directly as a trimesh collider makes
        Rapier's narrow-phase collision against the player capsule extremely
        expensive as soon as you get close, causing severe stutter. Hulls are
        vastly cheaper to test and still leave gaps for the arch/courtyard
        since those are separate mesh pieces, not carved holes in one mesh.
      */}
      <RigidBody type="fixed" colliders="hull">
        <primitive object={modelGroup} />
      </RigidBody>

      {/* Cheap invisible box standing in for the 2M-triangle visual mesh so
          the crosshair raycaster can detect hover/click without walking the
          full detailed geometry every frame. */}
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

      {/* Atmospheric Monument Illumination at Sunset & Night */}
      {(isNight || isSunset) && (
        <>
          <pointLight
            position={[0, 12, 10]}
            color={isNight ? '#38bdf8' : '#f59e0b'}
            intensity={isNight ? 45 : 20}
            distance={40}
            decay={2}
          />
          <pointLight
            position={[0, 18, -8]}
            color="#38bdf8"
            intensity={isNight ? 35 : 15}
            distance={35}
            decay={2}
          />
        </>
      )}
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
