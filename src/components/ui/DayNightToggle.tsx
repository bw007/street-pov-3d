import React from 'react';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { Sun, Sunset, Moon } from 'lucide-react';

export const DayNightToggle: React.FC = () => {
  const timeOfDay = useWorldStore((s) => s.timeOfDay);
  const setTimeOfDay = useWorldStore((s) => s.setTimeOfDay);

  const handleSelect = (time: 'day' | 'sunset' | 'night') => {
    soundManager.playClick();
    setTimeOfDay(time);
  };

  return (
    <div className="fixed top-5 right-6 z-30 flex items-center p-1 rounded-2xl glass-panel border border-white/10 shadow-2xl">
      <button
        onClick={() => handleSelect('day')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
          timeOfDay === 'day'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Kunduzgi yorug'lik"
      >
        <Sun className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Kun</span>
      </button>

      <button
        onClick={() => handleSelect('sunset')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
          timeOfDay === 'sunset'
            ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Quyosh botishi"
      >
        <Sunset className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Botish</span>
      </button>

      <button
        onClick={() => handleSelect('night')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
          timeOfDay === 'night'
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Tungi yorug'lik"
      >
        <Moon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Tun</span>
      </button>
    </div>
  );
};
