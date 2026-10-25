// Ten one-screen levels, 32 × 18 tiles, built from specs like Tethered's tower.
// '#' solid, '-' one-way, '^' spikes, 'D' door (opens with the key), 'H' gate (opens for a
// few seconds after the button), and markers: 'S' start, 'K' key, 'B' button, '~' swap pad
// (walker and jumper trade jobs), 'G' goal.

export const LW = 32;
export const LH = 18;

type Spec = [row: number, from: number, to: number, ch: string];
interface Mover {
  from: [number, number];
  to: [number, number];
  w: number;
  periodS: number;
}

export type Theme = 'grass' | 'snow' | 'sand' | 'purple' | 'stone';

export interface Level {
  name: string;
  hint: string;
  /** The look: Kenney terrain and background (defaults by level number). */
  theme?: Theme;
  rows: string[];
  movers: Mover[];
}

function build(specs: Spec[], marks: [string, number, number][]): string[] {
  const rows = Array.from({ length: LH }, (_, y) =>
    Array.from({ length: LW }, (_, x): string => (x === 0 || x === LW - 1 || y === 0 ? '#' : ' ')),
  );
  for (const [row, from, to, ch] of specs) for (let x = from; x <= to; x++) rows[row]![x] = ch;
  for (const [ch, x, y] of marks) rows[y]![x] = ch;
  return rows.map((r) => r.join(''));
}

/** A column of `ch` from row `top` to row `bottom`. */
const col = (x: number, top: number, bottom: number, ch: string): Spec[] => Array.from({ length: bottom - top + 1 }, (_, i) => [top + i, x, x, ch]);

export const LEVELS: Level[] = [
  {
    name: 'First steps',
    hint: 'One of you walks, the other jumps. Hop the spikes and climb the step.',
    rows: build(
      [[17, 1, 30, '#'], [16, 1, 10, '#'], [16, 11, 13, '^'], [16, 14, 30, '#'], [15, 20, 30, '#'], [14, 20, 30, '#']],
      [['S', 2, 15], ['G', 28, 13]],
    ),
    movers: [],
  },
  {
    name: 'Get the key',
    hint: 'The door needs the 🔑. It is up high.',
    rows: build(
      [[17, 1, 30, '#'], [16, 1, 30, '#'], [13, 6, 10, '-'], [10, 12, 16, '-'], ...col(22, 1, 11, '#'), ...col(22, 12, 15, 'D')],
      [['S', 2, 15], ['K', 14, 9], ['G', 27, 15]],
    ),
    movers: [],
  },
  {
    name: 'Swap!',
    hint: 'Step on the ⇄ pad and you trade jobs. Surprise.',
    rows: build(
      [[17, 1, 30, '#'], [16, 1, 8, '#'], [16, 9, 12, '^'], [16, 13, 30, '#'], [13, 20, 22, '#'], [10, 24, 26, '#'], [7, 27, 30, '#']],
      [['S', 2, 15], ['~', 16, 15], ['G', 29, 6]],
    ),
    movers: [],
  },
  {
    name: 'Hold the gate',
    hint: 'The button opens the gate for 5 seconds. Run!',
    rows: build(
      [[17, 1, 30, '#'], [16, 1, 30, '#'], [16, 10, 12, '^'], ...col(20, 1, 10, '#'), ...col(20, 11, 15, 'H')],
      [['S', 2, 15], ['B', 5, 15], ['G', 28, 15]],
    ),
    movers: [],
  },
  {
    name: 'All aboard',
    hint: 'Ride the platform over the spikes. Jump on, jump off.',
    rows: build(
      [[17, 1, 30, '#'], [16, 1, 6, '#'], [16, 7, 24, '^'], [16, 25, 30, '#']],
      [['S', 2, 15], ['G', 28, 15]],
    ),
    movers: [{ from: [7, 13], to: [21, 13], w: 3, periodS: 6 }],
  },
  {
    name: 'The two-body problem',
    hint: 'Lift, key, swap, button, gate, door. Talk to each other!',
    rows: build(
      [
        [17, 1, 30, '#'],
        [16, 1, 11, '#'],
        [16, 12, 14, '^'],
        [16, 15, 30, '#'],
        [7, 5, 12, '#'],
        [10, 15, 19, '-'],
        ...col(24, 1, 10, '#'),
        ...col(24, 11, 15, 'H'),
        ...col(27, 1, 12, '#'),
        ...col(27, 13, 15, 'D'),
      ],
      [['S', 8, 15], ['~', 8, 6], ['K', 11, 6], ['B', 17, 9], ['G', 29, 15]],
    ),
    movers: [{ from: [2, 15], to: [2, 7], w: 3, periodS: 6 }],
  },
  {
    name: 'Stairway',
    hint: 'The floor is all spikes now. Climb the steps, one jump each.',
    theme: 'snow',
    rows: build(
      [[17, 1, 30, '#'], [16, 1, 5, '#'], [16, 6, 30, '^'], [13, 7, 10, '#'], [10, 12, 15, '#'], [7, 17, 20, '#'], [4, 22, 30, '#']],
      [['S', 2, 15], ['G', 28, 3]],
    ),
    movers: [],
  },
  {
    name: 'Locked in',
    hint: 'The 🔑 is up the ledges, the door is past the pit.',
    theme: 'purple',
    rows: build(
      [[17, 1, 30, '#'], [16, 1, 18, '#'], [16, 19, 21, '^'], [16, 22, 30, '#'], [13, 4, 7, '-'], [10, 9, 12, '-'], ...col(23, 1, 11, '#'), ...col(23, 12, 15, 'D')],
      [['S', 2, 15], ['K', 11, 9], ['G', 28, 15]],
    ),
    movers: [],
  },
  {
    name: 'Sprint',
    hint: 'Hit the button up top, then drop and run. Five seconds!',
    theme: 'sand',
    rows: build(
      [[17, 1, 30, '#'], [16, 1, 22, '#'], [16, 23, 25, '^'], [16, 26, 30, '#'], [13, 5, 8, '#'], [10, 10, 14, '-'], ...col(20, 1, 10, '#'), ...col(20, 11, 15, 'H')],
      [['S', 2, 15], ['B', 13, 9], ['G', 29, 15]],
    ),
    movers: [],
  },
  {
    name: 'The ferry',
    hint: 'Swap jobs on the ⇄ pad, then ride the raft over the spikes and climb off.',
    theme: 'stone',
    rows: build(
      [[17, 1, 30, '#'], [16, 1, 6, '#'], [16, 7, 24, '^'], [16, 25, 30, '#'], [13, 28, 30, '#']],
      [['S', 2, 15], ['~', 4, 15], ['G', 29, 12]],
    ),
    movers: [{ from: [7, 13], to: [21, 13], w: 3, periodS: 6 }],
  },
];

export const GATE_OPEN_S = 5;

const DEFAULT_THEMES: Theme[] = ['grass', 'stone', 'sand', 'purple', 'grass', 'stone'];
export const levelTheme = (i: number): Theme => LEVELS[i]?.theme ?? DEFAULT_THEMES[i % DEFAULT_THEMES.length]!;

export function moverAt(level: Level, i: number, t: number) {
  const m = level.movers[i]!;
  const phase = (t / m.periodS) % 1;
  const k = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  return { x: m.from[0] + (m.to[0] - m.from[0]) * k, y: m.from[1] + (m.to[1] - m.from[1]) * k, w: m.w };
}

export function find(level: Level, ch: string): [number, number] | null {
  for (let y = 0; y < LH; y++) {
    const x = level.rows[y]!.indexOf(ch);
    if (x >= 0) return [x, y];
  }
  return null;
}
