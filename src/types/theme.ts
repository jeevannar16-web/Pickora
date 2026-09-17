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