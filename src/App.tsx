import React, { Suspense, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { SceneCanvas } from './components/3d/SceneCanvas';
import { HUD } from './components/ui/HUD';
import { OnboardingSplash } from './components/ui/OnboardingSplash';

export const App: React.FC = () => {
  const { progress, active } = useProgress();
  const [isLoading, setIsLoading] = useState(true);

  // "Ready" = every GLTF/texture fetch tracked by three's loading manager has
  // finished. The scene has been rendering behind the splash the whole time, so
  // by the time the user taps "enter" the first frames are already warm — no
  // freeze on entry, and the tap is a real user gesture (good for pointer lock).
  const ready = !active && progress >= 100;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b2e22]">
      {/* 1. Main 3D Canvas Scene (renders behind the splash while it loads) */}
      <Suspense fallback={<div className="w-full h-full bg-[#0b2e22]" />}>
        <SceneCanvas />
      </Suspense>

      {/* 2. Interactive HUD Overlay */}
      <HUD />

      {/* 3. Branded CHINOR 100 onboarding / loading splash */}
      {isLoading && (
        <OnboardingSplash progress={progress} ready={ready} onStart={() => setIsLoading(false)} />
      )}
    </div>
  );
};

export default App;
