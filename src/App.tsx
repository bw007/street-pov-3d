import React, { Suspense, useState, useEffect } from 'react';
import { useProgress } from '@react-three/drei';
import { SceneCanvas } from './components/3d/SceneCanvas';
import { HUD } from './components/ui/HUD';
import { Loader2, Compass } from 'lucide-react';

export const App: React.FC = () => {
  const { progress, active } = useProgress();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for every GLTF/texture fetch tracked by three's loading manager to
    // actually finish (not a fixed timer) before letting the player click
    // "start" — otherwise clicking to lock the pointer can land right in the
    // middle of the first heavy GPU upload / shader compile for the still-
    // loading models, which is what showed up as a freeze after pressing
    // start. The small delay after progress hits 100% gives the first real
    // frame a chance to paint before the splash is removed.
    if (!active && progress >= 100) {
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [active, progress]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* 1. Main 3D Canvas Scene */}
      <Suspense
        fallback={
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-400">3D Shahar yuklanmoqda...</p>
          </div>
        }
      >
        <SceneCanvas />
      </Suspense>

      {/* 2. Interactive HUD Overlay */}
      <HUD />

      {/* 3. Initial Loading Splash Screen */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white animate-out fade-out duration-700">
          <div className="relative flex flex-col items-center max-w-sm text-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/20 animate-pulse">
              <Compass className="w-10 h-10 text-blue-400" />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white mb-2">
              100+ Ko'chalar Platformasi
            </h1>
            <p className="text-xs text-slate-400 mb-8 leading-relaxed">
              Open-World 3D POV arxitekturasi va realistik shahar tajribasi.
            </p>

            <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                style={{ width: `${Math.round(progress)}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-blue-400">
              3D Modellar Yuklanmoqda... {Math.round(progress)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
