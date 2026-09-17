export type SoundSettings = {
  masterEnabled: boolean;
  masterVolume: number;
  spinSoundEnabled: boolean;
  winnerSoundEnabled: boolean;
  tickSoundEnabled: boolean;
  reducedSoundMode: boolean;
};

export type AnimationSettings = {
  speed: 'fast' | 'normal' | 'dramatic';
  customDuration: number | null;
  customRotations: number | null;
  easingStyle: EasingStyle;
  pointerBounce: boolean;
  reducedMotionEnabled: boolean;
};

export type EasingStyle = 'easeOut' | 'easeInOut' | 'inOutCubic' | 'easeOutQuart';