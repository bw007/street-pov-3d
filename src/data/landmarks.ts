/**
 * Single source of truth for where the showcase 3D landmark models are placed
 * on the chunk grid. Keyed by "chunkX,chunkZ".
 *
 * PERFORMANCE CONTRACT (important — read before adding entries):
 * The world only streams a 3x3 window (the active chunk ±1) around the player,
 * so two landmarks can only ever be on screen together if their chunk coords
 * are within 1 of each other on BOTH axes. The duplicated NEST One / Littlest
 * Tokyo entries below are therefore spaced so that for every pair of landmarks
 * |dx| >= 3 OR |dz| >= 3 — which makes it impossible for the streamer to mount
 * two heavy landmark meshes at the same time. Littlest Tokyo alone is ~142k
 * triangles, so never place two of those within 2 chunks of each other.
 *
 * A landmark chunk is turned into an open plaza in StreetChunk.tsx: its regular
 * buildings, through-traffic and street furniture are cleared, so adding a
 * landmark actually removes other work from that chunk rather than piling on.
 */
export type LandmarkType = 'amirTemur' | 'oliyMajlis' | 'tokyo' | 'circus' | 'nest' | 'tvTower';

export const LANDMARKS: Record<string, LandmarkType> = {
  // --- Downtown showcase cluster around spawn (ships as-is) ---------------
  '0,0': 'amirTemur', // spawn plaza — Amir Temur square
  '1,0': 'oliyMajlis',
  '-1,0': 'tokyo', // Littlest Tokyo #1
  '2,0': 'circus',
  '0,1': 'nest', // NEST One #1

  // --- NEST One duplicates (5 total) — one per quadrant, well spread -------
  '3,3': 'nest',
  '-3,-3': 'nest',
  '0,4': 'nest',
  '-4,0': 'nest',

  // --- Littlest Tokyo duplicates (4 total) — interleaved with the NEST set,
  //     every pair (incl. the downtown one at -1,0) keeps |dx|>=3 or |dz|>=3,
  //     so two Tokyo meshes are never streamed in together ------------------
  '-3,3': 'tokyo',
  '3,-3': 'tokyo',
  '0,-4': 'tokyo',

  // Tashkent TV Tower on Oybek ko'chasi (chunk -5,0). Just a 1-mesh model, so
  // co-visibility with the neighbouring NEST One at (-4,0) costs almost nothing.
  '-5,0': 'tvTower',
};

/** Landmark occupying a given chunk, or null for an ordinary street chunk. */
export function getLandmarkByChunk(chunkX: number, chunkZ: number): LandmarkType | null {
  return LANDMARKS[`${chunkX},${chunkZ}`] ?? null;
}
