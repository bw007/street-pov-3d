import { create } from 'zustand';
import { ChunkCoordinate, POIData, StreetData, TimeOfDay, InspectableObject } from '../types';
import { getStreetByChunk, STREETS_DATA } from '../data/streetsData';
import { worldToChunk } from '../utils/math';

interface WorldStore {
  playerPosition: [number, number, number];
  playerRotation: number; // yaw angle in radians
  playerSpeed: number;
  activeChunk: ChunkCoordinate;
  currentStreet: StreetData | null;
  timeOfDay: TimeOfDay;
  selectedPOI: POIData | null;
  inspectedObject: InspectableObject | null;
  hoveredObject: InspectableObject | null;
  targetTeleport: [number, number, number] | null;
  isCinematicFlying: boolean;
  
  // Actions
  setPlayerPosition: (pos: [number, number, number]) => void;
  setPlayerRotation: (yaw: number) => void;
  setPlayerSpeed: (speed: number) => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  toggleTimeOfDay: () => void;
  setSelectedPOI: (poi: POIData | null) => void;
  setInspectedObject: (obj: InspectableObject | null) => void;
  setHoveredObject: (obj: InspectableObject | null) => void;
  teleportTo: (pos: [number, number, number]) => void;
  clearTeleport: () => void;
}

export const useWorldStore = create<WorldStore>((set, get) => ({
  playerPosition: [0, 1.7, -35],
  playerRotation: 0,
  playerSpeed: 0,
  activeChunk: { x: 0, z: 0 },
  currentStreet: STREETS_DATA[0] || null,
  timeOfDay: 'day',
  selectedPOI: null,
  inspectedObject: null,
  hoveredObject: null,
  targetTeleport: null,
  isCinematicFlying: false,

  setPlayerPosition: (pos) => {
    const chunk = worldToChunk(pos[0], pos[2]);
    const currentChunk = get().activeChunk;
    
    // If chunk changed, update active chunk and detect current street
    if (chunk.x !== currentChunk.x || chunk.z !== currentChunk.z) {
      const street = getStreetByChunk(chunk.x, chunk.z) || null;
      set({
        playerPosition: pos,
        activeChunk: chunk,
        currentStreet: street,
      });
    } else {
      set({ playerPosition: pos });
    }
  },

  setPlayerRotation: (yaw) => set({ playerRotation: yaw }),
  setPlayerSpeed: (speed) => set({ playerSpeed: speed }),

  setTimeOfDay: (time) => set({ timeOfDay: time }),
  toggleTimeOfDay: () => {
    const current = get().timeOfDay;
    const next: TimeOfDay = current === 'day' ? 'sunset' : current === 'sunset' ? 'night' : 'day';
    set({ timeOfDay: next });
  },

  setSelectedPOI: (poi) => {
    if (poi && document.pointerLockElement) {
      document.exitPointerLock?.();
    }
    set({ selectedPOI: poi });
  },
  
  setInspectedObject: (inspectedObject) => {
    if (inspectedObject && document.pointerLockElement) {
      document.exitPointerLock?.();
    }
    set({ inspectedObject });
  },

  setHoveredObject: (hoveredObject) => set({ hoveredObject }),
  
  teleportTo: (pos) => {
    set({ targetTeleport: pos, isCinematicFlying: true });
  },
  
  clearTeleport: () => set({ targetTeleport: null, isCinematicFlying: false }),
}));
