import React from 'react';
import * as THREE from 'three';
import { StreetTree } from './StreetTree';
import { StreetBench } from './StreetBench';
import { WalkingPerson, PEOPLE_URLS } from './WalkingPerson';
import { SafeModel } from './ModelErrorBoundary';
import { PropModel, PROP_URLS } from './PropModel';
import { getAdVideoTexture } from './adVideo';
import { InspectableObject } from '../../types';

// Swap the LED panel model's screen material ("Glass2Mtl") to play the shared ad
// video (glTF UVs → flipY=false so it's upright). Falls back to the model's own
// baked screen if the video isn't available yet.
const applyAdVideoToPanel = (m: THREE.MeshStandardMaterial): void => {
  if (m.name !== 'Glass2Mtl') return;
  const v = getAdVideoTexture(false);
  if (!v) return;
  // Keep the model's baked image as `map` so the panel still shows something if
  // the video file is missing; the video drives the (bright) emissive channel.
  m.emissiveMap = v;
  m.emissive.set('#ffffff');
  m.emissiveIntensity = 1.15;
  m.toneMapped = false;
  m.needsUpdate = true;
};

interface PlazaParkProps {
  /** Chunk world centre — the monument sits here; the park wraps around it. */
  center: [number, number, number];
}

const GRASS = '#2f6b3a';
const PAVE = '#c7ccd1';
const PAVE_RED = '#9a5b4c';

const TREE_INSPECT: InspectableObject = {
  id: 'park_tree',
  title: 'Xiyobon Daraxti',
  category: 'nature',
  badge: 'XIYOBON',
  description: 'Yodgorlik xiyobonining soyador daraxti.',
  details: [{ label: 'Joylashuvi', value: 'Yodgorlik xiyoboni' }],
};

const BENCH_INSPECT: InspectableObject = {
  id: 'park_bench',
  title: 'Xiyobon O‘rindig‘i',
  category: 'infrastructure',
  badge: 'XIYOBON',
  description: 'Yodgorlik xiyobonida dam olish uchun o‘rindiq.',
  details: [{ label: 'Joylashuvi', value: 'Yodgorlik xiyoboni' }],
};

const VENDING_INSPECT: InspectableObject = {
  id: 'xiyobon_vending',
  title: 'Xiyobon Avtomati (Vending Machine)',
  category: 'infrastructure',
  badge: 'XIYOBON',
  description: 'Yodgorlik xiyobonida ichimlik va gazak sotuvchi avtomat.',
  details: [
    { label: 'Joylashuvi', value: 'Yodgorlik xiyoboni' },
    { label: 'Ish vaqti', value: '24/7' },
  ],
};

const VASE_INSPECT: InspectableObject = {
  id: 'xiyobon_vase',
  title: 'Xiyobon Guldoni',
  category: 'nature',
  badge: 'XIYOBON',
  description: 'Yodgorlik xiyobonini bezovchi katta gulli guldon.',
  details: [{ label: 'Joylashuvi', value: 'Yodgorlik xiyoboni' }],
};

const VASE_HEIGHT = 3.2;        // larger decorative vases (street vases are ~1.75)
const VASE_RADII = [18, 28];    // two concentric vase rings around the centre

const EUD_PANEL_HEIGHT = 3.0;   // standing LED ad panels

const EUD_INSPECT: InspectableObject = {
  id: 'xiyobon_led_panel',
  title: 'Xiyobon LED Reklama Paneli',
  category: 'infrastructure',
  badge: 'REKLAMA',
  description: 'Yodgorlik xiyobonidagi kichik raqamli LED reklama paneli.',
  details: [{ label: 'Joylashuvi', value: 'Yodgorlik xiyoboni' }, { label: 'Turi', value: 'LED Display panel' }],
};

const RINGS = [15, 25, 35];      // concentric ring-path radii
const SPOKES = 8;                // radial paths
const TREE_RADII = [20, 30];     // tree bands between the rings
const TREE_HEIGHT = 9;           // bigger, majestic avenue trees (was ~5.5)

/**
 * A landscaped square/park styled after Amir Temur Square: a paved centre for the
 * monument, concentric ring paths with grass between them, radial spoke paths,
 * and trees + benches in the green bands.
 */
