import React, { useMemo } from 'react';
import { RoadNetworkMesh } from './RoadNetworkMesh';
import { BuildingMesh } from './BuildingMesh';
import { PropsMesh } from './PropsMesh';
import { POIMarker } from './POIMarker';
import { VehicleMesh } from './VehicleMesh';
import { ImportedTokyoBuilding } from './ImportedTokyoBuilding';
import { UzbekBibiKhanym } from './UzbekBibiKhanym';
import { UzbekOliyMajlis } from './UzbekOliyMajlis';
import { generateChunkBuildings } from '../../data/mockBuildings';
import { getStreetByChunk, CHUNK_SIZE } from '../../data/streetsData';
import { useWorldStore } from '../../stores/useWorldStore';

interface StreetChunkProps {
  chunkX: number;
  chunkZ: number;
}

const CAR_COLORS = ['#ef4444', '#2563eb', '#ffffff', '#0f172a', '#64748b', '#059669', '#d97706'];

export const StreetChunk: React.FC<StreetChunkProps> = ({ chunkX, chunkZ }) => {
  const worldX = chunkX * CHUNK_SIZE;
  const worldZ = chunkZ * CHUNK_SIZE;

  const activeChunk = useWorldStore((s) => s.activeChunk);
  const isActiveChunk = activeChunk.x === chunkX && activeChunk.z === chunkZ;

  const buildings = useMemo(() => generateChunkBuildings(chunkX, chunkZ), [chunkX, chunkZ]);
  const street = useMemo(() => getStreetByChunk(chunkX, chunkZ), [chunkX, chunkZ]);

  // Each showcase monument previously shared the center chunk with the other
  // two plus a regular tower and standard street furniture — all crammed
  // into the same 80x80m block. That crowding (sidewalk curbs, lamps, a
  // tower right next to a scanned monument several times its footprint) is
  // what made the monuments look like they didn't belong on the ground.
  // Each one now gets an entire dedicated chunk to itself as an open plaza;
  // the other two are pushed out to the immediate east/west neighbor chunks
  // (both already inside the default 3x3 streamed radius around spawn).
  const monumentType: 'bibi' | 'oliyMajlis' | 'tokyo' | null =
    chunkX === 0 && chunkZ === 0 ? 'bibi' :
    chunkX === 1 && chunkZ === 0 ? 'oliyMajlis' :
    chunkX === -1 && chunkZ === 0 ? 'tokyo' :
    null;
  const isMonumentChunk = monumentType !== null;

  // Clear every quadrant's sidewalk curb/lawn and street furniture in a
  // monument chunk, leaving flat open ground for the plaza.
  const clearedQuadrants = isMonumentChunk ? [0, 1, 2, 3] : [];

  const vehicles = useMemo(() => {
    const vList: {
      pos: [number, number, number];
      rotY: number;
      type: 'sedan' | 'suv' | 'bus' | 'taxi';
      color: string;
    }[] = [];

    // Monument chunks are an open pedestrian plaza, not a normal 4-lane
    // intersection — the fixed lane positions below would otherwise drive a
    // car straight into the monument's much larger footprint (this was the
    // "car parked under Bibi Khanym" issue).
    if (isMonumentChunk) return vList;

    const seed = (chunkX * 9301 + chunkZ * 49297) % 233280;

    // North-South Lane Vehicles
    vList.push({
      pos: [worldX + 3.2, 0, worldZ - 16],
      rotY: 0,
      type: (seed % 5 === 0 ? 'bus' : seed % 3 === 0 ? 'taxi' : 'sedan'),
      color: CAR_COLORS[Math.abs(seed) % CAR_COLORS.length],
    });

    vList.push({
      pos: [worldX - 3.2, 0, worldZ + 20],
      rotY: Math.PI,
      type: (seed % 4 === 0 ? 'suv' : 'sedan'),
      color: CAR_COLORS[Math.abs(seed + 3) % CAR_COLORS.length],
    });

    // East-West Lane Vehicles
    vList.push({
      pos: [worldX + 22, 0, worldZ + 3.2],
      rotY: Math.PI / 2,
      type: (seed % 2 === 0 ? 'taxi' : 'suv'),
      color: CAR_COLORS[Math.abs(seed + 7) % CAR_COLORS.length],
    });

    vList.push({
      pos: [worldX - 20, 0, worldZ - 3.2],
      rotY: -Math.PI / 2,
      type: (seed % 6 === 0 ? 'bus' : 'sedan'),
      color: CAR_COLORS[Math.abs(seed + 11) % CAR_COLORS.length],
    });

    return vList;
  }, [chunkX, chunkZ, worldX, worldZ, isMonumentChunk]);

  return (
    <group key={`chunk-${chunkX}-${chunkZ}`}>
      {/* 1. Road Network, Sidewalks, Crosswalks */}
      <RoadNetworkMesh chunkX={chunkX} chunkZ={chunkZ} excludeQuadrants={clearedQuadrants} plazaOnly={isMonumentChunk} />

      {/* 2. Monumental Uzbek & International 3D Architectural Models — each
          gets its own dedicated plaza chunk, centered so its footprint stays
          well inside the chunk instead of spilling into a neighboring chunk
          that still has a regular building in it. */}
      {monumentType === 'bibi' && (
        <UzbekBibiKhanym position={[worldX, 0, worldZ]} rotationY={0} />
      )}
      {monumentType === 'oliyMajlis' && (
        <UzbekOliyMajlis position={[worldX, 0, worldZ]} rotationY={Math.PI / 2} />
      )}
      {monumentType === 'tokyo' && (
        <ImportedTokyoBuilding position={[worldX, 0, worldZ]} rotationY={0} />
      )}
      {!isMonumentChunk && (
        buildings.map((b) => (
          <BuildingMesh key={b.id} building={b} />
        ))
      )}

      {/* 3. Street Props: Lamps, Bus Stops, Trees, Benches */}
      <PropsMesh chunkX={chunkX} chunkZ={chunkZ} streetName={street?.name} isActiveChunk={isActiveChunk} excludeQuadrants={clearedQuadrants} />

      {/* 4. Realistic 3D Vehicles on Roads */}
      {vehicles.map((v, i) => (
        <VehicleMesh
          key={`veh-${chunkX}-${chunkZ}-${i}`}
          position={v.pos}
          rotationY={v.rotY}
          type={v.type}
          color={v.color}
          isActiveChunk={isActiveChunk}
        />
      ))}

      {/* 5. POI Markers on this street */}
      {street?.pois.map((poi) => (
        <POIMarker key={poi.id} poi={poi} />
      ))}
    </group>
  );
};
