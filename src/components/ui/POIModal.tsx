import React, { useState } from 'react';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';
import { X, Volume2, VolumeX, Navigation, Star, Clock, MapPin, Sparkles } from 'lucide-react';

export const POIModal: React.FC = () => {
  const selectedPOI = useWorldStore((s) => s.selectedPOI);
  const setSelectedPOI = useWorldStore((s) => s.setSelectedPOI);
  const teleportTo = useWorldStore((s) => s.teleportTo);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!selectedPOI) return null;

  const handleClose = () => {
    soundManager.stopAudioGuide();
    setIsPlayingAudio(false);
    setSelectedPOI(null);
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      soundManager.stopAudioGuide();
      setIsPlayingAudio(false);
    } else {
      const textToSpeak = `${selectedPOI.name}. ${selectedPOI.description}. ${selectedPOI.fullHistory || ''}`;
      soundManager.speakAudioGuide(textToSpeak);
      setIsPlayingAudio(true);
    }
  };

  const handleTeleport = () => {
    soundManager.playClick();
    teleportTo(selectedPOI.position);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl overflow-hidden shadow-2xl border border-blue-500/30 text-white animate-in zoom-in-95 duration-200">
        {/* Header Image / Pattern */}
        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900">
          {selectedPOI.imageUrl ? (
            <img
              src={selectedPOI.imageUrl}
              alt={selectedPOI.name}
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-blue-400/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur border border-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Category Pill */}
          <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600/90 text-xs font-semibold backdrop-blur text-white shadow-lg">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="capitalize">{selectedPOI.category}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{selectedPOI.name}</h2>
              <div className="flex items-center gap-2 text-xs text-blue-400 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Ko'cha ID: {selectedPOI.streetId}</span>
              </div>
            </div>
            {selectedPOI.rating && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{selectedPOI.rating}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {selectedPOI.description}
          </p>

          {selectedPOI.fullHistory && (
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 mb-5 text-xs text-slate-300 leading-relaxed">
              <span className="font-semibold text-blue-400 block mb-1">📖 Tarixi va Ma'lumot:</span>
              {selectedPOI.fullHistory}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
            {selectedPOI.hours && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Ish vaqti: {selectedPOI.hours}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleToggleAudio}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-xs transition-all border ${
                isPlayingAudio
                  ? 'bg-amber-600/30 border-amber-500 text-amber-200'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 border-white/10 text-white'
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <VolumeX className="w-4 h-4 text-amber-400 animate-pulse" />
                  Gidni To'xtatish
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-blue-400" />
                  Ovozli Gidni Tinglash
                </>
              )}
            </button>

            <button
              onClick={handleTeleport}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all"
            >
              <Navigation className="w-4 h-4" />
              U Yerga O'tish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
