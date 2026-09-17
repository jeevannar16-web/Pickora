import { describe, expect, it } from 'vitest';
import {
  computeFinalWheelRotation,
  getSafeLandingZone,
  getSegmentIndexFromAngle,
  winnerTargetAlignment,
  truncateLabel,
  wrapLabel,
} from './wheelGeometry';

// The fixed pointer graphic sits at the bottom (6 o'clock), so the geometry
// convention is +90°, not -90°.
const POINTER = 90;

describe('computeFinalWheelRotation', () => {
  it('produces a rotation that lands the winner under the pointer', () => {
    const count = 4;
    const winnerIndex = 1;
    const rotations = 5;
    const rot = computeFinalWheelRotation(winnerIndex, count, rotations, 1, POINTER);
    const mod = ((rot % 360) + 360) % 360;
    const slice = 90;
    const mid = winnerIndex * slice + slice / 2;
    const globalMid = (mid + mod) % 360;
    expect(globalMid).toBe(POINTER);
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
    expect(globalMid).toBe(POINTER);
  });
});

describe('safe landing zone (no gap between pointer and painted wedge)', () => {
  it('lands dead-center when there is no segment spacing', () => {
    for (let count = 2; count <= 50; count++) {
      for (let winner = 0; winner < count; winner++) {
        const rot = computeFinalWheelRotation(winner, count, 5, 1, POINTER, 0);
        const mod = ((rot % 360) + 360) % 360;
        const target = ((POINTER - mod) % 360 + 360) % 360;
        const { center } = getSafeLandingZone(winner, count, POINTER, 0);
        const offset = ((target - center) % 360 + 360) % 360;
        expect(Math.min(offset, 360 - offset)).toBeLessThan(1e-9); // exactly centred
      }
    }
  });

  it('never lands in the gap or near the painted edges for any count/spacing', () => {
    const spacings = [0, 1, 2, 3, 4, 6, 8, 10, 20, 50];
    let seed = 1234567;
    const rng = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };

    for (let count = 2; count <= 50; count++) {
      for (const spacing of spacings) {
        for (const direction of [1, -1] as const) {
          for (let winner = 0; winner < count; winner++) {
            const rot = computeFinalWheelRotation(winner, count, 5, direction, POINTER, spacing, rng);
            const mod = ((rot % 360) + 360) % 360;
            // The wheel-local angle currently resting under the pointer:
            const target = ((POINTER - mod) % 360 + 360) % 360;
            const { center, halfVisible, halfSafe } = getSafeLandingZone(winner, count, POINTER, spacing);

            const offset = ((target - center) % 360 + 360) % 360;
            const err = Math.min(offset, 360 - offset);

            expect(err).toBeLessThanOrEqual(halfSafe + 1e-9);
            // The zone is a true inner zone: it always excludes the wedge
            // edges/gaps, and the landing never touches them.
            expect(halfSafe).toBeLessThan(halfVisible);
            expect(err).toBeLessThan(halfVisible);
          }
        }
      }
    }
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