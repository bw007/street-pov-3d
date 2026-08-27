export type TimeOfDay = 'day' | 'sunset' | 'night';

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';

export interface InspectableObject {
  id: string;
  title: string;
  category: 'building' | 'vehicle' | 'shop' | 'infrastructure' | 'landmark' | 'nature';
  badge: string;
  description: string;
  details: { label: string; value: string }[];
  imageUrl?: string;
  streetName?: string;
}

export interface POIData {
  id: string;
  name: string;
  category: 'landmark' | 'cafe' | 'shop' | 'government' | 'park' | 'station' | 'historical';
  description: string;
  fullHistory?: string;
  position: [number, number, number];
  streetId: string;
  imageUrl?: string;
  audioGuideUrl?: string;
  hours?: string;
  rating?: number;
}

export interface StreetData {
  id: string;
  name: string;
  district: string;
  lengthMeters: number;
  centerChunk: [number, number]; // [chunkX, chunkZ]
  startPos: [number, number, number];
  description: string;
  history: string;
  speedLimit?: number;
  lanes: number;
  pois: POIData[];
}

export interface BuildingData {
  id: string;
  name?: string;
  type: 'residential' | 'commercial' | 'office' | 'skyscraper' | 'historical' | 'cafe';
  position: [number, number, number];
  size: [number, number, number]; // [width, height, depth]
  rotationY: number;
  color: string;
  roofColor: string;
  floors: number;
  poiId?: string;
}

export interface ChunkCoordinate {
  x: number;
  z: number;
}

export interface PlayerState {
  position: [number, number, number];
  rotation: [number, number, number];
  speed: number;
  isGrounded: boolean;
  isSprinting: boolean;
  isMoving: boolean;
  currentStreet: StreetData | null;
}
