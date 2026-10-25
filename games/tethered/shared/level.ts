// The towers. Classic is hand-built from platform specs; the others come from a seeded
// generator, so both screens build exactly the same tower from (tower id, seed).
// '#' solid, '-' one-way (jump up through it), 'x' crumbles when stood on, '^' spikes.
// Each step up is at most 3 rows (the jump reaches ~3.6) and at most 2 tiles across.
// A solid tile never has a platform 2–3 rows straight below it, so nobody bonks their head.

import type { Platform } from './physics';

export const LW = 24;

export type Theme = 'grass' | 'snow' | 'sand' | 'purple' | 'stone';

export interface Mover {
  from: [number, number];
  to: [number, number];
  w: number;
  periodS: number;
}

export interface Checkpoint {
  x: number;
  y: number;
  flagX: number;
  flagY: number;
  name: string;
}

export interface Tower {
  id: number;
  name: string;
  theme: Theme;
  /** Rows, top to bottom. */
  rows: string[];
  h: number;
  checkpoints: Checkpoint[];
  summit: { x: number; y: number };
  movers: Mover[];
}

type Kind = '#' | '-' | 'x' | '^';
type Spec = [row: number, from: number, to: number, kind: Kind];

function grid(h: number, specs: Spec[]): string[] {
  const rows = Array.from({ length: h }, () => Array.from({ length: LW }, (_, x): string => (x === 0 || x === LW - 1 ? '#' : ' ')));
  for (const [row, from, to, kind] of specs) for (let x = from; x <= to; x++) rows[row]![x] = kind;
  return rows.map((r) => r.join(''));
}

/** Body top-left for standing on `row` at column x. */
const camp = (name: string, x: number, row: number, flagX: number): Checkpoint => ({ x, y: row - 0.9, flagX, flagY: row - 1, name });

// ---------- Classic (hand-built) ----------

const CLASSIC_SPECS: Spec[] = [
  [71, 1, 22, '#'],
  [68, 5, 9, '-'],
  [65, 10, 14, '-'],
  [62, 15, 19, '#'],
  [59, 10, 14, '-'],
  [56, 4, 8, 'x'],
  [53, 9, 13, '-'],
  [50, 14, 21, '#'], // camp 1
  [47, 10, 13, '-'],
  [41, 2, 5, '-'],
  [38, 6, 9, '-'],
  [29, 14, 17, '-'],
  [26, 18, 22, '#'], // camp 2
  [23, 13, 16, 'x'],
  [20, 8, 11, 'x'],
  [17, 3, 6, '-'],
  [14, 7, 12, '#'],
  [13, 11, 12, '^'],
  [11, 12, 15, '-'],
  [8, 16, 21, '#'], // camp 3
  [5, 11, 14, '-'],
  [2, 4, 9, '#'], // the summit
  [0, 0, 23, '#'],
];

const CLASSIC: Tower = {
  id: 0,
  name: 'Classic',
  theme: 'grass',
  rows: grid(72, CLASSIC_SPECS),
  h: 72,
  checkpoints: [camp('Base camp', 3, 71, 2), camp('Camp 1', 17, 50, 20), camp('Camp 2', 19, 26, 21), camp('Camp 3', 17, 8, 20)],
  summit: { x: 6, y: 1 },
  movers: [
    { from: [3, 44], to: [9, 44], w: 3, periodS: 4 },
    { from: [11, 35], to: [11, 29], w: 3, periodS: 5 },
  ],
};

// ---------- the generator ----------

export function rngFrom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One step of the route, for tests: a platform you land on, or a mover. */
export interface Step {
  row: number;
  from: number;
  to: number;
  kind: Kind | 'lift' | 'ferry';
}

