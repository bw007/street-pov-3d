import React from 'react';
import { useWorldStore } from '../../stores/useWorldStore';
import { MapPin, Compass, Gauge } from 'lucide-react';

export const StreetNameBanner: React.FC = () => {
  const currentStreet = useWorldStore((s) => s.currentStreet);

  if (!currentStreet) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-500 ease-out">
      <div className="glass-panel px-6 py-3 rounded-2xl flex items-center gap-4 text-white shadow-2xl border border-blue-500/30">
        <div className="p-2.5 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40">
          <MapPin className="w-5 h-5 animate-pulse" />
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white">{currentStreet.name}</h1>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
              {currentStreet.district} tumani
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-300 mt-0.5">
            <span className="flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              Uzunligi: {currentStreet.lengthMeters} m
            </span>
            <span className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              Tezlik: {currentStreet.speedLimit || 60} km/soat
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
