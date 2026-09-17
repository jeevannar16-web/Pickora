import { create } from 'zustand';
import { Participant } from '../types/participant';

export type DrawResult = {
  winners: Participant[];
  mode: string;
  drawId: string;
  pulled: Date;
};

type DrawState = {
  lastResult: DrawResult | null;
  eligibleCount: number;
  setLastResult: (r: DrawResult | null) => void;
  setEligibleCount: (n: number) => void;
};

export const useDrawStore = create<DrawState>()((set) => ({
  lastResult: null,
  eligibleCount: 0,
  setLastResult: (lastResult) => set({ lastResult }),
  setEligibleCount: (eligibleCount) => set({ eligibleCount }),
}));