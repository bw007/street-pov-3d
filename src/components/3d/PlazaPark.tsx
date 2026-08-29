import React from 'react';
import { StreetTree } from './StreetTree';
import { StreetBench } from './StreetBench';
import { PropModel, PROP_URLS } from './PropModel';
import { SafeModel } from './ModelErrorBoundary';
import { InspectableObject } from '../../types';

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

const RINGS = [15, 25, 35];      // concentric ring-path radii
const SPOKES = 8;                // radial paths
const TREE_RADII = [20, 30];     // deciduous tree bands between the rings
const FIR_RADIUS = 25;           // fir trees interspersed between the two bands
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

  // Fir trees on the same radial lines, between the two deciduous bands.
  const firs: [number, number, number][] = Array.from({ length: SPOKES }, (_, i) => {
    const a = ((i + 0.5) * Math.PI * 2) / SPOKES;
    return [Math.cos(a) * FIR_RADIUS, 0, Math.sin(a) * FIR_RADIUS];
  });

  // Benches along the inner ring, facing the centre.
  const benches: { pos: [number, number, number]; rot: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const a = ((i + 0.5) * Math.PI * 2) / 6;
    benches.push({ pos: [Math.cos(a) * 16.8, 0, Math.sin(a) * 16.8], rot: a + Math.PI / 2 });
  }

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
      {firs.map((p, i) => (
        <SafeModel key={`pf-${i}`} name="FirTree">
          <PropModel url={PROP_URLS.fur} targetHeight={8.5} preRotateX={-Math.PI / 2} collide={false} position={p} />
        </SafeModel>
      ))}
      {benches.map((b, i) => (
        <StreetBench key={`pb-${i}`} position={b.pos} rotationY={b.rot} variant={i % 2} inspectData={BENCH_INSPECT} physics={false} />
      ))}
    </group>
  );
};