/** Builds a climbable tower: a zig-zag of platforms with lifts, ferries, crumbles and camps. */
export function generateTower(id: number, name: string, theme: Theme, seed: number, h: number): Tower & { route: Step[] } {
  const rng = rngFrom(seed);
  const int = (a: number, b: number) => a + Math.floor(rng() * (b - a + 1));
  const cells = Array.from({ length: h }, () => Array.from({ length: LW }, (_, x): string => (x === 0 || x === LW - 1 ? '#' : ' ')));
  const put = (row: number, from: number, to: number, k: string) => {
    for (let x = from; x <= to; x++) cells[row]![x] = k;
  };
  // A solid tile at (x, row) is fine only if nothing is 2–3 rows straight below it.
  const canBeSolid = (row: number, from: number, to: number) => {
    for (let x = from; x <= to; x++) for (const d of [2, 3]) if (row + d < h - 1 && cells[row + d]![x] !== ' ') return false;
    return true;
  };
  put(h - 1, 1, LW - 2, '#');
  const route: Step[] = [{ row: h - 1, from: 1, to: LW - 2, kind: '#' }];
  const checkpoints = [camp('Base camp', 3, h - 1, 2)];
  const movers: Mover[] = [];
  const campRows = [Math.round(h * 0.72), Math.round(h * 0.46), Math.round(h * 0.22)];
  let prev = { row: h - 1, from: 1, to: LW - 2 };
  let dir = rng() < 0.5 ? 1 : -1;
  let sinceSpecial = 0;

  /** Where the next platform of width w goes, next to `prev` (gap 0–2), or null if it doesn't fit. */
  const beside = (p: { from: number; to: number }, w: number, d: number, gap: number) => {
    const from = d > 0 ? p.to + 1 + gap : p.from - 1 - gap - (w - 1);
    const to = from + w - 1;
    return from >= 1 && to <= LW - 2 ? { from, to } : null;
  };

  while (prev.row > 8) {
    sinceSpecial++;
    const wantCamp = campRows.length && prev.row - 3 <= campRows[0]!;
    const roll = rng();

    // A lift: ride up 6 rows next to the last platform.
    if (!wantCamp && sinceSpecial > 2 && roll < 0.14 && prev.row - 6 > 6) {
      const lift = beside(prev, 3, dir, 0) ?? beside(prev, 3, -dir, 0);
      if (lift) {
        const top = prev.row - 6;
        const side = lift.from > prev.from ? 1 : -1;
        const next = beside(lift, int(3, 5), side, 0) ?? beside(lift, 3, -side, 0);
        if (next) {
          movers.push({ from: [lift.from, prev.row], to: [lift.from, top], w: 3, periodS: 5 });
          route.push({ row: top, from: lift.from, to: lift.to, kind: 'lift' });
          put(top, next.from, next.to, '-');
          route.push({ row: top, ...next, kind: '-' });
          prev = { row: top, ...next };
          dir = next.from > lift.from ? 1 : -1;
          sinceSpecial = 0;
          continue;
        }
      }
    }

    // A ferry: a platform sliding across a wide gap, one step up.
    if (!wantCamp && sinceSpecial > 2 && roll < 0.26) {
      const row = prev.row - 3;
      const start = beside(prev, 3, dir, 0);
      if (start) {
        const end = dir > 0 ? { from: start.from + 6, to: start.from + 8 } : { from: start.from - 6, to: start.from - 4 };
        const landing = end.from >= 1 && end.to <= LW - 2 ? beside(end, int(3, 4), dir, 0) : null;
        if (landing) {
          movers.push({ from: [start.from, row], to: [end.from, row], w: 3, periodS: 5 });
          route.push({ row, from: Math.min(start.from, end.from), to: Math.max(start.to, end.to), kind: 'ferry' });
          put(row, landing.from, landing.to, '-');
          route.push({ row, ...landing, kind: '-' });
          prev = { row, ...landing };
          sinceSpecial = 0;
          continue;
        }
      }
    }

    // An ordinary step: 3 rows up, 0–2 tiles across.
    const row = prev.row - 3;
    const w = wantCamp ? 6 : int(3, 6);
    let spot = beside(prev, w, dir, int(0, 2)) ?? beside(prev, w, -dir, int(0, 2));
    if (!spot) spot = { from: Math.max(1, prev.from), to: Math.min(LW - 2, Math.max(1, prev.from) + w - 1) };
    if (spot.from > prev.from) dir = 1;
    else if (spot.to < prev.to) dir = -1;
    // Bounce off the walls now and then so the route zig-zags.
    if (spot.to >= LW - 4) dir = -1;
    if (spot.from <= 3) dir = 1;
    if (rng() < 0.2) dir = -dir;
    let kind: Kind = '-';
    if (canBeSolid(row, spot.from, spot.to)) kind = wantCamp ? '#' : roll < 0.45 ? '#' : roll < 0.75 ? 'x' : '-';
    if (wantCamp && kind === 'x') kind = '#';
    put(row, spot.from, spot.to, kind);
    // A spike in the middle of some wide solid ledges, to hop over (never on camps).
    if (!wantCamp && kind === '#' && w >= 5 && rng() < 0.35 && cells[row - 1]) {
      const sx = Math.floor((spot.from + spot.to) / 2);
      if (cells[row - 1]![sx] === ' ') cells[row - 1]![sx] = '^';
    }
    route.push({ row, ...spot, kind });
    if (wantCamp) {
      checkpoints.push(camp(`Camp ${checkpoints.length}`, spot.from + 1, row, spot.to - 1));
      campRows.shift();
    }
    prev = { row, ...spot };
  }

  // The summit: a solid ledge with the flag.
  const row = prev.row - 3;
  const spot = beside(prev, 5, dir, 0) ?? beside(prev, 5, -dir, 0) ?? { from: prev.from, to: prev.from + 4 };
  put(row, spot.from, spot.to, '#');
  route.push({ row, ...spot, kind: '#' });
  for (let x = 0; x < LW; x++) cells[0]![x] = '#';
  const rows = cells.map((r) => r.join(''));
  return { id, name, theme, rows, h, checkpoints, summit: { x: spot.from + 2, y: row - 1 }, movers, route };
}

