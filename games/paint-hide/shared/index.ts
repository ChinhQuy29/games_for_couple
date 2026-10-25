import { z } from 'zod';
import type { BaseRoom, PublicBase } from '@gfc/kit/shared';

export * from './scene';

// ---------- the creature ----------

/** The scene is SCENE.w × SCENE.h units; both players draw it from the same seed. */
export const SCENE = { w: 1200, h: 750 } as const;
export const CREATURE_SCALE = 0.75;

/**
 * The chameleon, as a union of ellipses in its own coordinates (centred on the body).
 * The server uses these to test clicks; the client clips the paint to them.
 */
export const CREATURE: { cx: number; cy: number; rx: number; ry: number }[] = [
  { cx: 0, cy: 0, rx: 75, ry: 40 }, // body
  { cx: 78, cy: -14, rx: 32, ry: 28 }, // head
  { cx: 104, cy: -8, rx: 14, ry: 10 }, // snout
  { cx: -82, cy: 14, rx: 30, ry: 15 }, // tail
  { cx: -106, cy: 34, rx: 14, ry: 14 }, // tail curl
  { cx: -40, cy: 40, rx: 11, ry: 17 }, // legs
  { cx: 38, cy: 40, rx: 11, ry: 17 },
  { cx: -30, cy: -38, rx: 10, ry: 14 }, // crest
  { cx: 20, cy: -40, rx: 12, ry: 14 },
];

/** The painting texture covers the creature's bounding box in its own coordinates. */
export const TEX = { w: 240, h: 120, ox: 122, oy: 56 } as const;

export interface Placement {
  x: number;
  y: number;
  /** Degrees. */
  rot: number;
  flip: boolean;
}

/** Scene point → creature-local point. */
export function toLocal(p: Placement, wx: number, wy: number): [number, number] {
  const a = (-p.rot * Math.PI) / 180;
  const dx = (wx - p.x) / CREATURE_SCALE;
  const dy = (wy - p.y) / CREATURE_SCALE;
  let lx = dx * Math.cos(a) - dy * Math.sin(a);
  const ly = dx * Math.sin(a) + dy * Math.cos(a);
  if (p.flip) lx = -lx;
  return [lx, ly];
}

export function insideCreature(lx: number, ly: number, pad = 0): boolean {
  return CREATURE.some((e) => ((lx - e.cx) / (e.rx + pad)) ** 2 + ((ly - e.cy) / (e.ry + pad)) ** 2 <= 1);
}

/** Did a click at (wx, wy) land on the creature? A little forgiving at the edges. */
export function hits(p: Placement, wx: number, wy: number): boolean {
  const [lx, ly] = toLocal(p, wx, wy);
  return insideCreature(lx, ly, 6);
}

// ---------- rooms ----------

export const TIMING = { hideMs: 80_000, seekMs: 25_000, graceMs: 4_000 } as const;
export const CLICKS = 3;
export const ROUNDS = 4;

export interface RoundResult {
  n: number;
  hiderId: string;
  found: boolean;
  /** Seconds the seeker took (if found). */
  secs: number | null;
  points: number;
  pointsTo: string;
}

export interface Room extends BaseRoom {
  phase: 'LOBBY' | 'HIDE' | 'SEEK' | 'REVEAL' | 'FINISH';
  round: number;
  hiderId: string | null;
  seed: number;
  placement: Placement | null;
  /** The hider's paint job (PNG data URL of the TEX-sized texture). */
  paint: string | null;
  clicks: { x: number; y: number; hit: boolean }[];
  hideEndsAt: number;
  seekStartsAt: number;
  seekEndsAt: number;
  found: boolean;
  scores: Record<string, number>;
  results: RoundResult[];
  readyForNext: string[];
}

export interface PublicState extends PublicBase {
  phase: Room['phase'];
  round: number;
  hiderId: string | null;
  myRole: 'hider' | 'seeker' | null;
  seed: number;
  /** Seekers get the placement and paint only once seeking starts. */
  placement: Placement | null;
  paint: string | null;
  clicks: Room['clicks'];
  seekStartsAt: number;
  found: boolean;
  scores: Record<string, number>;
  results: RoundResult[];
  readyForNext: string[];
}

export const HideSchema = z.object({
  x: z.number().min(0).max(SCENE.w),
  y: z.number().min(0).max(SCENE.h),
  rot: z.number().min(-360).max(360),
  flip: z.boolean(),
  paint: z.string().max(500_000).startsWith('data:image/png;base64,'),
});
export const ClickSchema = z.object({ x: z.number().min(0).max(SCENE.w), y: z.number().min(0).max(SCENE.h) });
