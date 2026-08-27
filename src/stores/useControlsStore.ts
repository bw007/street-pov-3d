import { create } from 'zustand';

interface ControlsStore {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  joystickVector: { x: number; y: number };
  lookDelta: { x: number; y: number };

  setMovementKey: (key: 'forward' | 'backward' | 'left' | 'right' | 'jump' | 'sprint', active: boolean) => void;
  setJoystickVector: (vector: { x: number; y: number }) => void;
  setLookDelta: (delta: { x: number; y: number }) => void;
  resetLookDelta: () => void;
}

export const useControlsStore = create<ControlsStore>((set) => ({
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  sprint: false,
  joystickVector: { x: 0, y: 0 },
  lookDelta: { x: 0, y: 0 },

  setMovementKey: (key, active) => set({ [key]: active }),
  setJoystickVector: (joystickVector) => set({ joystickVector }),
  setLookDelta: (lookDelta) => set({ lookDelta }),
  resetLookDelta: () => set({ lookDelta: { x: 0, y: 0 } }),
}));
