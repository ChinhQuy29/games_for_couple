export const REACTIONS = ['😂', '💀', '❤️', '🍅', '🤯'] as const;
export type Reaction = (typeof REACTIONS)[number];

export const CATEGORIES = [
  { id: 'us', label: '💑 Us' },
  { id: 'ldr', label: '✈️ Long distance' },
  { id: 'absurd', label: '🦆 Absurd' },
  { id: 'food', label: '🍜 Food' },
  { id: 'life', label: '🌱 Life' },
  { id: 'hypothetical', label: '🤔 What if' },
  { id: 'confessions', label: '🙊 Confessions' },
  { id: 'spicy', label: '🌶️ Spicy' },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]['id'];

export const LIMITS = {
  nameMin: 1,
  nameMax: 20,
  starterMin: 3,
  starterMax: 120,
  endingMin: 1,
  endingMax: 120,
  rerolls: 2,
} as const;

export const TIMING = {
  graceMs: 3000,
  roomIdleMs: 2 * 60 * 60 * 1000,
  roomEmptyMs: 30 * 60 * 1000,
  sweepMs: 5 * 60 * 1000,
  reactionsPerSec: 8,
} as const;

export const ROUND_OPTIONS = [3, 5, 7, 10] as const;
export const TIMER_OPTIONS = [30, 45, 60, 90, null] as const;
export const MODES = ['classic', 'peek', 'blind'] as const;

export const MODE_INFO = {
  classic: { label: 'Classic', emoji: '👀', blurb: 'You see the whole start.' },
  peek: { label: 'Peek', emoji: '🫣', blurb: 'You only see the last 2 words.' },
  blind: { label: 'Blind', emoji: '🙈', blurb: 'You see nothing. Pure chaos.' },
} as const;

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
