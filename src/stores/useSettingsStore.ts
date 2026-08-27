import { create } from 'zustand';
import { GraphicsQuality } from '../types';

interface SettingsStore {
  quality: GraphicsQuality;
  shadows: boolean;
  bloom: boolean;
  soundVolume: number;
  ambientVolume: number;
  fov: number;
  isMuted: boolean;
  showMinimap: boolean;
  showFPS: boolean;
  isPointerLocked: boolean;
  isSettingsOpen: boolean;

  setQuality: (q: GraphicsQuality) => void;
  setShadows: (v: boolean) => void;
  setBloom: (v: boolean) => void;
  setSoundVolume: (v: number) => void;
  setAmbientVolume: (v: number) => void;
  setFov: (v: number) => void;
  toggleMute: () => void;
  toggleMinimap: () => void;
  toggleFPS: () => void;
  setPointerLocked: (v: boolean) => void;
  setSettingsOpen: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  quality: 'high',
  shadows: true,
  bloom: true,
  soundVolume: 0.7,
  ambientVolume: 0.5,
  fov: 75,
  isMuted: false,
  showMinimap: true,
  showFPS: true,
  isPointerLocked: false,
  isSettingsOpen: false,

  setQuality: (quality) => {
    if (quality === 'low') {
      set({ quality, shadows: false, bloom: false });
    } else if (quality === 'medium') {
      set({ quality, shadows: true, bloom: false });
    } else {
      set({ quality, shadows: true, bloom: true });
    }
  },
  setShadows: (shadows) => set({ shadows }),
  setBloom: (bloom) => set({ bloom }),
  setSoundVolume: (soundVolume) => set({ soundVolume }),
  setAmbientVolume: (ambientVolume) => set({ ambientVolume }),
  setFov: (fov) => set({ fov }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
  toggleFPS: () => set((s) => ({ showFPS: !s.showFPS })),
  setPointerLocked: (isPointerLocked) => set({ isPointerLocked }),
  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
}));
