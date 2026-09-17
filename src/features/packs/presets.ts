import { Pack } from '@/types/pack';

export const PACKS: Record<Pack['id'], Pack> = {
  custom: {
    id: 'custom',
    name: 'Custom',
    tag: 'Your names, your colors',
    description: 'Plain and personal — your names with the theme’s colors.',
  },
  fruits: {
    id: 'fruits',
    name: 'Fruits',
    tag: 'Juicy & bouncy',
    description: 'A fruit on every slice, with a soft squash on landing.',
    icons: ['🍓', '🍊', '🍋', '🍇', '🍉', '🍌', '🍎', '🥝', '🍑', '🍒'],
    motion: { easing: 'easeOutQuart', pointerBounce: true },
    sound: { winnerSoundEnabled: true, tickSoundEnabled: true },
  },
  animals: {
    id: 'animals',
    name: 'Animals',
    tag: 'Playful & alive',
    description: 'Animal friends that gently “breathe” while you decide.',
    icons: ['🦁', '🐸', '🦊', '🐼', '🐰', '🐨', '🦄', '🐢', '🐬', '🦉'],
    motion: { easing: 'easeOut', speed: 'normal' },
    sound: { winnerSoundEnabled: true, tickSoundEnabled: true, spinSoundEnabled: true },
  },
  numbers: {
    id: 'numbers',
    name: 'Numbers',
    tag: 'Precise & mechanical',
    description: 'Bold numerals with a combination-lock tick. Serious draws.',
    motion: { easing: 'easeInOut', segmentSpacing: 2, speed: 'normal' },
    sound: { tickSoundEnabled: true, winnerSoundEnabled: true },
  },
};