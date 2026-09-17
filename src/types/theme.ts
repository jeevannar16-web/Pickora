import type { WheelSettings } from './wheel';
import type { SoundSettings } from './sound';

export type ThemeId =
  | 'aurora'
  | 'midnight-neon'
  | 'ocean'
  | 'sunset'
  | 'candy'
  | 'emerald'
  | 'royal-gold'
  | 'minimal-mono';

export type PointerStyle = 'arrow' | 'triangle' | 'dot' | 'needle';
export type HubStyle = 'solid' | 'ring' | 'glow' | 'minimal';

export type Theme = {
  id: string;
  name: string;
  isPreset: boolean;
  /** Experience tag shown under the theme name in the picker (e.g. "Balanced"). */
  tag?: string;
  /** Shortlisted for the always-visible Quick options picker. */
  curated?: boolean;
  /** One named feel: a preset ships its look + motion feel + sound as a single choice. */
  motion?: Partial<
    Pick<
      WheelSettings,
      'type' | 'speed' | 'easing' | 'segmentSpacing' | 'labelSize' | 'pointerBounce' | 'customDuration' | 'customRotations'
    >
  >;
  /** One named sound profile. Master volume / reduced-sound stay user-controlled. */
  sound?: Partial<
    Pick<SoundSettings, 'spinSoundEnabled' | 'winnerSoundEnabled' | 'tickSoundEnabled'>
  >;
  background: string;
  surface: string;
  elevated: string;
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  danger: string;
  text: string;
  muted: string;
  border: string;
  segmentColors: string[];
  pointerColor: string;
  pointerStyle: PointerStyle;
  hubStyle: HubStyle;
  hubColor: string;
  labelColor: string;
  wheelBorder: string;
  wheelBorderWidth: number;
  confettiColors: string[];
  buttonColor: string;
};