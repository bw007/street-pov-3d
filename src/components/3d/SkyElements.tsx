import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Clouds, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../../stores/useWorldStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { PlaneModel } from './PlaneModel';
import { SeagullBird, BirdFlightParams } from './SeagullBird';
import { SafeModel } from './ModelErrorBoundary';

/**
 * Decorative atmosphere layer: drifting clouds, a flock of birds and a few
 * high-altitude airplanes.
 *
 * Performance rules this file sticks to (the whole point — extra models must not
 * hurt the frame rate):
 *  - Everything lives OUTSIDE <Physics>: no colliders, no raycasting.
 *  - Nothing casts or receives shadows.
 *  - Birds and the plane are shared GLBs cloned per copy (the seagull is skinned
 *    with its own flap animation + mixer per bird).
 *  - Clouds are batched by drei's <Clouds> into ONE draw call, with an UNLIT
 *    (MeshBasicMaterial) white material so they stay bright white — the scene has
 *    no sun, and a lit cloud material rendered as dark grey blobs.
 *  - The whole layer is parented to one group that tracks the player on XZ, so
 *    it stays centred on the camera with a single store read per frame (each
 *    element then animates in cheap LOCAL space around the origin).
 *  - Element counts scale down with the graphics-quality setting.
 */

// ---------------------------------------------------------------------------
// Birds
// ---------------------------------------------------------------------------

const Birds: React.FC<{ count: number }> = ({ count }) => {
  const flock = useMemo<BirdFlightParams[]>(() => {
    const arr: BirdFlightParams[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        heading: i * 2.399963, // golden-angle -> each bird a different direction
        lateral: ((i % 9) - 4) * 16, // spread across the sky, not one lane
        height: 60 + ((i * 13) % 55), // ABOVE the buildings -> ~60..115 m
        speed: 4 + (i % 4) * 1.6, // gentle, varied cruise
        offset: i * 41, // desync where each bird is along its path
        span: 700, // wraps far away, hidden beyond the fog
        flapSpeed: 0.9 + (i % 4) * 0.15, // slightly different wing-beat per bird
        bob: 2 + (i % 3) * 1.2,
        size: 0.22 + (i % 3) * 0.09, // smaller still
        animOffset: (i % 5) * 0.31, // desync where each bird is in its flap cycle
      });
    }
    return arr;
  }, [count]);

  return (
    <>
      {flock.map((p, i) => (
        <SeagullBird key={i} params={p} />
      ))}
    </>
  );
};

// ---------------------------------------------------------------------------
// Airplanes
// ---------------------------------------------------------------------------

interface PlaneParams {
  heading: number;
  lateral: number;
  height: number;
  speed: number;
  offset: number;
  span: number;
  bank: number;
  scale: number;
}

const Airplane: React.FC<{ params: PlaneParams }> = ({ params }) => {
  const group = useRef<THREE.Group>(null!);
  const dx = Math.cos(params.heading);
  const dz = Math.sin(params.heading);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    // Straight, slow cruise that wraps across a span far larger than the fog
    // distance, so the wrap-around happens out of sight (fogged into the sky).
    const prog = ((t * params.speed + params.offset) % params.span) - params.span / 2;
    group.current.position.set(
      -dz * params.lateral + dx * prog,
      params.height,
      dx * params.lateral + dz * prog
    );
  });

  return (
    // The GLB's nose points +Z; rotate so +Z aligns to the heading vector.
    <group
      ref={group}
      rotation={[0, Math.PI / 2 - params.heading, params.bank]}
      scale={params.scale}
    >
      <PlaneModel />
    </group>
  );
};

const Airplanes: React.FC<{ count: number }> = ({ count }) => {
  const planes = useMemo<PlaneParams[]>(() => {
    const arr: PlaneParams[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        heading: (i * Math.PI) / 3 + 0.4,
        lateral: -120 + i * 80, // perpendicular offset so they don't share a lane
        height: 80 + (i % 3) * 18, // high above the city, close enough to read through haze
        speed: 9 + (i % 3) * 4,
        offset: i * 130,
        span: 900, // wrap-around distance (well beyond the fog, so it's hidden)
        bank: (i % 2 === 0 ? 1 : -1) * 0.05,
        scale: 1.6 + (i % 3) * 0.5,
      });
    }
    return arr;
  }, [count]);

  return (
    <>
      {planes.map((p, i) => (
        <Airplane key={i} params={p} />
      ))}
    </>
  );
};

// ---------------------------------------------------------------------------
// Clouds  (unlit white — the scene has no sun, so a lit cloud goes dark)
// ---------------------------------------------------------------------------

const SkyClouds: React.FC<{ count: number; color: string }> = ({ count, color }) => {
  const defs = useMemo(() => {
    const arr: {
      pos: [number, number, number];
      bounds: [number, number, number];
      seg: number;
      vol: number;
      speed: number;
    }[] = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      arr.push({
        pos: [Math.cos(a) * (85 + (i % 3) * 35), 70 + (i % 3) * 18, Math.sin(a) * (85 + (i % 2) * 45)],
        bounds: [30 + (i % 3) * 10, 6, 26 + (i % 2) * 10],
        seg: 18 + (i % 3) * 6,
        vol: 11 + (i % 3) * 4,
        speed: 0.12 + (i % 3) * 0.05,
      });
    }
    return arr;
  }, [count]);

  return (
    // Unlit MeshBasicMaterial => always bright white regardless of the (sun-less)
    // lighting; batched into one draw call by <Clouds>.
    <Clouds material={THREE.MeshBasicMaterial} limit={320} frustumCulled={false}>
      {defs.map((d, i) => (
        <Cloud
          key={i}
          seed={i + 1}
          position={d.pos}
          bounds={d.bounds}
          segments={d.seg}
          volume={d.vol}
          opacity={0.8}
          speed={d.speed}
          growth={4}
          color={color}
        />
      ))}
    </Clouds>
  );
};

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export const SkyElements: React.FC = () => {
  const quality = useSettingsStore((s) => s.quality);
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const followRef = useRef<THREE.Group>(null!);

  // Single store read per frame keeps the whole sky layer centred on the player.
  useFrame(() => {
    const p = useWorldStore.getState().playerPosition;
    if (followRef.current) followRef.current.position.set(p[0], 0, p[2]);
  });

  const isLow = quality === 'low';
  const isNight = timeOfDay === 'night';
  const isSunset = timeOfDay === 'sunset';

  // Birds/clouds hidden at night (stars carry the night sky); planes keep flying
  // and dim naturally under the low night ambient light.
  const cloudCount = isNight || isLow ? 0 : quality === 'medium' ? 4 : 6;
  const birdCount = isNight ? 0 : isLow ? 4 : quality === 'medium' ? 8 : 12;
  const planeCount = isLow ? 2 : quality === 'medium' ? 3 : 4;
  const cloudColor = isSunset ? '#ffe6c7' : '#ffffff';

  return (
    <group ref={followRef}>
      {cloudCount > 0 && <SkyClouds count={cloudCount} color={cloudColor} />}
      {birdCount > 0 && (
        <SafeModel name="Seagulls">
          <Birds count={birdCount} />
        </SafeModel>
      )}
      {planeCount > 0 && (
        <SafeModel name="Airplanes">
          <Airplanes count={planeCount} />
        </SafeModel>
      )}
    </group>
  );
};
