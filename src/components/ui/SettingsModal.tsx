import React from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { soundManager } from '../../audio/SoundManager';
import { Settings, X, Sliders, Volume2, VolumeX, Monitor, Eye, Map } from 'lucide-react';
import { GraphicsQuality } from '../../types';

export const SettingsModal: React.FC = () => {
  const isSettingsOpen = useSettingsStore((s) => s.isSettingsOpen);
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen);

  const quality = useSettingsStore((s) => s.quality);
  const setQuality = useSettingsStore((s) => s.setQuality);

  const shadows = useSettingsStore((s) => s.shadows);
  const setShadows = useSettingsStore((s) => s.setShadows);

  const bloom = useSettingsStore((s) => s.bloom);
  const setBloom = useSettingsStore((s) => s.setBloom);

  const isMuted = useSettingsStore((s) => s.isMuted);
  const toggleMute = useSettingsStore((s) => s.toggleMute);

  const showMinimap = useSettingsStore((s) => s.showMinimap);
  const toggleMinimap = useSettingsStore((s) => s.toggleMinimap);

  const fov = useSettingsStore((s) => s.fov);
  const setFov = useSettingsStore((s) => s.setFov);

  if (!isSettingsOpen) return null;

  const handleMuteChange = () => {
    toggleMute();
    soundManager.setMuted(!isMuted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-white/10 text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-white">Grafika & Sozlamalar</h2>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quality Preset */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2.5">
            <Monitor className="w-4 h-4 text-blue-400" />
            Grafika Sifati (Presets)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['low', 'medium', 'high', 'ultra'] as GraphicsQuality[]).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                  quality === q
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Detail Toggles */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/50 border border-white/5">
            <span className="text-xs text-slate-300 flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              Dinamik Soyalar (Shadows)
            </span>
            <input
              type="checkbox"
              checked={shadows}
              onChange={(e) => setShadows(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 bg-slate-800 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/50 border border-white/5">
            <span className="text-xs text-slate-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              Nurlanish (Bloom & Glow)
            </span>
            <input
              type="checkbox"
              checked={bloom}
              onChange={(e) => setBloom(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 bg-slate-800 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/50 border border-white/5">
            <span className="text-xs text-slate-300 flex items-center gap-2">
              <Map className="w-4 h-4 text-emerald-400" />
              2D Radar / Minimap
            </span>
            <input
              type="checkbox"
              checked={showMinimap}
              onChange={() => toggleMinimap()}
              className="w-4 h-4 rounded text-blue-600 bg-slate-800 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* FOV Slider */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-slate-300 mb-1.5">
            <span>Kamera Ko'rish Burchagi (FOV)</span>
            <span className="font-mono text-blue-400 font-bold">{fov}°</span>
          </div>
          <input
            type="range"
            min="60"
            max="95"
            value={fov}
            onChange={(e) => setFov(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/50 border border-white/5 mb-4">
          <span className="text-xs text-slate-300 flex items-center gap-2">
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            Ovozlar va Audio-gid
          </span>
          <button
            onClick={handleMuteChange}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
              isMuted ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            {isMuted ? "O'chirilgan" : 'Yoqilgan'}
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={() => setSettingsOpen(false)}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-lg shadow-blue-500/25 transition"
        >
          Saqlash va Yopish
        </button>
      </div>
    </div>
  );
};
