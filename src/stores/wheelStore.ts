import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WheelSettings, WheelType } from '../types/wheel';

type WheelState = {
  wheelName: string;
  rotation: number;
  settings: WheelSettings;
  setWheelName: (name: string) => void;
  setRotation: (deg: number) => void;
  setType: (type: WheelType) => void;
  setSpinDirection: (dir: 'clockwise' | 'counterclockwise') => void;
  setSpeed: (speed: 'fast' | 'normal' | 'dramatic') => void;
  setCustomDuration: (d: number | null) => void;
  setCustomRotations: (r: number | null) => void;
  setEasing: (e: WheelSettings['easing']) => void;
  setPointerBounce: (b: boolean) => void;
  setSegmentSpacing: (s: number) => void;
  setShowLabels: (b: boolean) => void;
  setLabelSize: (n: number) => void;
  setReduceMotion: (b: boolean) => void;
  resetSettings: () => void;
};

const defaultSettings: WheelSettings = {
  type: 'classic',
  spinDirection: 'clockwise',
  speed: 'normal',
  customDuration: null,
  customRotations: null,
  easing: 'easeOutQuart',
  pointerBounce: true,
  segmentSpacing: 1,
  showLabels: true,
  truncateLabels: true,
  reduceMotionOn: false,
  labelSize: 14,
};

export const useWheelStore = create<WheelState>()(
  persist(
    (set) => ({
      wheelName: 'My Wheel',
      rotation: 0,
      settings: defaultSettings,
      setWheelName: (wheelName) => set({ wheelName }),
      setRotation: (rotation) => set({ rotation }),
      setType: (type) => set((s) => ({ settings: { ...s.settings, type } })),
      setSpinDirection: (spinDirection) =>
        set((s) => ({ settings: { ...s.settings, spinDirection } })),
      setSpeed: (speed) => set((s) => ({ settings: { ...s.settings, speed } })),
      setCustomDuration: (customDuration) =>
        set((s) => ({ settings: { ...s.settings, customDuration } })),
      setCustomRotations: (customRotations) =>
        set((s) => ({ settings: { ...s.settings, customRotations } })),
      setEasing: (easing) => set((s) => ({ settings: { ...s.settings, easing } })),
      setPointerBounce: (pointerBounce) =>
        set((s) => ({ settings: { ...s.settings, pointerBounce } })),
      setSegmentSpacing: (segmentSpacing) =>
        set((s) => ({ settings: { ...s.settings, segmentSpacing } })),
      setShowLabels: (showLabels) =>
        set((s) => ({ settings: { ...s.settings, showLabels } })),
      setLabelSize: (labelSize) =>
        set((s) => ({ settings: { ...s.settings, labelSize } })),
      setReduceMotion: (reduceMotionOn) =>
        set((s) => ({ settings: { ...s.settings, reduceMotionOn } })),
      resetSettings: () => set({ settings: defaultSettings }),
    }),
    {
      name: 'spinora-wheel',
    }
  )
);