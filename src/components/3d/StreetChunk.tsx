import React, { useMemo } from 'react';
import { RoadNetworkMesh } from './RoadNetworkMesh';
import { BuildingMesh } from './BuildingMesh';
import { PropsMesh } from './PropsMesh';
import { POIMarker } from './POIMarker';
import { VehicleMesh } from './VehicleMesh';
import { ImportedTokyoBuilding } from './ImportedTokyoBuilding';
import { AmirTemurStatue } from './AmirTemurStatue';
import { UzbekOliyMajlis } from './UzbekOliyMajlis';
import { TashkentCircus } from './TashkentCircus';
import { TashkentCityNest } from './TashkentCityNest';
import { TashkentTVTower } from './TashkentTVTower';
import { PropModel, PROP_URLS, recolorKiosk, recolorAtm } from './PropModel';
import { WalkingPerson, PEOPLE_URLS } from './WalkingPerson';
import { InspectableObject } from '../../types';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { ChevroletOnix } from './ChevroletOnix';
import { SafeModel } from './ModelErrorBoundary';
import { BusStop } from './BusStop';
import { PlazaPark } from './PlazaPark';
import { TrafficLight } from './TrafficLight';
import { HighwaySign } from './HighwaySign';
import { LedBillboard, AD_MODES } from './LedBillboard';
import { generateChunkBuildings } from '../../data/mockBuildings';
import { getStreetByChunk, CHUNK_SIZE } from '../../data/streetsData';
import { getLandmarkByChunk } from '../../data/landmarks';
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

// Eight human-height flower vases ringed around the Amir Temur statue at the
// spawn plaza, evenly spaced. Offsets are relative to the chunk centre.
const VASE_RING: [number, number][] = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2;
  return [Math.cos(a) * 15, Math.sin(a) * 15];
});

// Standalone, clickable ATMs on the sidewalks (own object, not tied to bus stops).
const ATM_INSPECT: InspectableObject = {
  id: 'bankomat',
  title: 'Bankomat (ATM)',
  category: 'infrastructure',
  badge: 'XIZMAT',
  description: "24/7 ishlaydigan bankomat — naqd pul yechish va to'lovlar uchun.",
  details: [
    { label: 'Turi', value: 'Bankomat' },
    { label: 'Ish vaqti', value: '24/7' },
  ],
};

// Sidewalk corners for the ATMs — SW and SE, away from the NE kiosk and the bus
// stops. [offsetX, offsetZ, rotationY]; offsets relative to the chunk centre.
const ATM_SPOTS: [number, number, number][] = [
  [-11, -11, Math.PI / 4],
  [11, -11, -Math.PI / 4],
];

// Clickable vending machine tucked behind every building. The model's glass
// front is its −X face, so rotationY = −π/2 turns it to face −Z (outward, away
// from the wall it stands against).
const VENDING_INSPECT: InspectableObject = {
  id: 'vending_machine',
  title: 'Sotuv Avtomati (Vending Machine)',
  category: 'infrastructure',
  badge: 'XIZMAT',
  description: "Ichimlik va gazak sotuvchi avtomat — bino ortida, 24/7 ishlaydi.",
  details: [
    { label: 'Turi', value: 'Sotuv avtomati' },
    { label: 'Ish vaqti', value: '24/7' },
  ],
};

// Real 3D entrance doors replacing the flat storefront plane: a hospital-style
// sliding door at the front (+Z storefront) and a metal door at the back (−Z).
const DOOR_INSPECT: InspectableObject = {
  id: 'building_door',
  title: 'Bino Kirish Eshigi',
  category: 'building',
  badge: 'KIRISH',
  description: 'Binoning kirish eshigi.',
  details: [{ label: 'Turi', value: 'Kirish eshigi' }],
};

// Pedestrian pacing segments (offsets from the chunk centre): two along the
// sidewalks, one crossing the road at the crosswalk by the traffic lights.
const PED_SPOTS: { start: [number, number, number]; dir: [number, number]; length: number }[] = [
  { start: [-8, 0, -16], dir: [0, 1], length: 32 }, // -X sidewalk, walk N–S
  { start: [-16, 0, 8], dir: [1, 0], length: 32 }, // +Z sidewalk, walk E–W
  { start: [-7, 0, -9], dir: [1, 0], length: 14 }, // crosswalk across the N–S road
];