export const PlazaPark: React.FC<PlazaParkProps> = ({ center }) => {
  const spokeAngles = Array.from({ length: SPOKES }, (_, i) => (i * Math.PI * 2) / SPOKES);

  // Trees between the rings, offset half a spoke so they don't sit on the paths.
  const trees: [number, number, number][] = [];
  TREE_RADII.forEach((r) => {
    for (let i = 0; i < SPOKES; i++) {
      const a = ((i + 0.5) * Math.PI * 2) / SPOKES;
      trees.push([Math.cos(a) * r, 0, Math.sin(a) * r]);
    }
  });

  // Big decorative flower vases in two concentric rings around the monument, out
  // on the grass at the half-spoke angles (between the paved paths) so they frame
  // the avenue without blocking a walkway.
  const vases: [number, number, number][] = [];
  VASE_RADII.forEach((r) => {
    for (let i = 0; i < SPOKES; i++) {
      const a = ((i + 0.5) * Math.PI * 2) / SPOKES;
      vases.push([Math.cos(a) * r, 0, Math.sin(a) * r]);
    }
  });

  // A few people strolling the radial paths of the square (Xiyobon).
  const walkers = [0, 3, 5, 6].map((s, i) => {
    const a = (s * Math.PI * 2) / SPOKES;
    return {
      url: i % 2 === 0 ? PEOPLE_URLS.human : PEOPLE_URLS.man,
      start: [Math.cos(a) * 13, 0, Math.sin(a) * 13] as [number, number, number],
      dir: [Math.cos(a), Math.sin(a)] as [number, number],
      length: 20,
      speed: 1.1,
      phase: i * 0.6,
    };
  });

  // Benches along the inner ring, facing the centre.
  const benches: { pos: [number, number, number]; rot: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const a = ((i + 0.5) * Math.PI * 2) / 6;
    benches.push({ pos: [Math.cos(a) * 16.8, 0, Math.sin(a) * 16.8], rot: a + Math.PI / 2 });
  }

  // Four standing LED ad panels on the inner grass ring (r=12.5, between the
  // paved centre and the first ring path), at half-spoke angles so they sit on
  // grass, framing the monument and facing OUTWARD toward the ring walkways.
  // The panel's screen faces its local −Z after auto-standing (mesh normal is
  // +Y in the source), so rot = atan2(−cos a, −sin a) turns it radially out.
  const eudPanels = [0, 1, 2, 3].map((k) => {
    const a = (0.5 + k * 2) * (Math.PI / 4); // 22.5°, 112.5°, 202.5°, 292.5°
    return {
      pos: [Math.cos(a) * 12.5, 0, Math.sin(a) * 12.5] as [number, number, number],
      rot: Math.atan2(-Math.cos(a), -Math.sin(a)), // screen faces radially outward
    };
  });

  // Four vending machines in the avenue, sitting on the GRASS — nudged ~12° off
  // the diagonal spoke paths and kept at r=22 (clear of the ring paths at 15/25
  // and the tree bands at 20/30) so they never block a walkway. The model's
  // glass front is its −X face, so rotationY = −a turns that front toward the
  // monument at the centre.
  const vendingSpots = [1, 3, 5, 7].map((k) => {
    const a = (k * Math.PI) / 4 + 0.21; // diagonal (45°·k) shifted ~12° onto grass
    return {
      pos: [Math.cos(a) * 22, 0, Math.sin(a) * 22] as [number, number, number],
      rot: -a,
    };
  });

  return (
    <group position={center}>
      {/* Grass base (covers the dark plaza). */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={GRASS} roughness={1} />
      </mesh>

      {/* Radial spoke paths. */}
      {spokeAngles.map((a, i) => (
        <group key={`spoke-${i}`} rotation={[0, -a, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[23, 0.016, 0]}>
            <planeGeometry args={[36, 3.2]} />
            <meshStandardMaterial color={PAVE} roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Concentric ring paths. */}
      {RINGS.map((r, i) => (
        <mesh key={`ring-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.017, 0]}>
          <ringGeometry args={[r - 1.6, r + 1.6, 64]} />
          <meshStandardMaterial color={PAVE} roughness={0.9} />
        </mesh>
      ))}

      {/* Paved centre for the monument, with a red-brick inner disc. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.019, 0]} receiveShadow>
        <circleGeometry args={[11, 48]} />
        <meshStandardMaterial color={PAVE} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, 0]}>
        <circleGeometry args={[6, 40]} />
        <meshStandardMaterial color={PAVE_RED} roughness={0.9} />
      </mesh>

      {trees.map((p, i) => (
        <StreetTree key={`pt-${i}`} position={p} inspectData={TREE_INSPECT} physics={false} targetHeight={TREE_HEIGHT} />
      ))}
      {vases.map((p, i) => (
        <SafeModel key={`pvase-${i}`} name="FlowerVase">
          <PropModel url={PROP_URLS.vase} targetHeight={VASE_HEIGHT} position={p} inspect={VASE_INSPECT} collide={false} />
        </SafeModel>
      ))}
      {eudPanels.map((p, i) => (
        <SafeModel key={`eud-${i}`} name="EudLedPanel">
          <PropModel
            url={PROP_URLS.eudPanel}
            targetHeight={EUD_PANEL_HEIGHT}
            autoStand
            position={p.pos}
            rotationY={p.rot}
            inspect={EUD_INSPECT}
            collide={false}
            onMaterial={applyAdVideoToPanel}
          />
        </SafeModel>
      ))}
      {walkers.map((w, i) => (
        <SafeModel key={`pw-${i}`} name="Pedestrian">
          <WalkingPerson params={w} />
        </SafeModel>
      ))}
      {benches.map((b, i) => (
        <StreetBench key={`pb-${i}`} position={b.pos} rotationY={b.rot} variant={i % 2} inspectData={BENCH_INSPECT} physics={false} />
      ))}
      {vendingSpots.map((v, i) => (
        <SafeModel key={`pv-${i}`} name="VendingMachine">
          <PropModel
            url={PROP_URLS.vending}
            targetHeight={1.9}
            position={v.pos}
            rotationY={v.rot}
            inspect={VENDING_INSPECT}
            collide={false}
          />
        </SafeModel>
      ))}
    </group>
  );
};
