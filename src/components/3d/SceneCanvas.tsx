import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { EnvironmentSky } from './EnvironmentSky';
import { SkyElements } from './SkyElements';
import { WorldManager } from './WorldManager';
import { PlayerController } from './PlayerController';
import { InteractionRaycaster } from './InteractionRaycaster';
import { useSettingsStore } from '../../stores/useSettingsStore';

export const SceneCanvas: React.FC = () => {
  const fov = useSettingsStore((s) => s.fov);
  const bloom = useSettingsStore((s) => s.bloom);
  const quality = useSettingsStore((s) => s.quality);

  const dpr = quality === 'low' ? 1 : quality === 'medium' ? 1.5 : Math.min(window.devicePixelRatio, 2);

  return (
    <Canvas
      shadows
      dpr={dpr}
      camera={{
        fov: fov,
        near: 0.1,
        far: 450,
        position: [0, 1.8, 0],
      }}
      gl={{
        antialias: quality !== 'low',
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        // `localClippingEnabled` is a property set on the renderer instance,
        // not a WebGLRenderer constructor option — passing it through the
        // `gl` prop above gets silently dropped (R3F spreads `gl` straight
        // into `new THREE.WebGLRenderer({...})`, which only reads its own
        // known constructor keys). Bibi Khanym relies on a per-material
        // clipping plane to hide raw scan terrain baked into its geometry
        // (see UzbekBibiKhanym.tsx), which needs this actually turned on.
        gl.localClippingEnabled = true;
        // Initial daytime exposure (EnvironmentSky then keeps this in sync with
        // time-of-day). Matches the day value there so there's no first-frame flash.
        gl.toneMappingExposure = 0.72;
      }}
      className="w-full h-full"
    >
      {/* 1. Dynamic Atmosphere & Lights */}
      <EnvironmentSky />

      {/* 1b. Decorative sky life — clouds, flapping birds, high-altitude planes.
          Outside <Physics>, no shadows/colliders, counts scale with quality. */}
      <SkyElements />

      {/* 2. Raycaster for POV Center Screen Crosshair Object Inspection */}
      <InteractionRaycaster />

      {/* 3. Rapier Physics Simulation Engine */}
      <Physics gravity={[0, -22, 0]} timeStep="vary">
        {/* POV First Person Player */}
        <PlayerController />

        {/* 100+ Streets Open-World Stream Manager */}
        <WorldManager />
      </Physics>

      {/* 4. Cinematic Post-Processing */}
      {bloom && quality !== 'low' && (
        <EffectComposer enableNormalPass={false} multisampling={0}>
          <Bloom
            luminanceThreshold={0.95}
            luminanceSmoothing={0.3}
            intensity={0.7}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.1} darkness={0.6} />
        </EffectComposer>
      )}
    </Canvas>
  );
};
