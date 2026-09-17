import { describe, expect, it } from 'vitest';
import {
  computeFinalWheelRotation,
  getSegmentIndexFromAngle,
  winnerTargetAlignment,
  truncateLabel,
  wrapLabel,
} from './wheelGeometry';

describe('computeFinalWheelRotation', () => {
  it('produces a rotation that lands the winner under the pointer', () => {
    const count = 4;
    const winnerIndex = 1;
    const rotations = 5;
    const rot = computeFinalWheelRotation(winnerIndex, count, rotations, 1);
    const mod = ((rot % 360) + 360) % 360;
    const slice = 90;
    const mid = winnerIndex * slice + slice / 2;
    const globalMid = (mid + mod) % 360;
    const pointer = (-90 + 360) % 360;
    expect(globalMid).toBe(pointer);
  });

  it('includes the full rotations', () => {
    const rot = computeFinalWheelRotation(0, 4, 5, 1);
    expect(rot).toBeGreaterThanOrEqual(5 * 360 - 1);
  });

  it('spins the other way for counterclockwise', () => {
    const rotCW = computeFinalWheelRotation(0, 4, 5, 1);
    const rotCCW = computeFinalWheelRotation(0, 4, 5, -1);
    expect(rotCCW).toBeLessThan(0);
    expect(rotCW).toBeGreaterThan(0);
  });

  it('lands correctly for counterclockwise too', () => {
    const count = 4;
    const winnerIndex = 2;
    const rot = computeFinalWheelRotation(winnerIndex, count, 6, -1);
    const mod = ((rot % 360) + 360) % 360;
    const slice = 90;
    const mid = winnerIndex * slice + slice / 2;
    const globalMid = (mid + mod) % 360;
    const pointer = 270;
    expect(globalMid).toBe(pointer);
  });
});

describe('getSegmentIndexFromAngle', () => {
  it('matches the alignment function', () => {
    const count = 4;
    const align = winnerTargetAlignment(3, count);
    const idx = getSegmentIndexFromAngle(align, count);
    expect(idx).toBe(3);
  });
});

describe('truncateLabel', () => {
  it('truncates long labels with ellipsis', () => {
    expect(truncateLabel('abcdef', 4)).toBe('abc…');
  });

  it('keeps short labels', () => {
    expect(truncateLabel('abc', 5)).toBe('abc');
  });
});

describe('wrapLabel', () => {
  it('splits long words across lines', () => {
    const lines = wrapLabel('Jane Maryanne Doe', 6, 2);
    expect(lines.length).toBeLessThanOrEqual(2);
    expect(lines.join(' ')).toContain('Jane');
  });

  it('returns at most maxLines', () => {
    const lines = wrapLabel('a b c d e f g h i j k', 3, 2);
    expect(lines.length).toBeLessThanOrEqual(2);
  });
});