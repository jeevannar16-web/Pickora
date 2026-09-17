export type WheelType =
  | 'classic'
  | 'neon'
  | 'minimal'
  | 'prize'
  | 'gradient'
  | 'monochrome'
  | 'compact'
  | 'party';

export type SpinDirection = 'clockwise' | 'counterclockwise';
export type SpinSpeed = 'fast' | 'normal' | 'dramatic';
export type EasingStyle = 'easeOut' | 'easeInOut' | 'inOutCubic' | 'easeOutQuart';

export type WheelSettings = {
  type: WheelType;
  spinDirection: SpinDirection;
  speed: SpinSpeed;
  customDuration: number | null;
  customRotations: number | null;
  easing: EasingStyle;
  pointerBounce: boolean;
  segmentSpacing: number;
  showLabels: boolean;
  truncateLabels: boolean;
  reduceMotionOn: boolean;
  labelSize: number;
};