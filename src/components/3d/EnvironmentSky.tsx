import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../../stores/useWorldStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const EnvironmentSky: React.FC = () => {
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const shadows = useSettingsStore((s) => s.shadows);
  const playerPosition = useWorldStore((s) => s.playerPosition);

  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const { gl } = useThree();

  // Time-of-day tone-mapping exposure — low by day so the sky doesn't blow out,
  // higher at night so the dim scene stays visible.
  const exposure = timeOfDay === 'night' ? 0.9 : timeOfDay === 'sunset' ? 0.78 : 0.72;
  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);

  // Keep directional light following the player position for optimal shadow
  // resolution. Daytime no longer has a directional sun (intensity 0, see
  // below), so there's nothing to steer then — skip the per-frame work.
  useFrame(() => {
    if (dirLightRef.current && timeOfDay !== 'day') {
      dirLightRef.current.position.set(
        playerPosition[0] + (timeOfDay === 'sunset' ? 40 : 30),
        timeOfDay === 'night' ? 20 : 60,
        playerPosition[2] + (timeOfDay === 'sunset' ? 10 : 30)
      );
      dirLightRef.current.target.position.set(
        playerPosition[0],
        0,
        playerPosition[2]
      );
      dirLightRef.current.target.updateMatrixWorld();
    }
  });

  // Calculate parameters based on timeOfDay.
  //
  // IMPORTANT — why the sky is a flat colour and not drei's <Sky>:
  // drei's <Sky> renders on a mesh scaled to its `distance` (450000 m), which
  // sits far beyond this camera's 450 m far-plane, so it was being clipped and
  // NEVER drawn. The only thing that ever showed was scene.background. So the
  // "sky" IS the background colour here (cheap and reliable), and the clouds /
  // birds / planes add the detail. skyColor is deliberately a SATURATED blue:
  // three tone-maps scene.background (ACES), which desaturates a pale blue
  // toward white — that was the reported "white sky". A saturated blue survives
  // tone-mapping and reads as a proper sky blue.
  //
  // DAY: clear blue sky, no directional "sun shine" (removed per request,
  // dirIntensity 0) — daylight is an even ambient + hemisphere fill.
  let skyColor = '#2f86dc'; // the actual blue sky (kept saturated for ACES)
  let dirColor = '#eaf2ff';
  let dirIntensity = 0.0; // <- sun shine removed (was 0.5)
  let ambColor = '#cfe0f2';
  let ambIntensity = 0.62; // brighter even daylight, makes up for the removed sun
  let fogColor = '#c3dbf2'; // lighter haze so the horizon fades paler than the zenith
  let fogNear = 70;
  let fogFar = 320;

  if (timeOfDay === 'sunset') {
    skyColor = '#e0743a';
    dirColor = '#fdba74';
    dirIntensity = 1.0;
    ambColor = '#ea580c';
    ambIntensity = 0.5;
    fogColor = '#c2410c';
    fogNear = 45;
    fogFar = 230;
  } else if (timeOfDay === 'night') {
    skyColor = '#060a16';
    dirColor = '#38bdf8';
    dirIntensity = 0.3;
    ambColor = '#0f172a';
    ambIntensity = 0.25;
    fogColor = '#020617';
    fogNear = 30;
    fogFar = 200;
  }

  return (
    <>
      {/* 1. Sky background (a flat, tone-mapped colour — the real sky here, see
          the note above) + atmospheric fog for the horizon haze. */}
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[fogColor, fogNear, fogFar]} />

      {/* 2. Night Stars */}
      {timeOfDay === 'night' && (
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      )}

      {/* 3. Ambient & Hemisphere Lighting */}
      <ambientLight color={ambColor} intensity={ambIntensity} />
      <hemisphereLight
        args={[
          timeOfDay === 'night' ? '#1e293b' : '#bae6fd',
          timeOfDay === 'night' ? '#020617' : '#334155',
          ambIntensity * 0.9
        ]}
      />

      {/* 4. Directional Sunlight / Moonlight with Dynamic Shadows */}
      <directionalLight
        ref={dirLightRef}
        /* Day has no sun (intensity 0) so it casts nothing — only sunset keeps a
           warm shadow-casting key light. This also skips the 2048^2 shadow pass
           entirely during the day. */
        castShadow={shadows && timeOfDay === 'sunset'}
        color={dirColor}
        intensity={dirIntensity}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={150}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.0005}
      />
    </>
  );
};
