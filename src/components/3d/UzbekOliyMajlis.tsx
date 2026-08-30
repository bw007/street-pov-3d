import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { RigidBody } from '@react-three/rapier';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { InspectableObject } from '../../types';

interface OliyMajlisProps {
  position: [number, number, number];
  rotationY?: number;
}

const BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = BASE.endsWith('/') ? BASE : BASE + '/';
const MODEL_PATH = `${BASE_URL}models/uzbek/oliy_majlis_binosi.glb`;

// --- Golden walls -----------------------------------------------------------
// The whole building (walls, columns, dome, steps, "OLIY MAJLIS" lettering) is
// ONE mesh sharing a tiny 64x4 "palette" texture pair — a base-color atlas and a
// metallic-roughness atlas — where every face's UVs point at a single column of
// each. Decoding the mesh UVs shows the perimeter wall faces sample columns 0-7
// (0-3 = grid lines, 4-7 = panels); the lettering/dome/columns live in other
// columns. So we only touch columns 0-7.
//
// The walls already carry a gold base color, but the model marks them fully
// METALLIC (metalness ~1, roughness ~0). This scene has no environment map, and
// a pure metal reflects only its surroundings — so the gold walls rendered
// black. The fix: for the wall columns, brighten the base color AND drop
// metalness to 0 (matte gold), while leaving every other column untouched.
const WALL_COL_MAX = 7;                              // palette columns 0..7 = walls
const PANEL_GOLD: readonly [number, number, number] = [228, 180, 58]; // #e4b43a
const GRID_GOLD: readonly [number, number, number] = [140, 100, 34];  // #8c6422
const WALL_ROUGHNESS = 120;                          // MR green channel -> ~0.47 satin

// One edited texture per source atlas, shared across all building instances.
const PALETTE_EDIT_CACHE = new WeakMap<THREE.Texture, THREE.Texture>();

/**
 * Return an edited copy of a 64x4 palette texture (or null if its pixels can't
 * be read). `edit(x, px, i)` may mutate the RGBA bytes at offset `i` for the
 * texel in column `x`.
 */
function editPaletteTexture(
  src: THREE.Texture,
  edit: (x: number, px: Uint8ClampedArray, i: number) => void,
): THREE.Texture | null {
  const cached = PALETTE_EDIT_CACHE.get(src);
  if (cached) return cached;

  const img = src.image as (HTMLImageElement | ImageBitmap | undefined);
  if (!img || !img.width || !img.height) return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img as CanvasImageSource, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = imageData.data;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        edit(x, px, (y * canvas.width + x) * 4);
      }
    }
    ctx.putImageData(imageData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = src.colorSpace; // sRGB for base color, linear for metal/rough
    tex.flipY = false;               // match glTF convention (rows are identical anyway)
    tex.wrapS = src.wrapS;
    tex.wrapT = src.wrapT;
    tex.magFilter = src.magFilter;
    tex.minFilter = src.minFilter;
    tex.generateMipmaps = src.generateMipmaps;
    tex.anisotropy = src.anisotropy;
    tex.needsUpdate = true;
    PALETTE_EDIT_CACHE.set(src, tex);
    return tex;
  } catch {
    // getImageData can throw on a tainted canvas; fall back to the original look.
    return null;
  }
}

// Base-color atlas: repaint the wall columns to a brighter, cleaner gold.
function goldWallBase(x: number, px: Uint8ClampedArray, i: number): void {
  if (x > WALL_COL_MAX) return;
  const [r, g, b] = x <= 3 ? GRID_GOLD : PANEL_GOLD;
  px[i] = r; px[i + 1] = g; px[i + 2] = b;
}

// Metallic-roughness atlas (glTF packs roughness in G, metalness in B): make the
// wall columns non-metallic so their gold base color actually shows.
function matteWallMR(x: number, px: Uint8ClampedArray, i: number): void {
  if (x > WALL_COL_MAX) return;
  px[i + 1] = WALL_ROUGHNESS; // roughness
  px[i + 2] = 0;              // metalness -> 0
}

