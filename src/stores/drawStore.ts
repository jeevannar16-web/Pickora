import { create } from 'zustand';
import { Participant } from '../types/participant';

export type DrawResult = {
  winners: Participant[];
  mode: string;
  drawId: string;
  pulled: Date;
};

export type SpinPhase = 'idle' | 'windup' | 'spin' | 'landing' | 'win';

type DrawState = {
  lastResult: DrawResult | null;
  eligibleCount: number;
  phase: SpinPhase;
  winnerIndexes: number[];
  ghostName: string;
  setLastResult: (r: DrawResult | null) => void;
  setEligibleCount: (n: number) => void;
  setPhase: (phase: SpinPhase) => void;
  setWinnerIndexes: (indexes: number[]) => void;
  setGhostName: (name: string) => void;
};

export const useDrawStore = create<DrawState>()((set) => ({
  lastResult: null,
  eligibleCount: 0,
  phase: 'idle',
  winnerIndexes: [],
  ghostName: '',
  setLastResult: (lastResult) => set({ lastResult }),
  setEligibleCount: (eligibleCount) => set({ eligibleCount }),
  setPhase: (phase) => set({ phase }),
  setWinnerIndexes: (winnerIndexes) => set({ winnerIndexes }),
  setGhostName: (ghostName) => set({ ghostName }),
}));