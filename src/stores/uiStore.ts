import { create } from 'zustand';

export type ActivePanel = 'participants' | 'wheel' | 'settings' | 'history';

type UIState = {
  activePanel: ActivePanel;
  isSpinning: boolean;
  isPresenting: boolean;
  winnerModalOpen: boolean;
  lastWinners: { names: string[]; drawId: string; mode: string } | null;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  confirmationOpen: boolean;
  confirmationAction: (() => void) | null;
  confirmationText: string;
  setActivePanel: (p: ActivePanel) => void;
  setIsSpinning: (b: boolean) => void;
  setIsPresenting: (b: boolean) => void;
  setWinnerModalOpen: (b: boolean) => void;
  setLastWinners: (w: { names: string[]; drawId: string; mode: string } | null) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
  requestConfirmation: (action: () => void, text: string) => void;
  closeConfirmation: () => void;
};

export const useUIStore = create<UIState>()((set) => ({
  activePanel: 'wheel',
  isSpinning: false,
  isPresenting: false,
  winnerModalOpen: false,
  lastWinners: null,
  toast: null,
  confirmationOpen: false,
  confirmationAction: null,
  confirmationText: '',
  setActivePanel: (activePanel) => set({ activePanel }),
  setIsSpinning: (isSpinning) => set({ isSpinning }),
  setIsPresenting: (isPresenting) => set({ isPresenting }),
  setWinnerModalOpen: (winnerModalOpen) => set({ winnerModalOpen }),
  setLastWinners: (lastWinners) => set({ lastWinners }),
  showToast: (message, type = 'info') => set({ toast: { message, type } }),
  clearToast: () => set({ toast: null }),
  requestConfirmation: (confirmationAction, confirmationText) => set({ confirmationOpen: true, confirmationAction, confirmationText }),
  closeConfirmation: () => set({ confirmationOpen: false, confirmationAction: null }),
}));