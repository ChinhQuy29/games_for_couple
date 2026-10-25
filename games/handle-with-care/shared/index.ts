import { z } from 'zod';
import type { BaseRoom, PublicBase } from '@gfc/kit/shared';
import type { Body } from './physics';
import type { ItemKind } from './levels';

export * from './physics';
export * from './levels';

export const HZ = 30;
export const COUNTDOWN_MS = 3000;
/** Carrying something big: slower, and no jumping. */
export const HEAVY_SPEED = 0.55;
/** Big things drop if the two carriers get further apart than the item's width plus this. */
export const BIG_STRETCH = 1.4;
/** How close (tiles, centre to centre) you must be to grab something. */
export const REACH = 1.3;

export interface Item {
  id: number;
  kind: ItemKind;
  body: Body;
  /** 1 = perfect, 0 = broken. */
  hp: number;
  /** Player ids holding it (one for small things, up to two for big ones). */
  holders: string[];
  state: 'house' | 'delivered' | 'broken';
  /** Seconds left before another bump can hurt it. */
  bumpCooldown: number;
}

export interface HouseResult {
  house: number;
  earned: number;
  possible: number;
  delivered: number;
  broken: number;
}

export interface Room extends BaseRoom {
  phase: 'LOBBY' | 'MOVE' | 'DONE' | 'FINISH';
  house: number;
  bodies: Body[];
  /** What each player is holding (item id) or null. */
  holding: Record<string, number | null>;
  held: Record<string, { left: boolean; right: boolean; jump: boolean; grab: boolean; throw: boolean }>;
  /** Last frame's grab/throw, so presses are edge-triggered. */
  prevButtons: Record<string, { grab: boolean; throw: boolean }>;
  items: Item[];
  earned: number;
  steps: number;
  startsAt: number;
  feed: { id: number; text: string; good: boolean }[];
  nextId: number;
  results: HouseResult[];
  readyForNext: string[];
}

export interface Frame {
  t: number;
  /** Per player: x, y, flags (2 on ground, 4 facing left, 8 carrying). */
  b: [number, number, number][];
  /** Per item still in play: id, x, y, hp (0–100). */
  i: [number, number, number, number][];
  earned: number;
  left: number;
}

export interface PublicState extends PublicBase {
  phase: Room['phase'];
  house: number;
  mySlot: number;
  startsAt: number;
  /** Static item info; positions come in frames. */
  items: { id: number; kind: ItemKind; state: Item['state']; holders: string[] }[];
  earned: number;
  possible: number;
  feed: Room['feed'];
  results: HouseResult[];
  readyForNext: string[];
  frame: Frame | null;
}

export const HeldSchema = z.object({ left: z.boolean(), right: z.boolean(), jump: z.boolean(), grab: z.boolean(), throw: z.boolean() });
