import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Participant } from '../types/participant';
import { MAX_PARTICIPANTS } from '../lib/validation';

let idCounter = 0;
function genId(): string {
  idCounter++;
  return `p_${Date.now().toString(36)}_${idCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

type ParticipantState = {
  participants: Participant[];
  lastRemoved: Participant | null;
  addParticipant: (name: string, weight?: number) => { ok: boolean; message?: string };
  addParticipants: (names: string[], weights?: Record<string, number>) => { ok: boolean; added: number; skipped: string[] };
  removeParticipant: (id: string) => void;
  removeAllParticipants: () => void;
  undoRemove: () => void;
  updateParticipant: (id: string, updates: Partial<Participant>) => void;
  toggleParticipant: (id: string) => void;
  sortByName: () => void;
  shuffleParticipants: () => void;
  removeDuplicates: () => void;
};

export const useParticipantStore = create<ParticipantState>()(
  persist(
    (set, get) => ({
      participants: [],
      lastRemoved: null,

      addParticipant: (name, weight = 1) => {
        const trimmed = name.trim();
        if (!trimmed) return { ok: false, message: 'Name cannot be empty.' };
        const existing = get().participants;
        if (existing.length >= MAX_PARTICIPANTS) {
          return { ok: false, message: `Maximum of ${MAX_PARTICIPANTS} participants allowed.` };
        }
        const dupe = existing.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());
        if (dupe) return { ok: false, message: `"${trimmed}" is already in the list.` };
        const p: Participant = {
          id: genId(),
          name: trimmed,
          weight: Math.max(1, weight),
          enabled: true,
          createdAt: Date.now(),
        };
        set({ participants: [...existing, p] });
        return { ok: true };
      },

      addParticipants: (names, weights) => {
        const current = get().participants;
        const added: Participant[] = [];
        const skipped: string[] = [];
        const existingNames = new Set(current.map((p) => p.name.toLowerCase()));
        for (const raw of names) {
          const trimmed = raw.trim();
          if (!trimmed) continue;
          if (current.length + added.length >= MAX_PARTICIPANTS) {
            skipped.push(trimmed);
            continue;
          }
          const lw = trimmed.toLowerCase();
          if (existingNames.has(lw) || added.some((a) => a.name.toLowerCase() === lw)) {
            skipped.push(trimmed);
            continue;
          }
          const w = weights && weights[trimmed] != null ? weights[trimmed] : 1;
          added.push({
            id: genId(),
            name: trimmed,
            weight: Math.max(1, w),
            enabled: true,
            createdAt: Date.now(),
          });
          existingNames.add(lw);
        }
        if (added.length > 0) {
          set({ participants: [...current, ...added] });
        }
        return { ok: true, added: added.length, skipped };
      },

      removeParticipant: (id) => {
        const { participants } = get();
        const target = participants.find((p) => p.id === id);
        if (!target) return;
        set({
          participants: participants.filter((p) => p.id !== id),
          lastRemoved: target,
        });
      },

      removeAllParticipants: () => {
        set({ participants: [], lastRemoved: null });
      },

      undoRemove: () => {
        const { lastRemoved, participants } = get();
        if (!lastRemoved) return;
        set({ participants: [...participants, lastRemoved], lastRemoved: null });
      },

      updateParticipant: (id, updates) => {
        set({
          participants: get().participants.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        });
      },

      toggleParticipant: (id) => {
        set({
          participants: get().participants.map((p) =>
            p.id === id ? { ...p, enabled: !p.enabled } : p
          ),
        });
      },

      sortByName: () => {
        set({
          participants: [...get().participants].sort((a, b) => a.name.localeCompare(b.name)),
        });
      },

      shuffleParticipants: () => {
        const arr = [...get().participants];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        set({ participants: arr });
      },

      removeDuplicates: () => {
        const seen = new Set<string>();
        const deduped = get().participants.filter((p) => {
          const lw = p.name.toLowerCase();
          if (seen.has(lw)) return false;
          seen.add(lw);
          return true;
        });
        set({ participants: deduped });
      },
    }),
    {
      name: 'spinora-participants',
      partialize: (state) => ({ participants: state.participants }),
    }
  )
);