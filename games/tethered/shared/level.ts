// The tower. Built from platform specs (row, from-col, to-col, kind) so it's easy to tune.
// '#' solid, '-' one-way (jump up through it), 'x' crumbles when stood on, '^' spikes.
// Each step up is 3 rows (the jump reaches ~3.6). A solid platform is never right above
// another one, so nobody bonks their head on the way up.

import type { Platform } from './physics';

export const LW = 24;
export const LH = 72;

type Kind = '#' | '-' | 'x' | '^';
const SPECS: [row: number, from: number, to: number, kind: Kind][] = [
  // Section 1: the basics.
  [71, 1, 22, '#'],
  [68, 5, 9, '-'],
  [65, 10, 14, '-'],
  [62, 15, 19, '#'],
  [59, 10, 14, '-'],
  [56, 4, 8, 'x'],
  [53, 9, 13, '-'],
  [50, 14, 21, '#'], // checkpoint 1
  // Section 2: moving platforms.
  [47, 10, 13, '-'],
  [41, 2, 5, '-'],
  [38, 6, 9, '-'],
  [29, 14, 17, '-'],
  [26, 18, 22, '#'], // checkpoint 2
  // Section 3: crumbles and spikes.
  [23, 13, 16, 'x'],
  [20, 8, 11, 'x'],
  [17, 3, 6, '-'],
  [14, 7, 12, '#'],
  [13, 11, 12, '^'],
  [11, 12, 15, '-'],
  [8, 16, 21, '#'], // checkpoint 3
  [5, 11, 14, '-'],
  [2, 4, 9, '#'], // the summit
  [0, 0, 23, '#'],
];

function build(): string[] {
  const rows = Array.from({ length: LH }, () => Array.from({ length: LW }, (_, x): string => (x === 0 || x === LW - 1 ? '#' : ' ')));
  for (const [row, from, to, kind] of SPECS) for (let x = from; x <= to; x++) rows[row]![x] = kind;
  return rows.map((r) => r.join(''));
}

export const LEVEL = build();

export const tile = (tx: number, ty: number): string => (tx < 0 || tx >= LW ? '#' : ty < 0 ? '#' : ty >= LH ? ' ' : LEVEL[ty]![tx]!);

/** Where you (re)spawn: the start and three checkpoints. Positions are body top-left. */
export const CHECKPOINTS: { x: number; y: number; flagX: number; flagY: number; name: string }[] = [
  { x: 3, y: 70 - 0.9 + 1, flagX: 2, flagY: 70, name: 'Base camp' },
  { x: 17, y: 49 - 0.9 + 1, flagX: 20, flagY: 49, name: 'Camp 1' },
  { x: 19, y: 25 - 0.9 + 1, flagX: 21, flagY: 25, name: 'Camp 2' },
  { x: 17, y: 7 - 0.9 + 1, flagX: 20, flagY: 7, name: 'Camp 3' },
];

/** Touch this tile to win. */
export const SUMMIT = { x: 6, y: 1 } as const;

/** Fall this many rows below your checkpoint and you're both sent back to it. */
export const FALL_ROWS = 9;

/** Moving platforms: they slide back and forth between two points at a steady speed. */
export const MOVERS: { from: [number, number]; to: [number, number]; w: number; periodS: number }[] = [
  { from: [3, 44], to: [9, 44], w: 3, periodS: 4 },
  { from: [11, 35], to: [11, 29], w: 3, periodS: 5 },
];

/** Where each mover is at time t (seconds since the climb started). */
export function moverAt(i: number, t: number): Platform {
  const m = MOVERS[i]!;
  const phase = (t / m.periodS) % 1;
  const k = phase < 0.5 ? phase * 2 : 2 - phase * 2; // 0 → 1 → 0
  return { x: m.from[0] + (m.to[0] - m.from[0]) * k, y: m.from[1] + (m.to[1] - m.from[1]) * k, w: m.w };
}

export const CHAIN_LENGTH = 3.5;
export const CRUMBLE = { delayS: 0.6, goneS: 4 } as const;
