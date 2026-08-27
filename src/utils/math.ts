import { CHUNK_SIZE } from '../data/streetsData';
import { ChunkCoordinate } from '../types';

export function worldToChunk(x: number, z: number): ChunkCoordinate {
  return {
    x: Math.floor((x + CHUNK_SIZE / 2) / CHUNK_SIZE),
    z: Math.floor((z + CHUNK_SIZE / 2) / CHUNK_SIZE),
  };
}

export function chunkToWorldCenter(chunkX: number, chunkZ: number): [number, number] {
  return [chunkX * CHUNK_SIZE, chunkZ * CHUNK_SIZE];
}

export function getSurroundingChunks(center: ChunkCoordinate, radius: number = 1): ChunkCoordinate[] {
  const chunks: ChunkCoordinate[] = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      chunks.push({
        x: center.x + dx,
        z: center.z + dz,
      });
    }
  }
  return chunks;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
