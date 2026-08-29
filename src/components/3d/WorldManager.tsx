import React, { useMemo, useEffect, useRef } from 'react';
import { useWorldStore } from '../../stores/useWorldStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { getSurroundingChunks } from '../../utils/math';
import { StreetChunk } from './StreetChunk';

export const WorldManager: React.FC = () => {
  const activeChunk = useWorldStore((s) => s.activeChunk);
  const quality = useSettingsStore((s) => s.quality);

  // TEMP DIAGNOSTIC — logs when activeChunk changes so long tasks logged by
  // main.tsx can be matched up against chunk streaming. Safe to remove once
  // the freeze's cause is found.
  const prevChunkRef = useRef(activeChunk);
  useEffect(() => {
    if (prevChunkRef.current.x !== activeChunk.x || prevChunkRef.current.z !== activeChunk.z) {
      // eslint-disable-next-line no-console
      console.warn(`[CHUNK] activeChunk -> ${activeChunk.x},${activeChunk.z} at t=${performance.now().toFixed(0)}ms`);
      prevChunkRef.current = activeChunk;
    }
  }, [activeChunk]);

  // Low quality only streams the chunk the player is standing in (radius 0) to
  // cut draw calls, RigidBody colliders and lights roughly 9x; medium/high keep
  // the full 3x3 grid (9 chunks) around the player for seamless streaming.
  const chunkRadius = quality === 'low' ? 0 : 1;

  const visibleChunks = useMemo(() => {
    return getSurroundingChunks(activeChunk, chunkRadius);
  }, [activeChunk, chunkRadius]);

  return (
    <group>
      {visibleChunks.map((c) => (
        <StreetChunk key={`chunk-${c.x}-${c.z}`} chunkX={c.x} chunkZ={c.z} />
      ))}
    </group>
  );
};
