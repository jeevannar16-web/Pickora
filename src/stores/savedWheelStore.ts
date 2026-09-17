import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme } from '../types/theme';
import { Participant } from '../types/participant';

export type SavedWheel = {
  id: string;
  name: string;
  participants: Participant[];
  themeId: string;
  customThemes: Theme[];
  wheelType: string;
  winnerSettings: {
    mode: string;
    winnerCount: number;
    allowDuplicates: boolean;
    removeWinners: boolean;
  };
  createdDate: number;
  updatedDate: number;
};

type SavedWheelState = {
  wheels: SavedWheel[];
  saveWheel: (input: Omit<SavedWheel, 'id' | 'createdDate' | 'updatedDate'>) => SavedWheel;
  duplicateWheel: (id: string) => void;
  deleteWheel: (id: string) => void;
  renameWheel: (id: string, name: string) => void;
  getWheel: (id: string) => SavedWheel | undefined;
  loadWheel: (id: string) => SavedWheel | undefined;
  recentlyUsed: string[];
  touchRecent: (id: string) => void;
};

function genWheelId(): string {
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useSavedWheelStore = create<SavedWheelState>()(
  persist(
    (set, get) => ({
      wheels: [],
      recentlyUsed: [],
      saveWheel: (input) => {
        const id = genWheelId();
        const now = Date.now();
        const wheel: SavedWheel = {
          ...input,
          id,
          createdDate: now,
          updatedDate: now,
        };
        set({
          wheels: [wheel, ...get().wheels],
          recentlyUsed: [id, ...get().recentlyUsed.filter((x) => x !== id)].slice(0, 5),
        });
        return wheel;
      },
      duplicateWheel: (id) => {
        const source = get().wheels.find((w) => w.id === id);
        if (!source) return;
        const now = Date.now();
        const copy: SavedWheel = {
          ...source,
          id: genWheelId(),
          name: `${source.name} (copy)`,
          createdDate: now,
          updatedDate: now,
        };
        set({ wheels: [copy, ...get().wheels] });
      },
      deleteWheel: (id) => {
        set({
          wheels: get().wheels.filter((w) => w.id !== id),
          recentlyUsed: get().recentlyUsed.filter((x) => x !== id),
        });
      },
      renameWheel: (id, name) => {
        set({
          wheels: get().wheels.map((w) => (w.id === id ? { ...w, name, updatedDate: Date.now() } : w)),
        });
      },
      getWheel: (id) => get().wheels.find((w) => w.id === id),
      loadWheel: (id) => {
        const w = get().wheels.find((x) => x.id === id);
        if (w) {
          set({ recentlyUsed: [id, ...get().recentlyUsed.filter((x) => x !== id)].slice(0, 5) });
        }
        return w;
      },
      touchRecent: (id) => {
        set({ recentlyUsed: [id, ...get().recentlyUsed.filter((x) => x !== id)].slice(0, 5) });
      },
    }),
    {
      name: 'spinora-saved-wheels',
    }
  )
);