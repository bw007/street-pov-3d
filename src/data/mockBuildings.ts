import { BuildingData } from '../types';
import { CHUNK_SIZE } from './streetsData';

// Color palettes for realistic modern urban architecture
const BUILDING_PALETTES = [
  { wall: '#334155', roof: '#1e293b', glass: '#38bdf8' }, // Slate modern
  { wall: '#e2e8f0', roof: '#475569', glass: '#60a5fa' }, // White minimalist
  { wall: '#78716c', roof: '#292524', glass: '#93c5fd' }, // Warm concrete
  { wall: '#9a3412', roof: '#431407', glass: '#fef08a' }, // Red brick historic
  { wall: '#1e3a5f', roof: '#0f172a', glass: '#38bdf8' }, // Dark glass corporate
  { wall: '#fef3c7', roof: '#78350f', glass: '#bae6fd' }, // Sandstone classical
];

// Seeded pseudorandom generator for deterministic city generation
function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateChunkBuildings(chunkX: number, chunkZ: number): BuildingData[] {
  const buildings: BuildingData[] = [];
  const seed = (chunkX * 73856093) ^ (chunkZ * 19349663);
  let rndIndex = 0;

  const getRnd = () => {
    rndIndex++;
    return pseudoRandom(seed + rndIndex);
  };

  const worldCenterX = chunkX * CHUNK_SIZE;
  const worldCenterZ = chunkZ * CHUNK_SIZE;

  // Road grid parameters:
  // Roads run through center X and Z: Road width = 16m (8m each side from 0)
  // Sidewalk width = 4m (from 8m to 12m)
  // Buildings are placed in the 4 quadrants:
  // Q1: X > 14, Z > 14
  // Q2: X < -14, Z > 14
  // Q3: X > 14, Z < -14
  // Q4: X < -14, Z < -14

  const quadrants = [
    { xMin: 15, xMax: 35, zMin: 15, zMax: 35 },
    { xMin: -35, xMax: -15, zMin: 15, zMax: 35 },
    { xMin: 15, xMax: 35, zMin: -35, zMax: -15 },
    { xMin: -35, xMax: -15, zMin: -35, zMax: -15 },
  ];

  quadrants.forEach((q, idx) => {
    const rType = getRnd();
    const palette = BUILDING_PALETTES[Math.floor(getRnd() * BUILDING_PALETTES.length)];
    
    // Determine building height & floors
    let floors = 3 + Math.floor(getRnd() * 5); // 3 to 7 floors
    let type: BuildingData['type'] = 'residential';

    // Center quadrants can have high-rise skyscrapers
    if (Math.abs(chunkX) <= 1 && Math.abs(chunkZ) <= 1) {
      if (rType > 0.4) {
        floors = 10 + Math.floor(getRnd() * 14); // 10 to 24 floors
        type = 'skyscraper';
      }
    } else if (rType > 0.7) {
      type = 'commercial';
    } else if (rType > 0.5) {
      type = 'office';
    }

    const height = floors * 3.6; // 3.6m per floor
    const width = 16 + getRnd() * 4; // 16m - 20m width
    const depth = 16 + getRnd() * 4; // 16m - 20m depth

    const posX = worldCenterX + (q.xMin + q.xMax) / 2;
    const posZ = worldCenterZ + (q.zMin + q.zMax) / 2;

    buildings.push({
      id: `bld_${chunkX}_${chunkZ}_${idx}`,
      type,
      position: [posX, height / 2, posZ],
      size: [width, height, depth],
      rotationY: 0,
      color: palette.wall,
      roofColor: palette.roof,
      floors,
    });
  });

  return buildings;
}
