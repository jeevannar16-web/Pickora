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

export function getSegmentIndexFromAngle(rotationDeg: number, count: number, pointerAngleDeg = -90): number {
  if (count <= 0) return 0;
  const slice = 360 / count;
  const currentGlobal = ((rotationDeg % 360) + 360) % 360;
  const localAlpha = ((pointerAngleDeg - currentGlobal) % 360 + 360) % 360;
  return Math.floor(localAlpha / slice) % count;
}

export function winnerTargetAlignment(
  winnerIndex: number,
  count: number,
  pointerAngleDeg = -90
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
  pointerAngleDeg = -90
): number {
  const alignment = winnerTargetAlignment(winnerIndex, count, pointerAngleDeg);
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
  pointerAngleDeg = -90
): number {
  return computeFinalWheelRotation(winnerIndex, count, rotations, direction, pointerAngleDeg);
}