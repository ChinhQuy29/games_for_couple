export type Lang = 'vi' | 'en';
export type Text = Record<Lang, string>;

export const CATEGORIES = [
  { id: 'sgp', label: { vi: '👻 Saigon Phantom', en: '👻 Saigon Phantom' } },
  { id: 'players', label: { vi: '⭐ Tuyển thủ', en: '⭐ Players' } },
  { id: 'aog', label: { vi: '🏆 Đấu Trường Danh Vọng', en: '🏆 AOG league' } },
  { id: 'rivals', label: { vi: '⚔️ Kình địch', en: '⚔️ Rivals' } },
  { id: 'intl', label: { vi: '🌏 Quốc tế', en: '🌏 International' } },
  { id: 'drama', label: { vi: '🍿 Drama & chuyển nhượng', en: '🍿 Drama & transfers' } },
  { id: 'game', label: { vi: '🎮 Liên Quân', en: '🎮 The game' } },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]['id'];

export const LIMITS = { nameMin: 1, nameMax: 20 } as const;

export const TIMING = {
  graceMs: 2000,
  roomIdleMs: 2 * 60 * 60 * 1000,
  roomEmptyMs: 30 * 60 * 1000,
  sweepMs: 5 * 60 * 1000,
} as const;

export const QUESTION_OPTIONS = [10, 15, 20] as const;
export const TIME_OPTIONS = [15, 20, 30] as const;
/** Clue questions get extra time so every clue gets a moment on screen. */
export const CLUE_TIME_BONUS_SEC = 15;
/** How many questions at the end form the "SGP Special" double-points finale. */
export const FINALE_SIZE = 3;

export const POINTS = {
  /** Correct answer on a normal question: base + up to `speed` for answering fast. */
  base: 100,
  speed: 100,
  /** Clue questions: points by how many clues were showing when you answered. */
  clue: [300, 200, 100],
  finaleMultiplier: 2,
} as const;

/** Liên Quân ranks, by share of questions answered correctly. */
export const RANKS = [
  { min: 0, emoji: '🥉', name: { vi: 'Đồng', en: 'Bronze' } },
  { min: 0.2, emoji: '🥈', name: { vi: 'Bạc', en: 'Silver' } },
  { min: 0.35, emoji: '🥇', name: { vi: 'Vàng', en: 'Gold' } },
  { min: 0.5, emoji: '💠', name: { vi: 'Bạch Kim', en: 'Platinum' } },
  { min: 0.62, emoji: '💎', name: { vi: 'Kim Cương', en: 'Diamond' } },
  { min: 0.75, emoji: '🔱', name: { vi: 'Tinh Anh', en: 'Veteran' } },
  { min: 0.85, emoji: '🌟', name: { vi: 'Cao Thủ', en: 'Master' } },
  { min: 0.95, emoji: '👑', name: { vi: 'Thách Đấu', en: 'Conqueror' } },
] as const;

/** Streak banners, caster style. Index = streak length. */
export const STREAKS: Record<number, string> = {
  2: 'DOUBLE KILL',
  3: 'TRIPLE KILL',
  4: 'QUADRA KILL',
  5: 'PENTA KILL',
};

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
