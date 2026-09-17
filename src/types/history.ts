export type DrawHistoryItem = {
  id: string;
  drawId: string;
  wheelName: string;
  winners: string[];
  participantCount: number;
  winnerMode: string;
  winnersRemoved: boolean;
  createdAt: number;
};