import { z } from 'zod';
import type { BaseRoom, PublicBase } from '@gfc/kit/shared';
import type { Body, Input } from './physics';

export * from './physics';
export * from './level';

export const HZ = 30;
export const COUNTDOWN_MS = 3000;

export interface ClimbResult {
  towerId: number;
  n: number;
  ms: number;
  falls: number;
  pulls: number;
}

export interface Room extends BaseRoom {
  phase: 'LOBBY' | 'CLIMB' | 'SUMMIT';
  /** Which tower (see TOWER_CHOICES) and, for the random one, its seed. */
  towerId: number;
  towerSeed: number;
  /** Two bodies, in player order. */
  bodies: Body[];
  inputs: Record<string, Input>;
  checkpoint: number;
  falls: number;
  /** Times the chain yanked someone (the drama meter). */
  pulls: number;
  /** Simulation steps since the climb started. */
  steps: number;
  startsAt: number;
  /** Crumbling tiles: index → when it started crumbling (s) or when it's gone until (s). */
  crumbles: Record<number, { since: number; goneUntil: number | null }>;
  lastFallAt: number;
  results: ClimbResult[];
  readyForNext: string[];
}

/** Sent 30 times a second while climbing. Tiny on purpose. */
export interface Frame {
  /** Simulation time, seconds. */
  t: number;
  /** Per body: x, y, vx, vy, flags (1 grabbing, 2 on ground, 4 facing left), stamina. */
  b: [number, number, number, number, number, number][];
  /** Crumbled tiles that are gone right now. */
  gone: number[];
  falls: number;
  pulls: number;
  checkpoint: number;
}

export interface PublicState extends PublicBase {
  phase: Room['phase'];
  /** Which body is mine: 0 or 1. */
  mySlot: number;
  towerId: number;
  towerSeed: number;
  startsAt: number;
  checkpoint: number;
  falls: number;
  pulls: number;
  lastFallAt: number;
  results: ClimbResult[];
  readyForNext: string[];
  /** A snapshot so a fresh page can draw something before the first frame. */
  frame: Frame | null;
}

export const TowerSchema = z.object({ towerId: z.number().int().min(0).max(4) });
export const InputSchema = z.object({ left: z.boolean(), right: z.boolean(), jump: z.boolean(), grab: z.boolean() });
