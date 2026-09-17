import { Participant } from '../types/participant';

export type WheelFile = {
  version: 1;
  name: string;
  participants: Participant[];
  themeId: string;
  wheelType: string;
  winnerSettings: {
    mode: string;
    winnerCount: number;
    allowDuplicates: boolean;
    removeWinners: boolean;
  };
  animationSettings: unknown;
  soundSettings: unknown;
  createdAt: number;
  updatedAt: number;
};

export function isValidWheelFile(data: unknown): data is WheelFile {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (d.version !== 1) return false;
  if (typeof d.name !== 'string') return false;
  if (!Array.isArray(d.participants)) return false;
  return true;
}

export function serializeWheel(state: {
  wheelName: string;
  participants: Participant[];
  themeId: string;
  wheelType: string;
  winnerMode: string;
  winnerCount: number;
  allowDuplicates: boolean;
  removeWinners: boolean;
}): string {
  const file: WheelFile = {
    version: 1,
    name: state.wheelName,
    participants: state.participants,
    themeId: state.themeId,
    wheelType: state.wheelType,
    winnerSettings: {
      mode: state.winnerMode,
      winnerCount: state.winnerCount,
      allowDuplicates: state.allowDuplicates,
      removeWinners: state.removeWinners,
    },
    animationSettings: {},
    soundSettings: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  return JSON.stringify(file, null, 2);
}

export function parseWheelFile(text: string): { wheel: WheelFile; error?: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { wheel: null as unknown as WheelFile, error: 'The JSON file is corrupt and could not be parsed.' };
  }
  if (!isValidWheelFile(data)) {
    return { wheel: null as unknown as WheelFile, error: 'Unsupported wheel file format or version.' };
  }
  return { wheel: data };
}