export const StreetChunk: React.FC<StreetChunkProps> = ({ chunkX, chunkZ }) => {
  const worldX = chunkX * CHUNK_SIZE;
  const worldZ = chunkZ * CHUNK_SIZE;

  const activeChunk = useWorldStore((s) => s.activeChunk);
  const isActiveChunk = activeChunk.x === chunkX && activeChunk.z === chunkZ;
  const quality = useSettingsStore((s) => s.quality);
  const pedCount = quality === 'low' ? 1 : quality === 'medium' ? 2 : 3;

  const buildings = useMemo(() => generateChunkBuildings(chunkX, chunkZ), [chunkX, chunkZ]);
  const street = useMemo(() => getStreetByChunk(chunkX, chunkZ), [chunkX, chunkZ]);

  // Showcase landmarks each own a dedicated plaza chunk (the chunk clears its
  // buildings / through-traffic / furniture below, so the monument sits on open
  // ground). Placement now lives in a single data-driven registry — see
  // src/data/landmarks.ts — which also spaces the duplicated NEST One and
  // Littlest Tokyo models >=3 chunks apart, so the +-1 chunk streamer never has
  // two heavy landmark meshes in view at once (keeps draw calls / physics sane).
  const monumentType = getLandmarkByChunk(chunkX, chunkZ);
  const isMonumentChunk = monumentType !== null;

  // Clear every quadrant's sidewalk curb/lawn and street furniture in a
  // monument chunk, leaving flat open ground for the plaza.
  const clearedQuadrants = isMonumentChunk ? [0, 1, 2, 3] : [];

  // "Major" arterial avenues get two lanes each way (and more traffic); they run
  // in continuous lines every 3rd grid column/row. nsMajor = the N–S road here is
  // an avenue, ewMajor = the E–W road is.
  const nsMajor = chunkX % 3 === 0;
  const ewMajor = chunkZ % 3 === 0;

  // One shared signal phase per intersection — the four traffic lights AND the
  // cars here all read it (via getIntersectionSignal), so the lights and the
  // traffic stay in sync (cars stop on red, go on green). The big overhead guide
  // sign keeps the grid code "X : Z" so any spot can still be referenced exactly.
  const signalPhase = Math.abs(chunkX * 5 + chunkZ * 11) % 13;

  const plazaShift = isMonumentChunk ? 22 : 0;

  // Right-hand traffic: each approach's signal + banner sit on the driver's RIGHT
  // curb, FACING the oncoming car (not across the junction). Cars stop ~9 m before
  // the centre; the signal is at the corner ~7 m out, the banner further out ~16 m.
  const sc = 7 + plazaShift; // signal corner offset
  const signals: { pos: [number, number, number]; rotationY: number; group: 'ns' | 'ew' }[] = [
    { pos: [worldX - sc, 0, worldZ - sc], rotationY: Math.PI / 2, group: 'ns' },  // northbound (−X lane), faces −Z
    { pos: [worldX + sc, 0, worldZ + sc], rotationY: -Math.PI / 2, group: 'ns' }, // southbound (+X lane), faces +Z
    { pos: [worldX - sc, 0, worldZ + sc], rotationY: Math.PI, group: 'ew' },      // eastbound (+Z lane), faces −X
    { pos: [worldX + sc, 0, worldZ - sc], rotationY: 0, group: 'ew' },            // westbound (−Z lane), faces +X
  ];

  // Banners: pole on the driver's-right curb, arm reaching over THAT lane, panel
  // (flipped) facing the oncoming car. Grid code on the northbound one.
  const bAlong = 16 + plazaShift; // distance along the approach
  const bCurb = 7;                // driver's-right curb offset
  const banners: { pos: [number, number, number]; rotationY: number; flip: boolean; code?: string }[] = [
    { pos: [worldX - bCurb, 0, worldZ - bAlong], rotationY: 0, flip: true, code: `${chunkX} : ${chunkZ}` }, // northbound, faces −Z
    { pos: [worldX + bCurb, 0, worldZ + bAlong], rotationY: Math.PI, flip: true },                          // southbound, faces +Z
    { pos: [worldX - bAlong, 0, worldZ + bCurb], rotationY: Math.PI / 2, flip: true },                      // eastbound, faces −X
    { pos: [worldX + bAlong, 0, worldZ - bCurb], rotationY: -Math.PI / 2, flip: true },                     // westbound, faces +X
  ];

  // Bus stop shelters on the curb of each bus route, at the coordinate the bus
  // pulls up to (24 m past the centre in the travel direction — see VehicleMesh
  // BUS_STOP_OFFSET). Northbound (+Z) stop on the −X curb, eastbound (+X) on +Z.
  const busStops: { pos: [number, number, number]; rotationY: number }[] = isMonumentChunk ? [] : [
    { pos: [worldX - 8, 0, worldZ + 24], rotationY: 0 },           // northbound stop (−X curb), parallel to N-S road
    { pos: [worldX + 24, 0, worldZ + 8], rotationY: Math.PI / 2 }, // eastbound stop (+Z curb), parallel to E-W road
  ];

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

    // Right-hand traffic (Uzbekistan): a car keeps to the side `d × up` of its
    // travel direction. +Z drives in the −X lane, −Z in +X, +X in +Z, −X in −Z.
    // Major avenues get TWO lanes each way (inner 1.8 m, outer 5.2 m) → more cars;
    // regular streets keep one lane each way at 3.2 m.
    const lanes: { pos: [number, number, number]; axis: 'x' | 'z'; dir: 1 | -1; speed: number }[] = [];

    const nsOffsets = nsMajor ? [1.8, 5.2] : [3.2];
    nsOffsets.forEach((off, li) => {
      lanes.push({ pos: [worldX - off, 0, worldZ - 16 - li * 11], axis: 'z', dir: 1, speed: 6 - li * 0.8 });
      lanes.push({ pos: [worldX + off, 0, worldZ + 22 + li * 11], axis: 'z', dir: -1, speed: 5.2 - li * 0.8 });
    });

    const ewOffsets = ewMajor ? [1.8, 5.2] : [3.2];
    ewOffsets.forEach((off, li) => {
      lanes.push({ pos: [worldX + 22 + li * 11, 0, worldZ + off], axis: 'x', dir: 1, speed: 6 - li * 0.8 });
      lanes.push({ pos: [worldX - 20 - li * 11, 0, worldZ - off], axis: 'x', dir: -1, speed: 5.2 - li * 0.8 });
    });

    // One bus per road, in the outer (+direction) curb lane — a regular service
    // that stops at the shelters below.
    const nsCount = nsOffsets.length * 2;
    const nsBusIdx = (nsOffsets.length - 1) * 2;      // outer +Z (northbound) lane
    const ewBusIdx = nsCount + (ewOffsets.length - 1) * 2; // outer +X (eastbound) lane

    lanes.forEach((lane, i) => {
      vList.push({
        startPos: lane.pos,
        axis: lane.axis,
        dir: lane.dir,
        speed: lane.speed,
        axisCenter: lane.axis === 'z' ? worldZ : worldX,
        variant: (seed + i) % 4,
        isBus: i === nsBusIdx || i === ewBusIdx,
      });
    });

    return vList;
  }, [chunkX, chunkZ, worldX, worldZ, isMonumentChunk, nsMajor, ewMajor]);

  return (
    <group key={`chunk-${chunkX}-${chunkZ}`}>
      {/* 1. Road Network, Sidewalks, Crosswalks */}
      <RoadNetworkMesh chunkX={chunkX} chunkZ={chunkZ} excludeQuadrants={clearedQuadrants} plazaOnly={isMonumentChunk} nsMajor={nsMajor} ewMajor={ewMajor} />

      {/* 1b. Landscaped square/park around the Amir Temur & Tokyo monuments */}
      {(monumentType === 'amirTemur' || monumentType === 'tokyo') && (
        <PlazaPark center={[worldX, 0, worldZ]} />
      )}

      {/* 2. Monumental Uzbek & International 3D Architectural Models — each
          gets its own dedicated plaza chunk, centered so its footprint stays
          well inside the chunk instead of spilling into a neighboring chunk
          that still has a regular building in it. */}
      {monumentType === 'amirTemur' && (
        <SafeModel name="AmirTemurStatue">
          <AmirTemurStatue position={[worldX, 0, worldZ]} rotationY={0} />
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
      {monumentType === 'tvTower' && (
        <SafeModel name="TashkentTVTower">
          <TashkentTVTower position={[worldX, 0, worldZ]} rotationY={0} />
        </SafeModel>
      )}

      {/* Eight human-height flower vases ringed around the Amir Temur statue. */}
      {monumentType === 'amirTemur' &&
        VASE_RING.map((v, i) => (
          <SafeModel key={`vase-${i}`} name="FlowerVase">
            <PropModel url={PROP_URLS.vase} targetHeight={1.75} position={[worldX + v[0], 0, worldZ + v[1]]} />
          </SafeModel>
        ))}

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

      {/* Kiosk on a corner of every ordinary street intersection (chorraha). */}
      {!isMonumentChunk && (
        <SafeModel name="Kiosk">
          <PropModel
            url={PROP_URLS.kiosk}
            targetHeight={3}
            position={[worldX + 11, 0, worldZ + 11]}
            rotationY={-Math.PI * 0.75}
            onMaterial={recolorKiosk}
          />
        </SafeModel>
      )}

      {/* Per-building extras. The storefront/windows are on the +Z face (see
          BuildingMesh); −Z is the plain back.
          • Front entrance: hospital-style sliding door on the +Z storefront.
          • Back door: metal door on the −Z wall.
          • Vending machine: against the −Z back wall, shifted off-centre so it
            clears the back door, glass front turned outward.
          Doors are auto-stood, entrance-scaled and non-colliding (the building
          box already blocks the player). If a door faces into the wall, flip its
          rotationY by Math.PI. */}
      {!isMonumentChunk &&
        buildings.map((b) => {
          const [bx, , bz] = b.position;
          const bWidth = b.size[0];
          const depth = b.size[2];
          return (
            <group key={`bx-${b.id}`}>
              <SafeModel name="BuildingDoorFront">
                <PropModel
                  url={PROP_URLS.hospitalDoor}
                  targetHeight={3.0}
                  autoStand
                  collide={false}
                  position={[bx, 0, bz + depth / 2 + 0.12]}
                  rotationY={0}
                  inspect={DOOR_INSPECT}
                />
              </SafeModel>
              <SafeModel name="BuildingDoorBack">
                <PropModel
                  url={PROP_URLS.metalDoor}
                  targetHeight={2.7}
                  autoStand
                  collide={false}
                  position={[bx, 0, bz - depth / 2 - 0.12]}
                  rotationY={Math.PI}
                  inspect={DOOR_INSPECT}
                />
              </SafeModel>
              <SafeModel name="VendingMachine">
                <PropModel
                  url={PROP_URLS.vending}
                  targetHeight={1.9}
                  // Flush to the back wall (building box already blocks the
                  // player), like the doors — no collider, so a full 3x3 window
                  // doesn't register ~36 extra fixed RigidBodies on every stream.
                  collide={false}
                  position={[bx + bWidth * 0.3, 0, bz - depth / 2 - 0.9]}
                  rotationY={-Math.PI / 2}
                  inspect={VENDING_INSPECT}
                />
              </SafeModel>
            </group>
          );
        })}

      {/* 3. Street Props: Lamps, Bus Stops, Trees, Benches */}
      <PropsMesh chunkX={chunkX} chunkZ={chunkZ} streetName={street?.name} isActiveChunk={isActiveChunk} excludeQuadrants={clearedQuadrants} />

      {/* 3b. Outdoor LED advertising billboard at every ordinary street crossing
          (skipped on monument plaza chunks). Stands on the NW corner past the
          traffic lights, screen angled back at the intersection; the ad creative
          cycles by chunk so neighbours differ. */}
      {!isMonumentChunk && (
        <SafeModel name="LedBillboard">
          <LedBillboard
            position={[worldX - 13, 0, worldZ + 13]}
            rotationY={(3 * Math.PI) / 4}
            mode={Math.abs(chunkX * 3 + chunkZ * 7) % AD_MODES}
          />
        </SafeModel>
      )}

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
            signalPhase={signalPhase}
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

      {/* 6. Four synced signals + four overhead highway guide banners */}
      {signals.map((s, i) => (
        <TrafficLight
          key={`tl-${i}`}
          position={s.pos}
          rotationY={s.rotationY}
          group={s.group}
          phase={signalPhase}
          isActiveChunk={isActiveChunk}
        />
      ))}
      {banners.map((b, i) => (
        <HighwaySign
          key={`hs-${i}`}
          position={b.pos}
          rotationY={b.rotationY}
          flip={b.flip}
          streetName={street?.name}
          code={b.code}
        />
      ))}

      {/* 7. Bus stop shelters — buses pull up and dwell here */}
      {busStops.map((bs, i) => (
        <SafeModel key={`bs-${i}`} name="BusStop">
          <BusStop position={bs.pos} rotationY={bs.rotationY} />
        </SafeModel>
      ))}

      {/* 7b. Standalone, clickable ATMs on the sidewalk corners — their own named
          object (crosshair/click opens the inspect modal), not tied to bus stops. */}
      {!isMonumentChunk &&
        ATM_SPOTS.map((s, i) => (
          <SafeModel key={`atm-${i}`} name="ATM">
            <PropModel
              url={PROP_URLS.atm}
              targetHeight={1.8}
              position={[worldX + s[0], 0, worldZ + s[1]]}
              rotationY={s[2]}
              onMaterial={recolorAtm}
              inspect={ATM_INSPECT}
            />
          </SafeModel>
        ))}

      {/* 7c. Walking pedestrians — sidewalks + a crosswalk (skinned, animated). */}
      {!isMonumentChunk &&
        PED_SPOTS.slice(0, pedCount).map((p, i) => (
          <SafeModel key={`ped-${i}`} name="Pedestrian">
            <WalkingPerson
              params={{
                url: (i + chunkX + chunkZ) % 2 === 0 ? PEOPLE_URLS.human : PEOPLE_URLS.man,
                start: [worldX + p.start[0], p.start[1], worldZ + p.start[2]],
                dir: p.dir,
                length: p.length,
                speed: 1.1,
                phase: i * 0.8,
              }}
            />
          </SafeModel>
        ))}
    </group>
  );
};
