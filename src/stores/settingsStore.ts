import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme } from '../types/theme';
import { THEMES } from '../features/themes/presets';
import { WinnerMode } from '../types/settings';
import { SoundSettings } from '../types/sound';
import { Pack, PackId } from '../types/pack';
import { PACKS } from '../features/packs/presets';
import { useWheelStore } from './wheelStore';
import { useParticipantStore } from './participantStore';
import { getEligibleParticipants } from '../lib/random';

type SettingsState = {
  activeThemeId: string;
  customThemes: Theme[];
  theme: Theme;
  sound: SoundSettings;
  winnerMode: WinnerMode;
  winnerCount: number;
  allowDuplicates: boolean;
  removeWinners: boolean;
  activePack: PackId;
  setTheme: (id: string) => void;
  saveCustomTheme: (theme: Theme) => void;
  updateActiveTheme: (updates: Partial<Theme>) => void;
  resetTheme: () => void;
  setSound: (updates: Partial<SoundSettings>) => void;
  setWinnerMode: (mode: WinnerMode) => void;
  setWinnerCount: (count: number) => void;
  setAllowDuplicates: (b: boolean) => void;
  setRemoveWinners: (b: boolean) => void;
  setPack: (id: PackId) => void;
};

function resolveTheme(activeId: string, customThemes: Theme[]): Theme {
  if (activeId.startsWith('custom:')) {
    const found = customThemes.find((t) => t.id === activeId);
    if (found) return found;
    return THEMES.aurora;
  }
  return THEMES[activeId] ?? THEMES.aurora;
}

// A preset is ONE named experience: when it's applied, its look goes with its
// motion feel and sound profile. Master volume / reduced-sound stay user-owned.
function applyThemeBundles(theme: Theme, setSound: (u: Partial<SoundSettings>) => void) {
  if (theme.motion) {
    useWheelStore.getState().setSettings(theme.motion);
  }
  if (theme.sound) {
    setSound(theme.sound);
  }
}

const defaultSound: SoundSettings = {
  masterEnabled: true,
  masterVolume: 50,
  spinSoundEnabled: true,
  winnerSoundEnabled: true,
  tickSoundEnabled: true,
  reducedSoundMode: false,
};

function applyPackBundles(pack: Pack, setSound: (u: Partial<SoundSettings>) => void) {
  if (pack.motion) {
    useWheelStore.getState().setSettings(pack.motion);
  }
  if (pack.sound) {
    setSound(pack.sound);
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      activeThemeId: 'aurora',
      customThemes: [],
      theme: THEMES.aurora,
      sound: defaultSound,
      winnerMode: 'single',
      winnerCount: 1,
      allowDuplicates: false,
      removeWinners: false,
      activePack: 'custom',

      setTheme: (activeThemeId) => {
        const theme = resolveTheme(activeThemeId, get().customThemes);
        set({ activeThemeId, theme });
        applyThemeBundles(theme, get().setSound);
      },

      saveCustomTheme: (theme) => {
        const existing = get().customThemes;
        const idx = existing.findIndex((t) => t.id === theme.id);
        let next: Theme[];
        if (idx >= 0) {
          next = existing.map((t, i) => (i === idx ? theme : t));
        } else {
          next = [...existing, { ...theme, isPreset: false }];
        }
        set({ customThemes: next, activeThemeId: theme.id, theme });
      },

      updateActiveTheme: (updates) => {
        const current = get().theme;
        const next: Theme = { ...current, ...updates, isPreset: false };
        set({ theme: next, activeThemeId: next.id.startsWith('custom:') ? next.id : `custom:${next.id}` });
      },

      resetTheme: () => {
        const presetId = get().activeThemeId.replace('custom:', '');
        const preset = THEMES[presetId] ?? THEMES.aurora;
        set({ activeThemeId: preset.id, theme: preset });
        applyThemeBundles(preset, get().setSound);
      },

      setSound: (updates) => set({ sound: { ...get().sound, ...updates } }),
      setWinnerMode: (winnerMode) => set({ winnerMode }),
      setWinnerCount: (winnerCount) => set({ winnerCount }),
      setAllowDuplicates: (allowDuplicates) => set({ allowDuplicates }),
      setRemoveWinners: (removeWinners) => set({ removeWinners }),
      setPack: (activePack) => {
        const pack = PACKS[activePack] ?? PACKS.custom;
        set({ activePack });
        applyPackBundles(pack, get().setSound);
      },
    }),
    {
      name: 'spinora-settings',
      partialize: (state) => ({
        activeThemeId: state.activeThemeId,
        customThemes: state.customThemes,
        sound: state.sound,
        winnerMode: state.winnerMode,
        winnerCount: state.winnerCount,
        allowDuplicates: state.allowDuplicates,
        removeWinners: state.removeWinners,
        activePack: state.activePack,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.theme = resolveTheme(state.activeThemeId, state.customThemes ?? []);
        }
        clampWinnerCountToEligible();
      },
    }
  )
);

// Winner count is context-aware, not a static number:
// - with very few participants (2-4) the suggested default is 1 — "3 winners
//   from 3 people" isn't a real choice;
// - otherwise the value is clamped live to the current eligible participant
//   count so a spin can never silently ask for more winners than exist.
function normalizeWinnerCount(current: number, eligible: number): number {
  if (eligible <= 0) return Math.max(1, current);
  if (eligible <= 4) return 1;
  return Math.max(1, Math.min(current, eligible));
}

function clampWinnerCountToEligible() {
  const eligible = getEligibleParticipants(useParticipantStore.getState().participants).length;
  const settings = useSettingsStore.getState();
  const next = normalizeWinnerCount(settings.winnerCount, eligible);
  if (next !== settings.winnerCount) {
    settings.setWinnerCount(next);
  }
}

useParticipantStore.subscribe((state, prev) => {
  if (state.participants === prev.participants) return;
  clampWinnerCountToEligible();
});