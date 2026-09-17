import { WheelSettings } from './wheel';
import { SoundSettings } from './sound';

export type PackId = 'custom' | 'fruits' | 'animals' | 'numbers';

export type Pack = {
  id: PackId;
  name: string;
  tag: string;
  description: string;
  /** Emoji icons cycled across slices (fruits & animals). Numbers uses numerals. */
  icons?: string[];
  /** One-click motion profile that ships with the pack. */
  motion?: Partial<
    Pick<WheelSettings, 'easing' | 'speed' | 'segmentSpacing' | 'pointerBounce'>
  >;
  /** One-click sound profile that ships with the pack. */
  sound?: Partial<
    Pick<SoundSettings, 'tickSoundEnabled' | 'winnerSoundEnabled' | 'spinSoundEnabled'>
  >;
};