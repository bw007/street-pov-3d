import React from 'react';
import { StreetNameBanner } from './StreetNameBanner';
import { Minimap } from './Minimap';
import { SearchBar } from './SearchBar';
import { DayNightToggle } from './DayNightToggle';
import { POIModal } from './POIModal';
import { ObjectInspectModal } from './ObjectInspectModal';
import { SettingsModal } from './SettingsModal';
import { MobileControls } from './MobileControls';
import { ControlsOverlay } from './ControlsOverlay';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { Settings, Volume2, VolumeX, Sparkles, ChevronRight } from 'lucide-react';

export const HUD: React.FC = () => {
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen);
  const isMuted = useSettingsStore((s) => s.isMuted);
  const toggleMute = useSettingsStore((s) => s.toggleMute);
  const isPointerLocked = useSettingsStore((s) => s.isPointerLocked);
  
  const hoveredObject = useWorldStore((s) => s.hoveredObject);
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMute();
    soundManager.setMuted(!isMuted);
  };

  const handleOpenSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundManager.playClick();
    setSettingsOpen(true);
  };

  const handleOpenObjectModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hoveredObject) {
      soundManager.playClick();
      setInspectedObject(hoveredObject);
    }
  };

  return (
    <>
      {/* POV Center Crosshair (Minimal & Clean, never obscures the view) */}
      {isPointerLocked && (
        <div className={`pov-crosshair ${hoveredObject ? 'active' : ''}`} />
      )}

      {/* 
        Sleek, Compact Bottom Toast Indicator 
        (Appears neatly at the bottom without blocking screen center) 
      */}
      {hoveredObject && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <button
            onClick={handleOpenObjectModal}
            className="group glass-panel px-4 py-2 rounded-2xl flex items-center gap-3 text-white border border-blue-500/40 hover:border-blue-400 bg-slate-950/85 hover:bg-slate-900/95 shadow-2xl shadow-blue-500/25 transition-all transform hover:scale-[1.03] active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-600 text-[11px] font-bold tracking-wider font-mono text-white shadow-sm">
              <Sparkles className="w-3 h-3 text-blue-200 animate-pulse" />
              <span>[E]</span>
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-100 line-clamp-1 max-w-[240px]">
                {hoveredObject.title}
              </span>
              <span className="text-[10px] text-blue-300/80 font-medium">
                Batafsil ma'lumot olish
              </span>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition" />
          </button>
        </div>
      )}

      {/* Top Street Banner */}
      <StreetNameBanner />

      {/* Top Left Search Bar */}
      <SearchBar />

      {/* Top Right Day/Night & Action Controls */}
      <div className="fixed top-5 right-6 z-30 flex items-center gap-2">
        <DayNightToggle />

        {/* Audio Mute Button */}
        <button
          onClick={handleMuteToggle}
          className="p-2.5 rounded-2xl glass-panel border border-white/10 text-slate-300 hover:text-white shadow-2xl transition"
          title={isMuted ? 'Ovozni yoqish' : "Ovozni o'chirish"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Settings Button */}
        <button
          onClick={handleOpenSettings}
          className="p-2.5 rounded-2xl glass-panel border border-white/10 text-slate-300 hover:text-white shadow-2xl transition"
          title="Sozlamalar"
        >
          <Settings className="w-4 h-4 text-blue-400" />
        </button>
      </div>

      {/* Bottom Right Minimap */}
      <Minimap />

      {/* Desktop Controls overlay */}
      <ControlsOverlay />

      {/* Mobile Virtual Touch Controls */}
      <MobileControls />

      {/* POI Modal Details */}
      <POIModal />

      {/* 3D Object Inspect Modal (Full Dialog when user requests it) */}
      <ObjectInspectModal />

      {/* Settings Modal */}
      <SettingsModal />
    </>
  );
};
