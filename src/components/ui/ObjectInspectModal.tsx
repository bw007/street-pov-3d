import React, { useState } from 'react';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { X, Volume2, VolumeX, Building2, Car, Store, Trees, Sparkles, ShieldCheck } from 'lucide-react';

const CATEGORY_ICONS = {
  building: Building2,
  vehicle: Car,
  shop: Store,
  infrastructure: ShieldCheck,
  landmark: Sparkles,
  nature: Trees,
};

export const ObjectInspectModal: React.FC = () => {
  const inspectedObject = useWorldStore((s) => s.inspectedObject);
  const setInspectedObject = useWorldStore((s) => s.setInspectedObject);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!inspectedObject) return null;

  const handleClose = () => {
    soundManager.stopAudioGuide();
    setIsPlayingAudio(false);
    setInspectedObject(null);
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      soundManager.stopAudioGuide();
      setIsPlayingAudio(false);
    } else {
      const detailsSummary = inspectedObject.details.map((d) => `${d.label}: ${d.value}`).join('. ');
      const textToSpeak = `${inspectedObject.title}. ${inspectedObject.description}. ${detailsSummary}`;
      soundManager.speakAudioGuide(textToSpeak);
      setIsPlayingAudio(true);
    }
  };

  const IconComponent = CATEGORY_ICONS[inspectedObject.category] || Building2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-blue-500/30 text-white animate-in zoom-in-95 duration-200">
        {/* Header with Icon and Close Button */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-600/30 text-blue-400 border border-blue-500/40">
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                  {inspectedObject.badge}
                </span>
                {inspectedObject.streetName && (
                  <span className="text-[11px] text-slate-400">
                    📍 {inspectedObject.streetName}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white mt-1 leading-snug">
                {inspectedObject.title}
              </h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          {inspectedObject.description}
        </p>

        {/* Specifications / Key Details Grid */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {inspectedObject.details.map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-2xl bg-slate-900/60 border border-white/5">
              <div className="text-[10px] text-slate-400">{item.label}</div>
              <div className="text-xs font-semibold text-white mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleToggleAudio}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-medium text-xs transition-all border ${
              isPlayingAudio
                ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                : 'bg-slate-800/80 hover:bg-slate-700/80 border-white/10 text-white'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                To'xtatish
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                Ovozli Tavsif
              </>
            )}
          </button>

          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-semibold text-xs text-white shadow-lg shadow-blue-500/25 transition"
          >
            Tushundim
          </button>
        </div>
      </div>
    </div>
  );
};
