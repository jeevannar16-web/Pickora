import { describe, expect, it } from 'vitest';
import { parseCSV, exportCSV, parseParticipantCSV } from './csv';
import { parseWheelFile, serializeWheel } from './json';
import { sanitizeWeight, validateName, validateParticipantCount, MAX_PARTICIPANTS } from './validation';
import { createDrawHistoryItem } from './drawId';
import { Participant } from '@/types/participant';

describe('parseCSV', () => {
  it('parses simple rows', () => {
    const rows = parseCSV('name\nalice,bob\ncarol');
    expect(rows[0]).toEqual(['name']);
    expect(rows[1]).toEqual(['alice', 'bob']);
    expect(rows[2]).toEqual(['carol']);
  });

  it('handles quoted fields', () => {
    const rows = parseCSV('"a,b",c');
    expect(rows[0]).toEqual(['a,b', 'c']);
  });
});

describe('parseParticipantCSV', () => {
  it('finds the name column', () => {
    const res = parseParticipantCSV('name,email\nalice,a@x.com\nbob');
    expect(res.error).toBeUndefined();
    expect(res.names).toEqual(['alice', 'bob']);
  });

  it('accepts files without header', () => {
    const res = parseParticipantCSV('alice\nbob\n');
    expect(res.names).toEqual(['alice', 'bob']);
  });

  it('errors on empty file', () => {
    const res = parseParticipantCSV('');
    expect(res.error).toBeDefined();
  });
});

describe('exportCSV', () => {
  it('quotes names containing commas', () => {
    const csv = exportCSV(['Doe, Jane', 'Bob']);
    expect(csv).toContain('"Doe, Jane"');
    expect(csv).toContain('Bob');
  });
});

describe('serializeWheel / parseWheelFile', () => {
  it('round-trips a wheel', () => {
    const participants: Participant[] = [{ id: '1', name: 'a', weight: 1, enabled: true, createdAt: 1 }];
    const json = serializeWheel({
      wheelName: 'Test',
      participants,
      themeId: 'ocean',
      wheelType: 'classic',
      winnerMode: 'single',
      winnerCount: 1,
      allowDuplicates: false,
      removeWinners: false,
    });
    const parsed = parseWheelFile(json);
    expect(parsed.error).toBeUndefined();
    expect(parsed.wheel.name).toBe('Test');
    expect(parsed.wheel.participants).toHaveLength(1);
  });

  it('errors on corrupt JSON', () => {
    const parsed = parseWheelFile('{bad json');
    expect(parsed.error).toBeDefined();
  });

  it('errors on unsupported version', () => {
    const parsed = parseWheelFile(JSON.stringify({ version: 99, name: 'x', participants: [] }));
    expect(parsed.error).toBeDefined();
  });
});

describe('sanitizeWeight', () => {
  it('accepts valid numbers', () => {
    expect(sanitizeWeight(5)).toBe(5);
  });

  it('rejects negatives', () => {
    expect(sanitizeWeight(-1)).toBeNull();
  });

  it('rejects NaN', () => {
    expect(sanitizeWeight('abc')).toBeNull();
  });
});

describe('validateName', () => {
  it('rejects empty', () => {
    expect(validateName('  ', []).valid).toBe(false);
  });

  it('rejects duplicates', () => {
    const list = [{ id: '1', name: 'Alice', weight: 1, enabled: true, createdAt: 1 }];
    expect(validateName('alice', list).valid).toBe(false);
  });

  it('accepts new names', () => {
    expect(validateName('Bob', []).valid).toBe(true);
  });

  it('enforces max participants', () => {
    const full = Array.from({ length: MAX_PARTICIPANTS }, (_, i) => ({
      id: String(i),
      name: `p${i}`,
      weight: 1,
      enabled: true,
      createdAt: i,
    }));
    expect(validateName('extra', full).valid).toBe(false);
  });
});

describe('validateParticipantCount', () => {
  it('rejects zero', () => {
    expect(validateParticipantCount(0, 5).valid).toBe(false);
  });

  it('rejects counts above eligible', () => {
    expect(validateParticipantCount(4, 3).valid).toBe(false);
  });

  it('accepts valid counts', () => {
    expect(validateParticipantCount(2, 5).valid).toBe(true);
  });
});

describe('createDrawHistoryItem', () => {
  it('creates a history item with draw id', () => {
    const item = createDrawHistoryItem({
      wheelName: 'W',
      winners: ['a', 'b'],
      participantCount: 10,
      winnerMode: 'Multiple',
      winnersRemoved: false,
    });
    expect(item.drawId.length).toBeGreaterThan(0);
    expect(item.winners).toEqual(['a', 'b']);
    expect(item.participantCount).toBe(10);
  });
});