export const UzbekOliyMajlis: React.FC<OliyMajlisProps> = ({
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

    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Skip per-triangle raycasting on the ~117,000-tri visual mesh; a
        // cheap proxy box (below) handles click/hover detection instead.
        child.raycast = () => {};

        // Fix the gold walls. Only the building body carries the small 64x4
        // palette atlas; the flag (1024x512) and ground plate (1024x1024) are
        // skipped by the size gate, and cloning the material keeps the shared
        // GLTF cache untouched.
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat, idx) => {
          const stdMat = mat as THREE.MeshStandardMaterial;
          const map = stdMat?.map;
          if (map?.image && map.image.width <= 64 && map.image.height <= 8) {
            const goldBase = editPaletteTexture(map, goldWallBase);
            if (!goldBase) return;

            const retinted = stdMat.clone();
            retinted.map = goldBase;
            // The metallic-roughness map is the same 64x4 atlas; strip metalness
            // from the wall columns so the gold shows instead of a black mirror.
            const mr = stdMat.metalnessMap;
            if (mr?.image && mr.image.width <= 64 && mr.image.height <= 8) {
              const matteMR = editPaletteTexture(mr, matteWallMR);
              if (matteMR) {
                retinted.metalnessMap = matteMR;
                retinted.roughnessMap = matteMR;
              }
            }
            retinted.needsUpdate = true;

            if (Array.isArray(child.material)) child.material[idx] = retinted;
            else child.material = retinted;
          }
        });
      }
    });

    const bbox = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Target Height: 18 meters
    const TARGET_HEIGHT = 18.0;
    const rawHeight = size.y > 0.001 ? size.y : 1;
    const autoScale = TARGET_HEIGHT / rawHeight;

    const group = new THREE.Group();
    cloned.position.set(
      -center.x * autoScale,
      -bbox.min.y * autoScale,
      -center.z * autoScale
    );
    cloned.scale.set(autoScale, autoScale, autoScale);
    group.add(cloned);

    return {
      modelGroup: group,
      proxySize: [size.x * autoScale, TARGET_HEIGHT, size.z * autoScale] as [number, number, number],
    };
  }, [scene]);

  const inspectData: InspectableObject = useMemo(() => ({
    id: `oliy_majlis_${position[0]}_${position[2]}`,
    title: "Oliy Majlis Qonunchilik Palatasi Binosi (Toshkent)",
    category: 'building',
    badge: "DAVLAT ARXITEKTURASI",
    description: "O'zbekiston Respublikasi parlamenti va qonun chiqaruvchi oliy organi saroyi. Oq marmar peshtoqlar, salobatli ustunlar va zangori gumbaz uyg'unligida barpo etilgan.",
    streetName: currentStreet?.name,
    details: [
      { label: "Bino vazifasi", value: "Qonunchilik Palatasi Saroyi" },
      { label: "Balandligi", value: "18 metr (Gumbaz cho'qqisi)" },
      { label: "Me'moriy uslub", value: "Milliy mumtoz va neoklassika" },
      { label: "Joylashuvi", value: "Toshkent shahri, Mustaqillik maydoni yaqinida" },
      { label: "Holati", value: "Faol davlat arxitekturasi" },
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
        Cuboid colliders (one AABB per mesh) instead of a convex hull. The model
        is ~117k tris and NOT walkable, so a few boxes block the player just as
        well — while avoiding hull cooking, which is expensive and can crash
        Rapier's WASM on a detailed mesh. Matches the other monuments (Amir Temur,
        City Nest, Circus), which are all cuboid.
      */}
      <RigidBody type="fixed" colliders="cuboid">
        <primitive object={modelGroup} />
      </RigidBody>

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

      {/* Grand Architectural Spotlighting */}
      {(isNight || isSunset) && (
        <>
          <spotLight
            position={[0, 22, 16]}
            target-position={[0, 8, 0]}
            color={isNight ? '#ffffff' : '#fed7aa'}
            intensity={isNight ? 50 : 25}
            distance={45}
            angle={0.6}
            penumbra={0.5}
          />
          <pointLight
            position={[0, 16, 0]}
            color="#38bdf8"
            intensity={isNight ? 30 : 12}
            distance={28}
            decay={2}
          />
        </>
      )}
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
