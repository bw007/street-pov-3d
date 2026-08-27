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

  const isCenterChunk = chunkX === 0 && chunkZ === 0;

  const vehicles = useMemo(() => {
    const seed = (chunkX * 9301 + chunkZ * 49297) % 233280;
    const vList: {
      pos: [number, number, number];
      rotY: number;
      type: 'sedan' | 'suv' | 'bus' | 'taxi';
      color: string;
    }[] = [];

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
  }, [chunkX, chunkZ, worldX, worldZ]);

  return (
    <group key={`chunk-${chunkX}-${chunkZ}`}>
      {/* 1. Road Network, Sidewalks, Crosswalks */}
      <RoadNetworkMesh chunkX={chunkX} chunkZ={chunkZ} />

      {/* 2. Monumental Uzbek & International 3D Architectural Models in Showcase Area */}
      {isCenterChunk ? (
        <>
          {/* A. Bibixonim Jome Masjidi (Samarqand 3D Monument) */}
          <UzbekBibiKhanym
            position={[worldX + 24, 0, worldZ + 24]}
            rotationY={0}
          />

          {/* B. Oliy Majlis Qonunchilik Palatasi Binosi (Toshkent 3D Palace) */}
          <UzbekOliyMajlis
            position={[worldX - 24, 0, worldZ + 24]}
            rotationY={Math.PI / 2}
          />

          {/* C. Tokyo Architectural Complex with Walkable Stairs */}
          <ImportedTokyoBuilding
            position={[worldX + 24, 0, worldZ - 24]}
            rotationY={0}
          />

          {/* D. Surrounding City Towers */}
          {buildings.slice(3).map((b) => (
            <BuildingMesh key={b.id} building={b} />
          ))}
        </>
      ) : (
        buildings.map((b) => (
          <BuildingMesh key={b.id} building={b} />
        ))
      )}

      {/* 3. Street Props: Lamps, Bus Stops, Trees, Benches */}
      <PropsMesh chunkX={chunkX} chunkZ={chunkZ} streetName={street?.name} isActiveChunk={isActiveChunk} />

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
