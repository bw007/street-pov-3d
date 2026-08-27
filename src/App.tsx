import React, { Suspense, useState, useEffect } from 'react';
import { SceneCanvas } from './components/3d/SceneCanvas';
import { HUD } from './components/ui/HUD';
import { Loader2, Compass } from 'lucide-react';

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial loading simulated delay for assets and shaders compilation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

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
              <div className="w-full h-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse" />
            </div>
            <span className="text-[11px] font-mono text-blue-400">Fizika va Ko'chalar Yuklanmoqda...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
