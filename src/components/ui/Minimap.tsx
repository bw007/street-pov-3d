import React, { useRef, useEffect, useState } from 'react';
import { useWorldStore } from '../../stores/useWorldStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { STREETS_DATA, CHUNK_SIZE } from '../../data/streetsData';
import { Maximize2, Minimize2, Navigation } from 'lucide-react';

export const Minimap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const showMinimap = useSettingsStore((s) => s.showMinimap);
  const [isExpanded, setIsExpanded] = useState(false);

  const playerPosition = useWorldStore((s) => s.playerPosition);
  const playerRotation = useWorldStore((s) => s.playerRotation);
  const currentStreet = useWorldStore((s) => s.currentStreet);
  const lastDrawRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showMinimap) return;

    // Player position updates every physics frame (~60/s); redrawing the full
    // radar (100+ streets + POIs) that often is wasted work on the main thread.
    // Throttle to ~10fps, which is plenty smooth for a minimap.
    const now = performance.now();
    if (now - lastDrawRef.current < 100) return;
    lastDrawRef.current = now;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Scale: meters to pixels
    const scale = isExpanded ? 0.45 : 0.85;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // 1. Radar background circle & grid
    ctx.save();
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Concentric range rings
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.lineWidth = 1;
    [30, 60, 90, 120].forEach((r) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r * scale, 0, Math.PI * 2);
      ctx.stroke();
    });

    // 2. Draw surrounding streets & roads relative to player position
    ctx.save();
    ctx.translate(centerX, centerY);

    const playerX = playerPosition[0];
    const playerZ = playerPosition[2];

    STREETS_DATA.forEach((st) => {
      const [chunkX, chunkZ] = st.centerChunk;
      const stWorldX = chunkX * CHUNK_SIZE;
      const stWorldZ = chunkZ * CHUNK_SIZE;

      // Check if within radar view
      const relX = (stWorldX - playerX) * scale;
      const relZ = (stWorldZ - playerZ) * scale;

      const roadW = 14 * scale;
      const roadLen = CHUNK_SIZE * scale;

      // Draw road intersection lines
      ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.fillRect(relX - roadW / 2, relZ - roadLen / 2, roadW, roadLen);
      ctx.fillRect(relX - roadLen / 2, relZ - roadW / 2, roadLen, roadW);

      // Draw POI dots
      st.pois.forEach((poi) => {
        const poiRelX = (poi.position[0] - playerX) * scale;
        const poiRelZ = (poi.position[2] - playerZ) * scale;

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(poiRelX, poiRelZ, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    ctx.restore();

    // 3. Draw Player Vision FOV Cone & Position Dot
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(playerRotation);

    // FOV Cone
    ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 45, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5);
    ctx.closePath();
    ctx.fill();

    // Player Direction Arrow
    ctx.fillStyle = '#3b82f6';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // 4. North Indicator
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', centerX, 14);
    ctx.restore();

  }, [playerPosition, playerRotation, showMinimap, isExpanded]);

  if (!showMinimap) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-30 transition-all duration-300 ${isExpanded ? 'w-80 h-80' : 'w-48 h-48'}`}>
      <div className="relative w-full h-full rounded-2xl glass-panel p-2.5 shadow-2xl flex flex-col overflow-hidden border border-blue-500/30">
        {/* Header with expand toggle */}
        <div className="flex items-center justify-between pb-1 text-xs text-slate-300">
          <span className="font-semibold text-white flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            Radar / GPS
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Canvas Radar */}
        <canvas
          ref={canvasRef}
          width={isExpanded ? 300 : 180}
          height={isExpanded ? 240 : 140}
          className="w-full h-full rounded-xl"
        />

        {/* Current Street Tag */}
        <div className="pt-1.5 text-[10px] text-blue-300 truncate font-mono">
          {currentStreet ? `📍 ${currentStreet.name}` : 'Xarita'}
        </div>
      </div>
    </div>
  );
};
