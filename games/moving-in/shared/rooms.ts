// The six rooms of the story, the item kinds, and where everything belongs.
// World units: 1600 × 900, front view (a dollhouse cut-away). The floor starts at y = 760.
// A slot is where one item belongs: its anchor (x, y) is the item's bottom-centre.

export const W = 1600;
export const H = 900;
export const FLOOR = 760;
/** Drop an item this close to a free slot and it snaps in. */
export const SNAP = 70;
export const HINTS_PER_ROOM = 3;
export const HINT_MS = 4000;

export const KINDS = {
  pillow: { name: 'Pillow', w: 110, h: 45 },
  phone: { name: 'Phone', w: 26, h: 46 },
  lamp: { name: 'Lamp', w: 50, h: 80 },
  controller: { name: 'Game controller', w: 60, h: 32 },
  book: { name: 'Book', w: 34, h: 50 },
  frame: { name: 'Photo frame', w: 56, h: 64 },
  plush: { name: 'Plushie', w: 64, h: 70 },
  camera: { name: 'Camera', w: 60, h: 42 },
  sunglasses: { name: 'Sunglasses', w: 64, h: 24 },
  charger: { name: 'Charger', w: 34, h: 30 },
  shoes: { name: 'Shoes', w: 80, h: 30 },
  passport: { name: 'Passport', w: 34, h: 46 },
  backpack: { name: 'Backpack', w: 80, h: 100 },
  hat: { name: 'Hat', w: 80, h: 44 },
  perfume: { name: 'Perfume', w: 30, h: 54 },
  scarf: { name: 'Scarf', w: 40, h: 90 },
  monitor: { name: 'Monitor', w: 150, h: 110 },
  keyboard: { name: 'Keyboard', w: 130, h: 24 },
  headphones: { name: 'Headphones', w: 60, h: 56 },
  clock: { name: 'Clock', w: 56, h: 56 },
  plant: { name: 'Plant', w: 56, h: 80 },
  mug: { name: 'Mug', w: 40, h: 42 },
  noodles: { name: 'Instant noodles', w: 46, h: 56 },
  pan: { name: 'Frying pan', w: 100, h: 30 },
  kettle: { name: 'Kettle', w: 64, h: 66 },
  board: { name: 'Cutting board', w: 90, h: 20 },
  teapot: { name: 'Teapot', w: 70, h: 60 },
  cookies: { name: 'Cookie jar', w: 50, h: 60 },
  fruit: { name: 'Fruit bowl', w: 80, h: 44 },
  cupcake: { name: 'Cupcake', w: 40, h: 44 },
  toothbrush: { name: 'Toothbrush', w: 14, h: 60 },
  towel: { name: 'Towel', w: 70, h: 100 },
  shampoo: { name: 'Shampoo', w: 34, h: 64 },
  slippers: { name: 'Slippers', w: 80, h: 24 },
  duck: { name: 'Rubber duck', w: 50, h: 44 },
  soap: { name: 'Soap', w: 40, h: 22 },
  lotion: { name: 'Lotion', w: 32, h: 60 },
  hairdryer: { name: 'Hair dryer', w: 70, h: 60 },
  console: { name: 'Game console', w: 110, h: 30 },
  posterLq: { name: 'Liên Quân poster', w: 140, h: 190 },
  posterSgp: { name: 'SGP poster', w: 140, h: 190 },
  cushion: { name: 'Cushion', w: 80, h: 70 },
  candle: { name: 'Candle', w: 34, h: 50 },
} as const;
export type Kind = keyof typeof KINDS;

/** Items are drawn at their KINDS size and shown this much bigger. */
export const ITEM_SCALE = 1.4;
/** An item's size in the room. */
export const sizeOf = (kind: Kind) => ({ w: KINDS[kind].w * ITEM_SCALE, h: KINDS[kind].h * ITEM_SCALE });

export type FurnitureType =
  | 'window'
  | 'bed'
  | 'nightstand'
  | 'shelf'
  | 'divider'
  | 'door'
  | 'hooks'
  | 'chair'
  | 'desk'
  | 'counter'
  | 'stove'
  | 'fridge'
  | 'table'
  | 'sink'
  | 'mirror'
  | 'bathtub'
  | 'rail'
  | 'sofa'
  | 'tvstand'
  | 'tv'
  | 'rug'
  // Decoration only.
  | 'curtains'
  | 'garland'
  | 'wallart'
  | 'floorlamp'
  | 'bigplant'
  | 'suitcase'
  | 'tiles'
  | 'pendant';

