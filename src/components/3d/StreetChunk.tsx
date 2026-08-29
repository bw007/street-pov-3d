import React, { useMemo } from 'react';
import { RoadNetworkMesh } from './RoadNetworkMesh';
import { BuildingMesh } from './BuildingMesh';
import { PropsMesh } from './PropsMesh';
import { POIMarker } from './POIMarker';
import { VehicleMesh } from './VehicleMesh';
import { ImportedTokyoBuilding } from './ImportedTokyoBuilding';
import { UzbekBibiKhanym } from './UzbekBibiKhanym';
import { UzbekOliyMajlis } from './UzbekOliyMajlis';
import { TashkentCircus } from './TashkentCircus';
import { TashkentCityNest } from './TashkentCityNest';
import { ChevroletOnix } from './ChevroletOnix';
import { SafeModel } from './ModelErrorBoundary';
import { IntersectionLabel } from './IntersectionLabel';
import { generateChunkBuildings } from '../../data/mockBuildings';
import { getStreetByChunk, CHUNK_SIZE } from '../../data/streetsData';
import { useWorldStore } from '../../stores/useWorldStore';

interface StreetChunkProps {
  chunkX: number;
  chunkZ: number;
}

// "Home" hero car. The player spawns at world (0, -35) facing -Z (away from the
// Bibi Khanym monument, which is behind them at the plaza centre — see
// PlayerController). The Chevrolet Onix is parked ~10 m dead ahead in the
// northbound lane just south of the plaza, so it's the first real 3D vehicle in
// view the moment the world loads. Numbers are world-space; tweak to taste
// (bump rotationY by Math.PI if the car ends up facing the wrong way).
const HOME_SHOWCASE_CAR = {
  position: [3.2, 0, -44.5] as [number, number, number],
  rotationY: Math.PI, // radians — car heading
};

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
  // Showcase landmarks each own a dedicated plaza chunk. Central east–west
  // avenue (z = 0): Tokyo (−1:0), Bibi Khanym / spawn (0:0), Oliy Majlis (1:0),
  // Tashkent Circus (2:0). One block north: Tashkent City NEST One at (0:1).
  const monumentType: 'bibi' | 'oliyMajlis' | 'tokyo' | 'circus' | 'nest' | null =
    chunkX === 0 && chunkZ === 0 ? 'bibi' :
    chunkX === 1 && chunkZ === 0 ? 'oliyMajlis' :
    chunkX === -1 && chunkZ === 0 ? 'tokyo' :
    chunkX === 2 && chunkZ === 0 ? 'circus' :
    chunkX === 0 && chunkZ === 1 ? 'nest' :
    null;
  const isMonumentChunk = monumentType !== null;

  // Clear every quadrant's sidewalk curb/lawn and street furniture in a
  // monument chunk, leaving flat open ground for the plaza.
  const clearedQuadrants = isMonumentChunk ? [0, 1, 2, 3] : [];

  // Every intersection shows its address "X : Z" (identical to chunkX / chunkZ in
  // code) on a floating, camera-facing sign — for navigation and so any spot can
  // be referenced exactly (spawn is "0 : 0", the circus is "2 : 0"). To change
  // the numbering scheme, edit this one line. On monument plaza chunks the sign
  // shifts to a corner so it doesn't sit inside the model.
  const intersectionLabel = `${chunkX} : ${chunkZ}`;
  const labelPos: [number, number, number] = isMonumentChunk
    ? [worldX + 30, 4, worldZ - 30]
    : [worldX, 5, worldZ];

  const vehicles = useMemo(() => {
    const vList: {
      startPos: [number, number, number];
      axis: 'x' | 'z';
      dir: 1 | -1;
      speed: number;
      axisCenter: number;
      variant: number;
      isBus: boolean;
    }[] = [];

    // Monument chunks are an open pedestrian plaza, not a 4-lane intersection —
    // no through-traffic there.
    if (isMonumentChunk) return vList;

    const seed = Math.abs(chunkX * 9301 + chunkZ * 49297);

    // Two north–south lanes and two east–west lanes. Each car drives along its
    // lane and loops within the chunk; `variant` spreads the four car models
    // across every street so no two lanes look identical.
    const lanes: { pos: [number, number, number]; axis: 'x' | 'z'; dir: 1 | -1; speed: number }[] = [
      { pos: [worldX + 3.2, 0, worldZ - 16], axis: 'z', dir: 1, speed: 5.5 },
      { pos: [worldX - 3.2, 0, worldZ + 20], axis: 'z', dir: -1, speed: 4.5 },
      { pos: [worldX + 22, 0, worldZ + 3.2], axis: 'x', dir: 1, speed: 6.0 },
      { pos: [worldX - 20, 0, worldZ - 3.2], axis: 'x', dir: -1, speed: 5.0 },
    ];

    lanes.forEach((lane, i) => {
      vList.push({
        startPos: lane.pos,
        axis: lane.axis,
        dir: lane.dir,
        speed: lane.speed,
        axisCenter: lane.axis === 'z' ? worldZ : worldX,
        variant: (seed + i) % 4,
        isBus: (seed + i) % 7 === 0, // occasional truck for variety
      });
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
        <SafeModel name="UzbekBibiKhanym">
          <UzbekBibiKhanym position={[worldX, 0, worldZ]} rotationY={0} />
        </SafeModel>
      )}
      {monumentType === 'oliyMajlis' && (
        <SafeModel name="UzbekOliyMajlis">
          <UzbekOliyMajlis position={[worldX, 0, worldZ]} rotationY={Math.PI / 2} />
        </SafeModel>
      )}
      {monumentType === 'tokyo' && (
        <SafeModel name="ImportedTokyoBuilding">
          <ImportedTokyoBuilding position={[worldX, 0, worldZ]} rotationY={0} />
        </SafeModel>
      )}
      {monumentType === 'circus' && (
        <SafeModel name="TashkentCircus">
          <TashkentCircus position={[worldX, 0, worldZ]} rotationY={0} />
        </SafeModel>
      )}
      {monumentType === 'nest' && (
        <SafeModel name="TashkentCityNest">
          <TashkentCityNest position={[worldX, 0, worldZ]} rotationY={0} />
        </SafeModel>
      )}

      {/* "Home" showcase — Chevrolet Onix parked just south of the spawn plaza
          (rendered with chunk 0,0), the first real 3D car the player sees when
          the world loads. */}
      {chunkX === 0 && chunkZ === 0 && (
        <SafeModel name="ChevroletOnix">
          <ChevroletOnix
            position={HOME_SHOWCASE_CAR.position}
            rotationY={HOME_SHOWCASE_CAR.rotationY}
          />
        </SafeModel>
      )}

      {!isMonumentChunk && (
        buildings.map((b) => (
          <BuildingMesh key={b.id} building={b} />
        ))
      )}

      {/* 3. Street Props: Lamps, Bus Stops, Trees, Benches */}
      <PropsMesh chunkX={chunkX} chunkZ={chunkZ} streetName={street?.name} isActiveChunk={isActiveChunk} excludeQuadrants={clearedQuadrants} />

      {/* 4. Realistic 3D Vehicles driving the roads (wrapped so a heavy/broken
          car model can't black-screen the whole scene). */}
      <SafeModel name="traffic">
        {vehicles.map((v, i) => (
          <VehicleMesh
            key={`veh-${chunkX}-${chunkZ}-${i}`}
            startPos={v.startPos}
            axis={v.axis}
            dir={v.dir}
            speed={v.speed}
            axisCenter={v.axisCenter}
            variant={v.variant}
            isBus={v.isBus}
            isActiveChunk={isActiveChunk}
          />
        ))}
      </SafeModel>

      {/* 5. POI Markers on this street */}
      {street?.pois.map((poi) => (
        <POIMarker key={poi.id} poi={poi} />
      ))}

      {/* 6. Intersection number sign ("X : Z") */}
      <IntersectionLabel position={labelPos} label={intersectionLabel} />
    </group>
  );
};
