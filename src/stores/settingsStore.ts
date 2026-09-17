import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme } from '../types/theme';
import { THEMES } from '../features/themes/presets';
import { WinnerMode } from '../types/settings';
import { SoundSettings } from '../types/sound';

type SettingsState = {
  activeThemeId: string;
  customThemes: Theme[];
  theme: Theme;
  sound: SoundSettings;
  winnerMode: WinnerMode;
  winnerCount: number;
  allowDuplicates: boolean;
  removeWinners: boolean;
  setTheme: (id: string) => void;
  saveCustomTheme: (theme: Theme) => void;
  updateActiveTheme: (updates: Partial<Theme>) => void;
  resetTheme: () => void;
  setSound: (updates: Partial<SoundSettings>) => void;
  setWinnerMode: (mode: WinnerMode) => void;
  setWinnerCount: (count: number) => void;
  setAllowDuplicates: (b: boolean) => void;
  setRemoveWinners: (b: boolean) => void;
};

function resolveTheme(activeId: string, customThemes: Theme[]): Theme {
  if (activeId.startsWith('custom:')) {
    const found = customThemes.find((t) => t.id === activeId);
    if (found) return found;
    return THEMES.aurora;
  }
  return THEMES[activeId] ?? THEMES.aurora;
}

const defaultSound: SoundSettings = {
  masterEnabled: true,
  masterVolume: 50,
  spinSoundEnabled: true,
  winnerSoundEnabled: true,
  tickSoundEnabled: true,
  reducedSoundMode: false,
};

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

      setTheme: (activeThemeId) => {
        const theme = resolveTheme(activeThemeId, get().customThemes);
        set({ activeThemeId, theme });
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
      },

      setSound: (updates) => set({ sound: { ...get().sound, ...updates } }),
      setWinnerMode: (winnerMode) => set({ winnerMode }),
      setWinnerCount: (winnerCount) => set({ winnerCount }),
      setAllowDuplicates: (allowDuplicates) => set({ allowDuplicates }),
      setRemoveWinners: (removeWinners) => set({ removeWinners }),
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
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.theme = resolveTheme(state.activeThemeId, state.customThemes ?? []);
        }
      },
    }
  )
);