// ---------- the tower list ----------

export const TOWER_CHOICES = [
  { id: 0, name: 'Classic', emoji: '🌿', theme: 'grass' as Theme },
  { id: 1, name: 'Frozen Peak', emoji: '❄️', theme: 'snow' as Theme, seed: 101, h: 78 },
  { id: 2, name: 'Desert Cliffs', emoji: '🏜️', theme: 'sand' as Theme, seed: 202, h: 72 },
  { id: 3, name: 'Mushroom Caves', emoji: '🍄', theme: 'purple' as Theme, seed: 303, h: 84 },
  { id: 4, name: 'Random tower', emoji: '🎲', theme: 'stone' as Theme },
] as const;
export type TowerId = (typeof TOWER_CHOICES)[number]['id'];
const RANDOM_THEMES: Theme[] = ['grass', 'snow', 'sand', 'purple', 'stone'];

const cache = new Map<string, Tower>();
/** The tower for a choice. `seed` only matters for the random one (a new tower every climb). */
export function getTower(id: number, seed = 0): Tower {
  const key = `${id}:${id === 4 ? seed : 0}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let t: Tower;
  if (id === 0) t = CLASSIC;
  else if (id === 4) {
    const r = rngFrom(seed);
    t = generateTower(4, 'Random tower', RANDOM_THEMES[Math.floor(r() * RANDOM_THEMES.length)]!, seed, 66 + Math.floor(r() * 4) * 6);
  } else {
    const c = TOWER_CHOICES[id]! as { name: string; theme: Theme; seed: number; h: number };
    t = generateTower(id, c.name, c.theme, c.seed, c.h);
  }
  if (cache.size > 50) cache.clear();
  cache.set(key, t);
  return t;
}

export const tileOf = (t: Tower, tx: number, ty: number): string => (tx < 0 || tx >= LW ? '#' : ty < 0 ? '#' : ty >= t.h ? ' ' : t.rows[ty]![tx]!);

/** Where a mover is at time t (seconds since the climb started): a steady back-and-forth. */
export function moverOf(t: Tower, i: number, time: number): Platform {
  const m = t.movers[i]!;
  const phase = (time / m.periodS) % 1;
  const k = phase < 0.5 ? phase * 2 : 2 - phase * 2; // 0 → 1 → 0
  return { x: m.from[0] + (m.to[0] - m.from[0]) * k, y: m.from[1] + (m.to[1] - m.from[1]) * k, w: m.w };
}

// The Classic tower under its old names (used by the tests and simple callers).
export const LH = CLASSIC.h;
export const LEVEL = CLASSIC.rows;
export const CHECKPOINTS = CLASSIC.checkpoints;
export const SUMMIT = CLASSIC.summit;
export const MOVERS = CLASSIC.movers;
export const tile = (tx: number, ty: number) => tileOf(CLASSIC, tx, ty);
export const moverAt = (i: number, time: number) => moverOf(CLASSIC, i, time);

/** Fall this many rows below your checkpoint and you're both sent back to it. */
export const FALL_ROWS = 9;
export const CHAIN_LENGTH = 3.5;
export const CRUMBLE = { delayS: 0.6, goneS: 4 } as const;
