export type PolarPoint = {
  x: number;
  y: number;
};

export const TAU = Math.PI * 2;

export function polarToCartesian(cx: number, cy: number, radius: number, angleRad: number): PolarPoint {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

export function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radiansToDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function arcPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const largeArc = endAngle - startAngle <= Math.PI ? 0 : 1;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

export function arcPathFull(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  return arcPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle);
}

export function labelPosition(cx: number, cy: number, radius: number, angle: number): PolarPoint {
  return polarToCartesian(cx, cy, radius, angle);
}

export function truncateLabel(label: string, maxLength: number): string {
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength - 1)}…`;
}

export function wrapLabel(label: string, maxCharsPerLine: number, maxLines = 2): string[] {
  const words = label.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    let chunk = word;
    while (chunk.length > maxCharsPerLine) {
      if (current) {
        lines.push(current);
        current = '';
      }
      if (lines.length >= maxLines) break;
      lines.push(chunk.slice(0, maxCharsPerLine));
      chunk = chunk.slice(maxCharsPerLine);
    }
    if (lines.length >= maxLines) break;
    const candidate = current ? `${current} ${chunk}` : chunk;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = chunk;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

export function getSegmentColor(colors: string[], index: number): string {
  if (colors.length === 0) return '#8B5CF6';
  return colors[index % colors.length];
}

export function getStableSegments(count: number, colors: string[]): string[] {
  return Array.from({ length: count }, (_, i) => getSegmentColor(colors, i));
}

export function getSegmentIndexFromAngle(rotationDeg: number, count: number, pointerAngleDeg = 90): number {
  if (count <= 0) return 0;
  const slice = 360 / count;
  const currentGlobal = ((rotationDeg % 360) + 360) % 360;
  const localAlpha = ((pointerAngleDeg - currentGlobal) % 360 + 360) % 360;
  return Math.floor(localAlpha / slice) % count;
}

const POINTER_ANGLE_DEG = 90; // the fixed pointer sits at 6 o'clock (bottom)

// Mirrors the visual wedge-gap clamp used when rendering (Wheel.tsx -> segmentDefs),
// so the landing math and the painted slices stay in the same angular space.
export function segmentSpacingAngleDegrees(segmentSpacing: number, count: number): number {
  const sliceRad = TAU / count;
  const gapRad = Math.min(Math.max(0, segmentSpacing), sliceRad * 0.35);
  return (gapRad * 180) / Math.PI;
}

// How much of the visible wedge half-width stays clear of the wedge edges.
const SAFE_LANDING_EDGE_BUFFER = 0.18;

// The winner's slice can land anywhere inside this zone: its center plus or
// minus `halfSafe`, which already excludes the inter-wedge gaps AND a buffer
// near each painted edge. "within the nominal arc" is not enough — this is the
// zone the pointer is guaranteed to rest in.
export function getSafeLandingZone(
  winnerIndex: number,
  count: number,
  pointerAngleDeg = POINTER_ANGLE_DEG,
  segmentSpacing = 0
): { center: number; halfVisible: number; halfSafe: number } {
  const slice = 360 / count;
  const gap = segmentSpacingAngleDegrees(segmentSpacing, count);
  const halfVisible = Math.max(0, (slice - gap) / 2);
  const halfSafe = Math.max(0, halfVisible * (1 - SAFE_LANDING_EDGE_BUFFER));
  const center = winnerIndex * slice + slice / 2;
  return { center, halfVisible, halfSafe };
}

export function winnerTargetAlignment(
  winnerIndex: number,
  count: number,
  pointerAngleDeg = POINTER_ANGLE_DEG
): number {
  const slice = 360 / count;
  const mid = winnerIndex * slice + slice / 2;
  const alignment = ((pointerAngleDeg - mid) % 360 + 360) % 360;
  return alignment;
}

export function computeFinalWheelRotation(
  winnerIndex: number,
  count: number,
  rotations: number,
  direction: 1 | -1 = 1,
  pointerAngleDeg = POINTER_ANGLE_DEG,
  segmentSpacing = 0,
  random: () => number = Math.random
): number {
  const { center, halfSafe } = getSafeLandingZone(winnerIndex, count, pointerAngleDeg, segmentSpacing);
  // No spacing -> land dead-center (deterministic). With spacing -> pick a
  // resting angle inside the safe inner zone, never into the gap or an edge.
  const jitter = segmentSpacing > 0 && halfSafe > 0 ? (random() * 2 - 1) * halfSafe : 0;
  const target = center + jitter;
  const alignment = ((pointerAngleDeg - target) % 360 + 360) % 360;
  if (direction === 1) {
    return rotations * 360 + alignment;
  }
  const ccwAlignment = (360 - alignment) % 360;
  return -(rotations * 360 + ccwAlignment);
}

export function finalRotationToWinner(
  winnerIndex: number,
  count: number,
  rotations: number,
  direction: 1 | -1 = 1,
  pointerAngleDeg = POINTER_ANGLE_DEG,
  segmentSpacing = 0
): number {
  return computeFinalWheelRotation(winnerIndex, count, rotations, direction, pointerAngleDeg, segmentSpacing);
}