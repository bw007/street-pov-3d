import React from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { MousePointer2, Move, Zap, ArrowUp } from 'lucide-react';

export const ControlsOverlay: React.FC = () => {
  const isPointerLocked = useSettingsStore((s) => s.isPointerLocked);

  const requestLock = () => {
    document.body.requestPointerLock?.();
  };

  return (
    <>
      {/* 1. Click to Lock Pointer Prompt */}
      {!isPointerLocked && (
        <div
          onClick={requestLock}
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-xs cursor-pointer select-none animate-in fade-in duration-300"
        >
          <div className="glass-panel px-8 py-6 rounded-3xl text-center max-w-sm mx-4 border border-blue-500/40 shadow-2xl transform hover:scale-105 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center mx-auto mb-3">
              <MousePointer2 className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">POV Ko'chada Yurish</h3>
            <p className="text-xs text-slate-300 mb-4">
              Sichqonchani qulflash va ko'chani 360° erkin aylanib tomosha qilish uchun ekranni bosing.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-lg shadow-blue-500/30">
              Boshlash uchun bosing
            </div>
          </div>
        </div>
      )}

      {/* 2. Bottom-left Keyboard Controls Guide (Only in Desktop) */}
      <div className="fixed bottom-6 left-6 z-20 hidden md:flex items-center gap-2 glass-pill px-4 py-2.5 rounded-2xl text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5 font-mono">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">W</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">A</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">S</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">D</kbd>
          <span className="text-slate-400 flex items-center gap-1 ml-1"><Move className="w-3 h-3" /> Yurish</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-1">
          <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold font-mono">Shift</kbd>
          <span className="text-slate-400 flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> Yugurish</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-1">
          <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold font-mono">Space</kbd>
          <span className="text-slate-400 flex items-center gap-1"><ArrowUp className="w-3 h-3" /> Sakrash</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold font-mono">ESC</kbd>
          <span className="text-slate-400">Chiqish</span>
        </div>
      </div>
    </>
  );
};
