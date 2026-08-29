// Shared traffic-signal timing for an intersection. BOTH the traffic lights and
// the cars call this same function, so what the lights show always matches how
// the cars move (stop on red, go on green).
//
// One full cycle: N–S green → N–S amber → all-red → E–W green → E–W amber →
// all-red → (repeat). "ns" = traffic driving along Z, "ew" = along X.

export type SignalColor = 'green' | 'amber' | 'red';

export interface IntersectionSignal {
  ns: SignalColor;
  ew: SignalColor;
}

const GREEN = 5.0;   // seconds a direction stays green
const AMBER = 0.9;   // amber before it turns red
const ALL_RED = 0.3; // brief all-red safety gap

// Phase boundaries within one cycle.
const T1 = GREEN;              // NS green → amber
const T2 = T1 + AMBER;         // NS amber → all red
const T3 = T2 + ALL_RED;       // all red → EW green
const T4 = T3 + GREEN;         // EW green → amber
const T5 = T4 + AMBER;         // EW amber → all red

/** Total cycle length (s). */
export const SIGNAL_CYCLE = T5 + ALL_RED;

export function getIntersectionSignal(elapsed: number, phase = 0): IntersectionSignal {
  const t = (((elapsed + phase) % SIGNAL_CYCLE) + SIGNAL_CYCLE) % SIGNAL_CYCLE;
  if (t < T1) return { ns: 'green', ew: 'red' };
  if (t < T2) return { ns: 'amber', ew: 'red' };
  if (t < T3) return { ns: 'red', ew: 'red' };
  if (t < T4) return { ns: 'red', ew: 'green' };
  if (t < T5) return { ns: 'red', ew: 'amber' };
  return { ns: 'red', ew: 'red' };
}

/** Signal group a vehicle belongs to, based on the axis it drives along. */
export function groupForAxis(axis: 'x' | 'z'): 'ns' | 'ew' {
  return axis === 'z' ? 'ns' : 'ew';
}
