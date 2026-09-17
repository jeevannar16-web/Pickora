import { describe, expect, it } from 'vitest';
import {
  getEligibleParticipants,
  selectRandomWinner,
  selectRandomWinners,
  selectWeightedWinner,
  selectWeightedWinners,
  shuffleArray,
  generateDrawId,
} from './random';
import { Participant } from '@/types/participant';

function makeParticipants(names: string[]): Participant[] {
  return names.map((name, i) => ({
    id: `p${i}`,
    name,
    weight: 1,
    enabled: true,
    createdAt: Date.now() + i,
  }));
}

describe('getEligibleParticipants', () => {
  it('filters out disabled participants', () => {
    const list = makeParticipants(['a', 'b', 'c']);
    list[1].enabled = false;
    const result = getEligibleParticipants(list);
    expect(result.map((p) => p.name)).toEqual(['a', 'c']);
  });
});

describe('selectRandomWinner', () => {
  it('returns null for empty list', () => {
    expect(selectRandomWinner([])).toBeNull();
  });

  it('returns one participant from the pool', () => {
    const list = makeParticipants(['a', 'b', 'c', 'd']);
    const winner = selectRandomWinner(list);
    expect(list).toContain(winner);
  });

  it('never returns disabled participants', () => {
    const list = makeParticipants(['a', 'b']);
    list[0].enabled = false;
    const winner = selectRandomWinner(list);
    expect(winner?.name).toBe('b');
  });
});

describe('selectRandomWinners', () => {
  it('returns the requested count', () => {
    const list = makeParticipants(['a', 'b', 'c', 'd', 'e']);
    const winners = selectRandomWinners(list, 3);
    expect(winners).toHaveLength(3);
  });

  it('does not duplicate when duplicates are disabled', () => {
    const list = makeParticipants(['a', 'b', 'c', 'd', 'e']);
    for (let i = 0; i < 50; i++) {
      const winners = selectRandomWinners(list, 3, false);
      const names = winners.map((w) => w.id);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('clamps count to pool size', () => {
    const list = makeParticipants(['a', 'b']);
    expect(selectRandomWinners(list, 10, false)).toHaveLength(2);
  });
});

describe('selectWeightedWinner', () => {
  it('gives more weight to larger weights', () => {
    const list = makeParticipants(['heavy', 'heavy2']);
    list[0].weight = 90;
    list[1].weight = 10;
    let heavyCount = 0;
    for (let i = 0; i < 200; i++) {
      const w = selectWeightedWinner(list);
      if (w?.name === 'heavy') heavyCount++;
    }
    expect(heavyCount).toBeGreaterThan(120);
  });

  it('treats zero weights as eligible via uniform fallback', () => {
    const list = makeParticipants(['a', 'b']);
    list[0].weight = 0;
    list[1].weight = 0;
    const winner = selectWeightedWinner(list);
    expect(list).toContain(winner);
  });
});

describe('selectWeightedWinners', () => {
  it('returns distinct winners without duplicates', () => {
    const list = makeParticipants(['a', 'b', 'c', 'd', 'e']);
    const winners = selectWeightedWinners(list, 3, false);
    expect(winners).toHaveLength(3);
    const ids = winners.map((w) => w.id);
    expect(new Set(ids).size).toBe(3);
  });
});

describe('shuffleArray', () => {
  it('preserves all elements', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = shuffleArray(input);
    expect(shuffled.sort()).toEqual(input);
  });

  it('returns a new array', () => {
    const input = [1, 2, 3];
    expect(shuffleArray(input)).not.toBe(input);
  });
});

describe('generateDrawId', () => {
  it('returns a non-empty string', () => {
    expect(generateDrawId().length).toBeGreaterThan(0);
  });

  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateDrawId()));
    expect(ids.size).toBeGreaterThan(90);
  });
});