import React, { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Sparkles, Navigation } from 'lucide-react';
import { searchCity } from '../../data/streetsData';
import { StreetData, POIData } from '../../types';
import { useWorldStore } from '../../stores/useWorldStore';
import { soundManager } from '../../audio/SoundManager';

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<{ streets: StreetData[]; pois: POIData[] }>({ streets: [], pois: [] });
  const inputRef = useRef<HTMLInputElement>(null);

  const teleportTo = useWorldStore((s) => s.teleportTo);
  const setSelectedPOI = useWorldStore((s) => s.setSelectedPOI);

  useEffect(() => {
    if (query.trim().length > 0) {
      setResults(searchCity(query));
      setIsOpen(true);
    } else {
      setResults({ streets: [], pois: [] });
      setIsOpen(false);
    }
  }, [query]);

  const handleSelectStreet = (street: StreetData) => {
    soundManager.playClick();
    teleportTo(street.startPos);
    setQuery('');
    setIsOpen(false);
  };

  const handleSelectPOI = (poi: POIData) => {
    soundManager.playPOIDiscovery();
    setSelectedPOI(poi);
    teleportTo(poi.position);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="fixed top-5 left-6 z-40 w-80 max-w-[calc(100vw-3rem)]">
      {/* Search Input Box */}
      <div className="relative glass-panel rounded-2xl flex items-center px-3.5 py-2.5 shadow-2xl border border-white/10 focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
        <Search className="w-4 h-4 text-blue-400 mr-2.5 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="100+ ko'cha yoki bino qidirish..."
          className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (results.streets.length > 0 || results.pois.length > 0) && (
        <div className="absolute top-full mt-2 left-0 w-full glass-panel rounded-2xl p-2 max-h-80 overflow-y-auto shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Streets list */}
          {results.streets.length > 0 && (
            <div className="mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                Ko'chalar ({results.streets.length})
              </span>
              {results.streets.map((st) => (
                <div
                  key={st.id}
                  onClick={() => handleSelectStreet(st)}
                  className="group flex items-center justify-between p-2 rounded-xl hover:bg-blue-600/30 cursor-pointer transition text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white group-hover:text-blue-200 truncate">
                        {st.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {st.district} tumani
                      </div>
                    </div>
                  </div>
                  <Navigation className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}

          {/* POIs list */}
          {results.pois.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 block">
                Diqqatga Sazovor Joylar ({results.pois.length})
              </span>
              {results.pois.map((poi) => (
                <div
                  key={poi.id}
                  onClick={() => handleSelectPOI(poi)}
                  className="group flex items-center justify-between p-2 rounded-xl hover:bg-amber-500/20 cursor-pointer transition text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white group-hover:text-amber-200 truncate">
                        {poi.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {poi.category}
                      </div>
                    </div>
                  </div>
                  <Navigation className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