export interface Furniture {
  t: FurnitureType;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SlotDef {
  x: number;
  y: number;
  kind: Kind;
  /** Only this player's item counts here (room 1: your room vs. theirs). */
  owner?: 0 | 1;
}

export interface RoomDef {
  name: string;
  caption: string;
  wall: string;
  floor: string;
  /** Wallpaper pattern drawn over the wall color. */
  pattern?: 'dots' | 'stripes' | 'tiles' | 'hearts';
  furniture: Furniture[];
  slots: SlotDef[];
  /** Box contents, in unpacking order, per player seat. */
  boxes: [Kind[], Kind[]];
}

const f = (t: FurnitureType, x: number, y: number, w: number, h: number): Furniture => ({ t, x, y, w, h });
const s = (kind: Kind, x: number, y: number, owner?: 0 | 1): SlotDef => ({ kind, x, y, ...(owner === undefined ? {} : { owner }) });

export const ROOMS: RoomDef[] = [
  {
    name: 'Two rooms, one call',
    caption: 'Far apart, but the phones are always on.',
    wall: '#cfe3f0',
    floor: '#b98a5a',
    pattern: 'dots',
    furniture: [
      f('wallart', 120, 170, 160, 120),
      f('garland', 70, 470, 310, 0),
      f('floorlamp', 690, 560, 60, 200),
      f('window', 420, 120, 220, 180),
      f('curtains', 420, 120, 220, 180),
      f('bed', 60, 600, 330, 160),
      f('nightstand', 410, 640, 120, 120),
      f('shelf', 560, 380, 200, 16),
      f('shelf', 560, 520, 200, 16),
      f('divider', 780, 0, 40, 900),
      f('window', 960, 120, 220, 180),
      f('curtains', 960, 120, 220, 180),
      f('wallart', 1320, 170, 160, 120),
      f('garland', 1220, 470, 310, 0),
      f('bigplant', 840, 560, 100, 200),
      f('bed', 1210, 600, 330, 160),
      f('nightstand', 1070, 640, 120, 120),
      f('shelf', 840, 380, 200, 16),
      f('shelf', 840, 520, 200, 16),
    ],
    slots: [
      s('pillow', 140, 600, 0),
      s('phone', 433, 640, 0),
      s('lamp', 492, 640, 0),
      s('controller', 600, 380, 0),
      s('book', 700, 380, 0),
      s('frame', 650, 520, 0),
      s('pillow', 1460, 600, 1),
      s('plush', 1300, 600, 1),
      s('phone', 1167, 640, 1),
      s('lamp', 1108, 640, 1),
      s('book', 900, 380, 1),
      s('frame', 950, 520, 1),
    ],
    boxes: [
      ['pillow', 'phone', 'lamp', 'controller', 'book', 'frame'],
      ['pillow', 'phone', 'lamp', 'plush', 'book', 'frame'],
    ],
  },
  {
    name: 'The visit',
    caption: 'Finally in the same room. Two suitcases, one tiny hotel.',
    wall: '#f3dcc9',
    floor: '#8a6a4a',
    pattern: 'stripes',
    furniture: [
      f('wallart', 960, 150, 160, 110),
      f('door', 30, 320, 150, 440),
      f('hooks', 200, 300, 150, 14),
      f('chair', 250, 640, 120, 120),
      f('nightstand', 405, 640, 100, 120),
      f('bed', 520, 600, 560, 160),
      f('window', 680, 110, 240, 170),
      f('curtains', 680, 110, 240, 170),
      f('nightstand', 1095, 640, 100, 120),
      f('desk', 1230, 600, 300, 160),
      f('suitcase', 1280, 670, 140, 90),
      f('shelf', 1260, 400, 220, 16),
    ],
    slots: [
      s('shoes', 72, 760),
      s('shoes', 190, 760),
      s('hat', 230, 340),
      s('scarf', 318, 410),
      s('backpack', 310, 640),
      s('charger', 455, 640),
      s('plush', 800, 600),
      s('sunglasses', 1145, 640),
      s('passport', 1270, 600),
      s('passport', 1320, 600),
      s('camera', 1450, 600),
      s('perfume', 1300, 400),
    ],
    boxes: [
      ['camera', 'sunglasses', 'charger', 'shoes', 'passport', 'backpack'],
      ['hat', 'perfume', 'plush', 'shoes', 'passport', 'scarf'],
    ],
  },
  {
    name: 'Our first bedroom',
    caption: 'One bed, two pillows, and a lot of negotiating.',
    wall: '#e4d7f5',
    floor: '#a87b52',
    pattern: 'hearts',
    furniture: [
      f('desk', 50, 560, 410, 200),
      f('shelf', 80, 330, 300, 16),
      f('window', 600, 110, 400, 190),
      f('curtains', 600, 110, 400, 190),
      f('garland', 570, 420, 460, 0),
      f('bed', 560, 600, 480, 160),
      f('wallart', 1070, 330, 100, 130),
      f('bigplant', 1195, 560, 100, 200),
      f('nightstand', 1060, 640, 110, 120),
      f('shelf', 1220, 420, 300, 16),
      f('rug', 520, 780, 560, 60),
    ],
    slots: [
      s('monitor', 150, 560),
      s('keyboard', 350, 560),
      s('headphones', 130, 330),
      s('controller', 220, 330),
      s('clock', 320, 330),
      s('pillow', 680, 600),
      s('pillow', 920, 600),
      s('plush', 800, 600),
      s('lamp', 1115, 640),
      s('book', 1270, 420),
      s('plush', 1400, 420),
      s('plant', 1500, 760),
    ],
    boxes: [
      ['monitor', 'keyboard', 'headphones', 'controller', 'clock', 'pillow'],
      ['plush', 'plush', 'plant', 'lamp', 'book', 'pillow'],
    ],
  },
  {
    name: 'Our kitchen',
    caption: 'Two mugs. A worrying amount of instant noodles.',
    wall: '#d8f0dc',
    floor: '#c9b89a',
    pattern: 'stripes',
    furniture: [
      f('tiles', 60, 370, 860, 190),
      f('shelf', 80, 330, 560, 16),
      f('counter', 60, 560, 620, 200),
      f('stove', 700, 560, 220, 200),
      f('fridge', 960, 220, 200, 540),
      f('window', 1240, 120, 260, 180),
      f('curtains', 1240, 120, 260, 180),
      f('pendant', 1380, 0, 60, 400),
      f('table', 1220, 600, 320, 160),
    ],
    slots: [
      s('mug', 140, 330),
      s('mug', 210, 330),
      s('noodles', 320, 330),
      s('noodles', 390, 330),
      s('teapot', 530, 330),
      s('kettle', 130, 560),
      s('board', 300, 560),
      s('cookies', 560, 560),
      s('pan', 810, 560),
      s('fruit', 1300, 600),
      s('cupcake', 1420, 600),
      s('plant', 1490, 600),
    ],
    boxes: [
      ['mug', 'noodles', 'noodles', 'pan', 'kettle', 'board'],
      ['mug', 'teapot', 'cookies', 'fruit', 'plant', 'cupcake'],
    ],
  },
  {
    name: 'Our bathroom',
    caption: 'Two toothbrushes, one cup. That is commitment.',
    wall: '#d4eef7',
    floor: '#e8e8ee',
    pattern: 'tiles',
    furniture: [
      f('wallart', 1010, 220, 170, 120),
      f('rug', 950, 785, 380, 50),
      f('rail', 120, 380, 260, 14),
      f('mirror', 560, 230, 220, 260),
      f('shelf', 540, 520, 260, 14),
      f('sink', 520, 600, 300, 160),
      f('bathtub', 900, 600, 520, 160),
      f('shelf', 1430, 400, 150, 16),
    ],
    slots: [
      s('towel', 180, 500),
      s('towel', 300, 500),
      s('slippers', 200, 760),
      s('slippers', 320, 760),
      s('toothbrush', 600, 520),
      s('toothbrush', 640, 520),
      s('lotion', 760, 520),
      s('soap', 720, 600),
      s('duck', 1050, 600),
      s('shampoo', 1350, 600),
      s('hairdryer', 1505, 400),
      s('plant', 1490, 760),
    ],
    boxes: [
      ['toothbrush', 'towel', 'shampoo', 'slippers', 'duck', 'soap'],
      ['toothbrush', 'towel', 'lotion', 'slippers', 'hairdryer', 'plant'],
    ],
  },
  {
    name: 'Our living room',
    caption: 'Home. Every room so far, hanging on the wall.',
    wall: '#f6e7c8',
    floor: '#9b6f47',
    pattern: 'stripes',
    furniture: [
      f('rug', 480, 790, 640, 70),
      f('garland', 560, 300, 480, 0),
      f('bigplant', 10, 560, 90, 200),
      f('floorlamp', 1100, 450, 60, 310),
      f('sofa', 520, 560, 560, 200),
      f('tv', 1220, 330, 260, 160),
      f('tvstand', 1180, 640, 340, 120),
    ],
    slots: [
      s('posterLq', 190, 520),
      s('posterSgp', 400, 520),
      s('frame', 600, 440),
      s('frame', 700, 440),
      s('frame', 900, 440),
      s('frame', 1000, 440),
      s('cushion', 640, 620),
      s('plush', 800, 620),
      s('cushion', 960, 620),
      s('console', 1260, 640),
      s('controller', 1400, 640),
      s('candle', 1490, 640),
    ],
    boxes: [
      ['console', 'controller', 'posterLq', 'frame', 'frame', 'cushion'],
      ['plush', 'candle', 'posterSgp', 'frame', 'frame', 'cushion'],
    ],
  },
];

/** Where each player's box sits on the floor (centre of its top edge). */
export const BOX_AT: [[number, number], [number, number]] = [
  [130, 800],
  [1470, 800],
];
