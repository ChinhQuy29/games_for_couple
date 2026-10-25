export const REACTIONS = ['😂', '💀', '❤️', '🤯', '🎨'] as const;
export type Reaction = (typeof REACTIONS)[number];

/** Palette by index; drawings store the index, not the color. */
export const COLORS = ['#2b2140', '#ff4f8b', '#ffc93c', '#3ddc97', '#4cc9f0', '#ff8a3d', '#9b5de5', '#ffffff'] as const;
export const BRUSHES = [4, 10, 22] as const;

/** Drawings are stored on a 1000×1000 grid so they look the same on every screen. */
export const CANVAS_UNITS = 1000;

export const LIMITS = {
  nameMin: 1,
  nameMax: 20,
  promptMin: 3,
  promptMax: 80,
  guessMin: 1,
  guessMax: 80,
  maxStrokes: 300,
  maxPoints: 12000,
  rerolls: 2,
} as const;

export const TIMING = {
  graceMs: 3000,
  promptSec: 45,
  roomIdleMs: 2 * 60 * 60 * 1000,
  roomEmptyMs: 30 * 60 * 1000,
  sweepMs: 5 * 60 * 1000,
  reactionsPerSec: 8,
} as const;

export const ROUND_OPTIONS = [1, 2, 3] as const;
export const STEP_OPTIONS = [2, 4, 6] as const;
export const DRAW_TIMER_OPTIONS = [45, 60, 90, null] as const;
export const GUESS_TIMER_OPTIONS = [20, 30, 45, null] as const;

export const CHAOS_RULES = {
  blind: { emoji: '🙈', text: 'Blind draw: your lines stay invisible until you submit' },
  'one-stroke': { emoji: '✏️', text: "One stroke only: don't lift your pen" },
  'five-strokes': { emoji: '🖐️', text: 'Five strokes max' },
  mirror: { emoji: '🪞', text: 'Mirror hands: left is right, right is left' },
  'one-color': { emoji: '⚫', text: 'One color, no choosing' },
  shaky: { emoji: '🫨', text: 'Shaky hands: good luck staying in the lines' },
  tiny: { emoji: '🐜', text: 'Tiny brush only' },
} as const;
export type ChaosId = keyof typeof CHAOS_RULES;
export const CHAOS_IDS = Object.keys(CHAOS_RULES) as ChaosId[];

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
