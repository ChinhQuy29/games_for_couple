import { z } from 'zod';
import type { BaseRoom, PublicBase } from '@gfc/kit/shared';
import type { Body } from './physics';
import { LEVELS } from './levels';

export * from './physics';
export * from './levels';

export const HZ = 30;
export const COUNTDOWN_MS = 2000;

export type Role = 'walker' | 'jumper';

export interface LevelResult {
  level: number;
  ms: number;
  deaths: number;
  swaps: number;
}

export interface Room extends BaseRoom {
  phase: 'LOBBY' | 'PLAY' | 'CLEAR' | 'FINISH';
  startLevel: number;
  /** Seat that walks on the first level played; it alternates after that. */
  firstWalker: 0 | 1;
  level: number;
  body: Body;
  walkerId: string | null;
  /** Each player's held keys; only the part matching their role counts. */
  held: Record<string, { left: boolean; right: boolean; jump: boolean }>;
  hasKey: boolean;
  gateUntil: number;
  onSwapPad: boolean;
  deaths: number;
  swaps: number;
  steps: number;
  startsAt: number;
  lastDeathAt: number;
  results: LevelResult[];
  readyForNext: string[];
}

export interface Frame {
  t: number;
  /** x, y, vx, vy, flags (2 on ground, 4 facing left). */
  b: [number, number, number, number, number];
  key: boolean;
  /** Seconds the gate stays open (0 = closed). */
  gate: number;
  walker: string | null;
  deaths: number;
}

export interface PublicState extends PublicBase {
  phase: Room['phase'];
  startLevel: number;
  level: number;
  myRole: Role | null;
  walkerId: string | null;
  startsAt: number;
  deaths: number;
  swaps: number;
  lastDeathAt: number;
  results: LevelResult[];
  readyForNext: string[];
  frame: Frame | null;
}

export const HeldSchema = z.object({ left: z.boolean(), right: z.boolean(), jump: z.boolean() });
export const SettingsSchema = z.object({ startLevel: z.number().int().min(0).max(LEVELS.length - 1) });
