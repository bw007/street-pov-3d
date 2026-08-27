import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../../stores/useWorldStore';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const EnvironmentSky: React.FC = () => {
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const shadows = useSettingsStore((s) => s.shadows);
  const playerPosition = useWorldStore((s) => s.playerPosition);

  const dirLightRef = useRef<THREE.DirectionalLight>(null);

  // Keep directional light following the player position for optimal shadow resolution
  useFrame(() => {
    if (dirLightRef.current) {
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

  // Calculate parameters based on timeOfDay
  let sunPosition: [number, number, number] = [100, 40, 100];
  let dirColor = '#ffffff';
  let dirIntensity = 1.6;
  let ambColor = '#94a3b8';
  let ambIntensity = 0.6;
  let fogColor = '#cbd5e1';
  let turbidity = 8;
  let rayleigh = 2;
  let mieCoefficient = 0.005;
  let mieDirectionalG = 0.8;

  if (timeOfDay === 'sunset') {
    sunPosition = [100, 4, 20];
    dirColor = '#fdba74';
    dirIntensity = 1.4;
    ambColor = '#ea580c';
    ambIntensity = 0.5;
    fogColor = '#c2410c';
    turbidity = 20;
    rayleigh = 4;
  } else if (timeOfDay === 'night') {
    sunPosition = [0, -50, 0];
    dirColor = '#38bdf8';
    dirIntensity = 0.3;
    ambColor = '#0f172a';
    ambIntensity = 0.25;
    fogColor = '#020617';
    turbidity = 1;
    rayleigh = 0.5;
  }

  return (
    <>
      {/* 1. Atmospheric Fog */}
      <color attach="background" args={[fogColor]} />
      <fog attach="fog" args={[fogColor, 40, 220]} />

      {/* 2. Procedural Sky / Atmosphere */}
      <Sky
        distance={450000}
        sunPosition={sunPosition}
        turbidity={turbidity}
        rayleigh={rayleigh}
        mieCoefficient={mieCoefficient}
        mieDirectionalG={mieDirectionalG}
      />

      {/* 3. Night Stars */}
      {timeOfDay === 'night' && (
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      )}

      {/* 4. Ambient & Hemisphere Lighting */}
      <ambientLight color={ambColor} intensity={ambIntensity} />
      <hemisphereLight
        args={[
          timeOfDay === 'night' ? '#1e293b' : '#bae6fd',
          timeOfDay === 'night' ? '#020617' : '#334155',
          ambIntensity * 0.8
        ]}
      />

      {/* 5. Directional Sunlight / Moonlight with Dynamic Shadows */}
      <directionalLight
        ref={dirLightRef}
        castShadow={shadows && timeOfDay !== 'night'}
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
