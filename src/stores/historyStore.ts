import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DrawHistoryItem } from '../types/history';
import { createDrawHistoryItem } from '../lib/drawId';

type HistoryState = {
  items: DrawHistoryItem[];
  addDraw: (input: {
    wheelName: string;
    winners: string[];
    participantCount: number;
    winnerMode: string;
    winnersRemoved: boolean;
  }) => string;
  removeById: (id: string) => void;
  clearHistory: () => void;
  undoLastDraw: () => void;
};

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: [],
      addDraw: (input) => {
        const item = createDrawHistoryItem(input);
        set({ items: [item, ...get().items].slice(0, 200) });
        return item.id;
      },
      removeById: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },
      clearHistory: () => set({ items: [] }),
      undoLastDraw: () => {
        set({ items: get().items.slice(1) });
      },
    }),
    {
      name: 'spinora-history',
    }
  )
);