export const REACTIONS = ['😂', '💀', '❤️', '🤢', '🔥'] as const;
export type Reaction = (typeof REACTIONS)[number];

export const CATEGORIES = [
  { id: 'us', label: '💑 Us' },
  { id: 'gross', label: '🤢 Gross' },
  { id: 'powers', label: '🦸 Powers & curses' },
  { id: 'food', label: '🍕 Food' },
  { id: 'absurd', label: '🦆 Absurd' },
  { id: 'life', label: '🌱 Life' },
  { id: 'spicy', label: '🌶️ Spicy' },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]['id'];

export const LIMITS = {
  nameMin: 1,
  nameMax: 20,
  optionMin: 3,
  optionMax: 90,
  defenseMax: 120,
} as const;

export const TIMING = {
  graceMs: 3000,
  debateSec: 30,
  writeSec: 75,
  roomIdleMs: 2 * 60 * 60 * 1000,
  roomEmptyMs: 30 * 60 * 1000,
  sweepMs: 5 * 60 * 1000,
  reactionsPerSec: 8,
} as const;

export const QUESTION_OPTIONS = [10, 15, 20] as const;
export const ANSWER_TIMER_OPTIONS = [15, 30, null] as const;
/** Every Nth question is written by a player (alternating), or never. */
export const CUSTOM_EVERY_OPTIONS = [null, 5, 3] as const;

/** Silly verdicts for the recap, by match rate. */
export const VERDICTS = [
  { min: 0, emoji: '🧲', text: 'Opposites attract' },
  { min: 0.35, emoji: '🌶️', text: 'A spicy balance' },
  { min: 0.6, emoji: '🫛', text: 'Two peas in a pod' },
  { min: 0.85, emoji: '👯', text: 'Literally the same person' },
] as const;

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
