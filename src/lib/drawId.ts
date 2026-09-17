import { DrawHistoryItem } from '../types/history';
import { generateDrawId } from './random';

export function createDrawHistoryItem(input: {
  wheelName: string;
  winners: string[];
  participantCount: number;
  winnerMode: string;
  winnersRemoved: boolean;
}): DrawHistoryItem {
  return {
    id: generateDrawId() + '-' + Date.now().toString(36),
    drawId: generateDrawId(),
    wheelName: input.wheelName,
    winners: [...input.winners],
    participantCount: input.participantCount,
    winnerMode: input.winnerMode,
    winnersRemoved: input.winnersRemoved,
    createdAt: Date.now(),
  };
}