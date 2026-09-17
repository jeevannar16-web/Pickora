export type WinnerMode = 'single' | 'multi' | 'sequential' | 'elimination';

export type WinnerSettings = {
  mode: WinnerMode;
  winnerCount: number;
  allowDuplicates: boolean;
  removeWinners: boolean;
  keepWinners: boolean;
};