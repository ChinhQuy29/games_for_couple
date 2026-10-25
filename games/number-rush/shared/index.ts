import { z } from 'zod';
import type { BaseRoom, PublicBase } from '@gfc/kit/shared';

export const WORLD = { w: 1600, h: 1000 } as const;

export const COUNT_OPTIONS = [30, 50, 100] as const;
export const ORDER_OPTIONS = ['asc', 'desc', 'random'] as const;
export const STYLE_OPTIONS = ['calm', 'chaos'] as const;

export const TIMING = {
  countdownMs: 3000,
  /** After the first correct click, wait this long for the other player's (device-timed) claim. */
  photoFinishMs: 350,
  /** Wrong click = locked out for this long. */
  lockMs: 1500,
  /** How much faster than the server saw a device may claim it reacted (covers network lag). */
  maxLagMs: 3000,
} as const;

export type Order = (typeof ORDER_OPTIONS)[number];

export interface Settings {
  count: (typeof COUNT_OPTIONS)[number];
  order: Order;
  style: (typeof STYLE_OPTIONS)[number];
}

export interface Cell {
  n: number;
  x: number;
  y: number;
  /** Font size in world units. */
  size: number;
  rot: number;
  color: string;
}

export interface Find {
  n: number;
  by: string;
  /** Reaction time the winning claim reported (after clamping). */
  ms: number;
}

export interface Room extends BaseRoom {
  phase: 'LOBBY' | 'PLAY' | 'RECAP';
  settings: Settings;
  board: Cell[];
  sequence: number[];
  index: number;
  /** Clicks are ignored before this (3-2-1 countdown). */
  startsAt: number;
  /** When the current target became the target (server time). */
  targetSince: number;
  finds: Find[];
  scores: Record<string, number>;
  lockedUntil: Record<string, number>;
  /** A photo finish in progress for the current target. */
  pending: { n: number; claims: { playerId: string; ms: number }[]; closesAt: number } | null;
}

export interface PublicState extends PublicBase {
  phase: Room['phase'];
  settings: Settings;
  board: Cell[];
  /** The number everyone is looking for (null outside PLAY). */
  target: number | null;
  /** How many numbers are done. */
  found: number;
  total: number;
  startsAt: number;
  targetSince: number;
  /** n → who found it. */
  claimed: Record<number, string>;
  finds: Find[];
  scores: Record<string, number>;
  /** Until when *I* am locked out after a wrong click. */
  myLockUntil: number;
}

export const SettingsPatchSchema = z
  .object({
    count: z.union([z.literal(30), z.literal(50), z.literal(100)]),
    order: z.enum(ORDER_OPTIONS),
    style: z.enum(STYLE_OPTIONS),
  })
  .partial();

export const PickSchema = z.object({ n: z.number().int().min(1).max(100), ms: z.number().int().min(0).max(600_000) });
