export type Lang = 'vi' | 'en';
export type Text = Record<Lang, string>;

/** The world is 1600×1000 units; clients scale it to fit the window. */
export const WORLD = { w: 1600, h: 1000 } as const;

export type Reaction = 'shatter' | 'feathers' | 'leaves' | 'quack' | 'spark' | 'thud';

export interface PropTypeDef {
  label: Text;
  /** Footprint in world units (before rotation and scale). */
  w: number;
  h: number;
  /** Can a hider turn into this? */
  hideable: boolean;
  reaction: Reaction;
}

export const PROP_TYPES = {
  // living room
  sofa: { label: { vi: 'Ghế sofa', en: 'Sofa' }, w: 300, h: 120, hideable: false, reaction: 'thud' },
  tv: { label: { vi: 'Tivi', en: 'TV' }, w: 220, h: 40, hideable: false, reaction: 'spark' },
  coffeeTable: { label: { vi: 'Bàn trà', en: 'Coffee table' }, w: 200, h: 110, hideable: false, reaction: 'thud' },
  plant: { label: { vi: 'Chậu cây', en: 'Plant' }, w: 70, h: 70, hideable: true, reaction: 'leaves' },
  lamp: { label: { vi: 'Đèn', en: 'Lamp' }, w: 60, h: 60, hideable: true, reaction: 'shatter' },
  cushion: { label: { vi: 'Gối', en: 'Cushion' }, w: 60, h: 60, hideable: true, reaction: 'feathers' },
  vase: { label: { vi: 'Bình hoa', en: 'Vase' }, w: 44, h: 44, hideable: true, reaction: 'shatter' },
  books: { label: { vi: 'Chồng sách', en: 'Books' }, w: 66, h: 48, hideable: true, reaction: 'thud' },
  mug: { label: { vi: 'Cốc', en: 'Mug' }, w: 34, h: 34, hideable: true, reaction: 'shatter' },
  chair: { label: { vi: 'Ghế', en: 'Chair' }, w: 80, h: 80, hideable: true, reaction: 'thud' },
  // kitchen
  counter: { label: { vi: 'Kệ bếp', en: 'Counter' }, w: 360, h: 90, hideable: false, reaction: 'thud' },
  fridge: { label: { vi: 'Tủ lạnh', en: 'Fridge' }, w: 120, h: 110, hideable: false, reaction: 'spark' },
  diningTable: { label: { vi: 'Bàn ăn', en: 'Dining table' }, w: 260, h: 160, hideable: false, reaction: 'thud' },
  pot: { label: { vi: 'Nồi', en: 'Pot' }, w: 64, h: 54, hideable: true, reaction: 'thud' },
  toaster: { label: { vi: 'Máy nướng bánh', en: 'Toaster' }, w: 62, h: 46, hideable: true, reaction: 'spark' },
  bottle: { label: { vi: 'Chai', en: 'Bottle' }, w: 30, h: 30, hideable: true, reaction: 'shatter' },
  stool: { label: { vi: 'Ghế đẩu', en: 'Stool' }, w: 56, h: 56, hideable: true, reaction: 'thud' },
  fruitBowl: { label: { vi: 'Đĩa trái cây', en: 'Fruit bowl' }, w: 70, h: 70, hideable: true, reaction: 'thud' },
  // park
  tree: { label: { vi: 'Cây to', en: 'Tree' }, w: 180, h: 180, hideable: false, reaction: 'leaves' },
  bench: { label: { vi: 'Ghế đá', en: 'Bench' }, w: 170, h: 60, hideable: false, reaction: 'thud' },
  bush: { label: { vi: 'Bụi cây', en: 'Bush' }, w: 90, h: 80, hideable: true, reaction: 'leaves' },
  rock: { label: { vi: 'Hòn đá', en: 'Rock' }, w: 70, h: 54, hideable: true, reaction: 'thud' },
  flower: { label: { vi: 'Hoa', en: 'Flower' }, w: 44, h: 44, hideable: true, reaction: 'leaves' },
  duck: { label: { vi: 'Vịt', en: 'Duck' }, w: 56, h: 44, hideable: true, reaction: 'quack' },
  mushroom: { label: { vi: 'Nấm', en: 'Mushroom' }, w: 44, h: 44, hideable: true, reaction: 'thud' },
  bin: { label: { vi: 'Thùng rác', en: 'Bin' }, w: 54, h: 54, hideable: true, reaction: 'thud' },
  lampPost: { label: { vi: 'Cột đèn', en: 'Lamp post' }, w: 50, h: 50, hideable: true, reaction: 'spark' },
} as const satisfies Record<string, PropTypeDef>;

export type PropType = keyof typeof PROP_TYPES;
export const isPropType = (t: string): t is PropType => t in PROP_TYPES;

export const MAPS = {
  living: { name: { vi: 'Phòng khách', en: 'Living room' }, emoji: '🛋️' },
  kitchen: { name: { vi: 'Nhà bếp', en: 'Kitchen' }, emoji: '🍳' },
  park: { name: { vi: 'Công viên', en: 'Park' }, emoji: '🌳' },
} as const;
export type MapId = keyof typeof MAPS;
export const MAP_IDS = Object.keys(MAPS) as MapId[];

export const LIMITS = { nameMin: 1, nameMax: 20 } as const;

export const TIMING = {
  graceMs: 2000,
  tauntEveryMs: 15_000,
  tauntLengthMs: 1200,
  roomIdleMs: 2 * 60 * 60 * 1000,
  roomEmptyMs: 30 * 60 * 1000,
  sweepMs: 5 * 60 * 1000,
} as const;

export const ROUND_OPTIONS = [2, 4, 6] as const;
export const HIDE_OPTIONS = [30, 45, 60] as const;
export const SEEK_OPTIONS = [45, 60, 90] as const;
export const SHOT_OPTIONS = [3, 5, 7] as const;
export const SNEAK_OPTIONS = [0, 2, 3] as const;
export const MAP_OPTIONS = ['random', ...MAP_IDS] as const;

export const ROTATE_STEP = 15;
export const SCALE_RANGE = { min: 0.9, max: 1.1, step: 0.05 } as const;

export const POINTS = {
  found: 100,
  perUnusedShot: 20,
  survived: 150,
  perMiss: 10,
} as const;

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
