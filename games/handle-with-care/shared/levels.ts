// Five houses, 32 × 18 tiles each, built from specs like Two-Body's levels.
// '#' solid, '-' one-way, 'T' the moving truck (put things down here), 'S' start.

export const LW = 32;
export const LH = 18;

export const ITEMS = {
  vase: { name: 'Vase', w: 0.7, h: 0.9, value: 300, fragile: 2.2, big: false },
  lamp: { name: 'Lamp', w: 0.6, h: 1.2, value: 150, fragile: 1, big: false },
  painting: { name: 'Painting', w: 1.0, h: 0.8, value: 400, fragile: 1.2, big: false },
  plant: { name: 'Plant', w: 0.8, h: 1.0, value: 80, fragile: 0.5, big: false },
  statue: { name: 'Gold cat', w: 0.7, h: 0.8, value: 500, fragile: 0.3, big: false },
  plates: { name: 'Box of plates', w: 1.0, h: 0.7, value: 250, fragile: 3, big: false },
  tv: { name: 'TV', w: 2.0, h: 1.2, value: 900, fragile: 1.5, big: true },
  fishtank: { name: 'Fish tank', w: 2.0, h: 1.2, value: 1200, fragile: 2.5, big: true },
  piano: { name: 'Piano', w: 2.6, h: 1.6, value: 1500, fragile: 0.8, big: true },
  sofa: { name: 'Sofa', w: 3.0, h: 1.1, value: 700, fragile: 0.3, big: true },
} as const;
export type ItemKind = keyof typeof ITEMS;

type Spec = [row: number, from: number, to: number, ch: string];
interface Mover {
  from: [number, number];
  to: [number, number];
  w: number;
  periodS: number;
}

export interface House {
  name: string;
  hint: string;
  rows: string[];
  movers: Mover[];
  /** Item kinds and where they start (tile x, floor row they rest on). */
  items: [ItemKind, number, number][];
  timeS: number;
}

function build(specs: Spec[], marks: [string, number, number][]): string[] {
  const rows = Array.from({ length: LH }, (_, y) => Array.from({ length: LW }, (_, x): string => (x === 0 || x === LW - 1 || y === 0 ? '#' : ' ')));
  for (const [row, from, to, ch] of specs) for (let x = from; x <= to; x++) rows[row]![x] = ch;
  for (const [ch, x, y] of marks) rows[y]![x] = ch;
  return rows.map((r) => r.join(''));
}

const col = (x: number, top: number, bottom: number, ch: string): Spec[] => Array.from({ length: bottom - top + 1 }, (_, i) => [top + i, x, x, ch]);

export const HOUSES: House[] = [
  {
    name: 'The studio',
    hint: 'Small things: grab (E) and carry, or throw (F). Big things need both of you holding on.',
    rows: build(
      [[17, 1, 30, '#'], [16, 1, 30, '#'], [15, 1, 2, '#'], [12, 3, 9, '-'], ...col(24, 1, 11, '#'), ...col(25, 1, 11, '#'), [15, 26, 30, 'T']],
      [['S', 5, 15]],
    ),
    movers: [],
    items: [
      ['vase', 5, 12],
      ['painting', 8, 12],
      ['lamp', 11, 16],
      ['plant', 12, 16],
      ['sofa', 14, 16],
      ['tv', 19, 16],
    ],
    timeS: 150,
  },
  {
    name: 'The family house',
    hint: 'Small stuff is upstairs. The piano and fish tank are not going up those stairs, so carry them along the ground.',
    rows: build(
      [
        [17, 1, 30, '#'],
        [16, 1, 30, '#'],
        [9, 8, 23, '-'],
        [15, 3, 4, '#'],
        [14, 3, 3, '#'],
        [12, 5, 7, '-'],
        ...col(24, 1, 11, '#'),
        ...col(25, 1, 11, '#'),
        [15, 26, 30, 'T'],
      ],
      [['S', 6, 15]],
    ),
    movers: [],
    items: [
      ['statue', 10, 9],
      ['vase', 14, 9],
      ['plates', 18, 9],
      ['painting', 21, 9],
      ['piano', 8, 16],
      ['fishtank', 14, 16],
    ],
    timeS: 150,
  },
  {
    name: 'The mansion',
    hint: 'The sofa and the TV are upstairs. Ride the freight lift down together, carefully.',
    rows: build(
      [
        [17, 1, 30, '#'],
        [16, 1, 30, '#'],
        [9, 6, 22, '#'],
        ...col(24, 1, 11, '#'),
        ...col(25, 1, 11, '#'),
        [15, 26, 30, 'T'],
      ],
      [['S', 10, 15]],
    ),
    movers: [{ from: [1, 9], to: [1, 15], w: 5, periodS: 8 }],
    items: [
      ['sofa', 9, 9],
      ['tv', 15, 9],
      ['vase', 19, 9],
      ['lamp', 21, 9],
      ['plates', 12, 16],
      ['statue', 16, 16],
      ['fishtank', 18, 16],
    ],
    timeS: 180,
  },
  {
    name: 'The apartment',
    hint: 'Three floors of balconies. Jump up through them, then carry or throw things down. Gently.',
    rows: build(
      [[17, 1, 30, '#'], [16, 1, 30, '#'], [13, 6, 22, '-'], [10, 3, 19, '-'], [7, 6, 22, '-'], ...col(24, 1, 11, '#'), ...col(25, 1, 11, '#'), [15, 26, 30, 'T']],
      [['S', 3, 15]],
    ),
    movers: [],
    items: [
      ['plates', 8, 7],
      ['statue', 18, 7],
      ['lamp', 5, 10],
      ['painting', 14, 10],
      ['vase', 12, 13],
      ['plant', 20, 13],
      ['tv', 9, 16],
      ['fishtank', 15, 16],
    ],
    timeS: 180,
  },
  {
    name: 'The art gallery',
    hint: 'Paintings, statues and a grand piano. Everything here is worth a lot, so no throwing!',
    rows: build(
      [[17, 1, 30, '#'], [16, 1, 30, '#'], [12, 3, 10, '-'], [12, 14, 21, '-'], [8, 7, 17, '-'], ...col(24, 1, 11, '#'), ...col(25, 1, 11, '#'), [15, 26, 30, 'T']],
      [['S', 2, 15]],
    ),
    movers: [],
    items: [
      ['painting', 4, 12],
      ['painting', 9, 12],
      ['statue', 15, 12],
      ['painting', 20, 12],
      ['vase', 10, 8],
      ['statue', 14, 8],
      ['piano', 11, 16],
    ],
    timeS: 170,
  },
];

export function moverAt(house: House, i: number, t: number) {
  const m = house.movers[i]!;
  const phase = (t / m.periodS) % 1;
  // Pause at each end for a quarter of the cycle so you can get on and off.
  const k = phase < 0.25 ? 0 : phase < 0.5 ? (phase - 0.25) * 4 : phase < 0.75 ? 1 : 1 - (phase - 0.75) * 4;
  return { x: m.from[0] + (m.to[0] - m.from[0]) * k, y: m.from[1] + (m.to[1] - m.from[1]) * k, w: m.w };
}

export function find(house: House, ch: string): [number, number] | null {
  for (let y = 0; y < LH; y++) {
    const x = house.rows[y]!.indexOf(ch);
    if (x >= 0) return [x, y];
  }
  return null;
}

/** The truck: put things down inside these tiles. */
export const inTruck = (house: House, x: number, y: number) => house.rows[Math.floor(y)]?.[Math.floor(x)] === 'T';
