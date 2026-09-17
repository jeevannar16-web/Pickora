import { Participant } from '../types/participant';

function hasSecureRandom(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function';
}

function secureRandomNumbers(count: number): number[] {
  if (!hasSecureRandom()) {
    return Array.from({ length: count }, () => Math.random());
  }
  const arr = new Uint32Array(count);
  crypto.getRandomValues(arr);
  const max = 0xffffffff;
  return Array.from(arr, (v) => v / (max + 1));
}

export function getEligibleParticipants(participants: Participant[]): Participant[] {
  return participants.filter((p) => p.enabled);
}

export function generateDrawId(): string {
  const useUUID = typeof crypto !== 'undefined' && 'randomUUID' in crypto;
  if (useUUID) {
    return crypto.randomUUID().slice(0, 8).toUpperCase();
  }
  const rand = secureRandomNumbers(4);
  return rand.map((r) => r.toString(16).slice(2, 6)).join('').toUpperCase().slice(0, 8);
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  const rands = secureRandomNumbers(result.length);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rands[i] * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function selectRandomWinner(participants: Participant[]): Participant | null {
  const eligible = getEligibleParticipants(participants);
  if (eligible.length === 0) return null;
  const rands = secureRandomNumbers(1);
  const index = Math.floor(rands[0] * eligible.length);
  return eligible[index];
}

export function selectRandomWinners(participants: Participant[], count: number, allowDuplicates = false): Participant[] {
  const eligible = getEligibleParticipants(participants);
  if (eligible.length === 0) return [];
  const clamped = Math.max(1, Math.min(count, allowDuplicates ? eligible.length : eligible.length));

  if (allowDuplicates) {
    const rands = secureRandomNumbers(clamped);
    return rands.map((r) => eligible[Math.floor(r * eligible.length)]);
  }
  const pool = shuffleArray(eligible);
  return pool.slice(0, clamped);
}

export function selectWeightedWinner(participants: Participant[]): Participant | null {
  const eligible = getEligibleParticipants(participants);
  if (eligible.length === 0) return null;
  const total = eligible.reduce((sum, p) => sum + Math.max(0, p.weight), 0);
  if (total <= 0) return selectRandomWinner(eligible);
  const rands = secureRandomNumbers(1);
  let target = rands[0] * total;
  for (const p of eligible) {
    const weight = Math.max(0, p.weight);
    target -= weight;
    if (target < 0) return p;
  }
  return eligible[eligible.length - 1];
}

export function selectWeightedWinners(
  participants: Participant[],
  count: number,
  allowDuplicates = false
): Participant[] {
  const eligible = getEligibleParticipants(participants);
  if (eligible.length === 0) return [];
  const clamped = Math.max(1, Math.min(count, allowDuplicates ? eligible.length : eligible.length));
  if (allowDuplicates) {
    const results: Participant[] = [];
    for (let i = 0; i < clamped; i++) {
      const w = selectWeightedWinner(eligible);
      if (w) results.push(w);
    }
    return results;
  }
  const pool = [...eligible];
  const results: Participant[] = [];
  for (let i = 0; i < clamped && pool.length > 0; i++) {
    const total = pool.reduce((sum, p) => sum + Math.max(0, p.weight), 0);
    if (total <= 0) {
      const idx = Math.floor(secureRandomNumbers(1)[0] * pool.length);
      results.push(pool[idx]);
      pool.splice(idx, 1);
    } else {
      const rands = secureRandomNumbers(1);
      let target = rands[0] * total;
      let picked = 0;
      for (let j = 0; j < pool.length; j++) {
        target -= Math.max(0, pool[j].weight);
        if (target < 0) {
          picked = j;
          break;
        }
      }
      results.push(pool[picked]);
      pool.splice(picked, 1);
    }
  }
  return results;
}

export function selectRandomWinnersFromList(names: string[], count: number): string[] {
  const shuffled = shuffleArray(names);
  return shuffled.slice(0, Math.min(count, names.length));
}