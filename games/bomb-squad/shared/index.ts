import { z } from 'zod';
import type { BaseRoom, PublicBase } from '@gfc/kit/shared';
import type { ButtonColor, ButtonLabel, SimonColor, WireColor } from './manual';
import type { BombInfo } from './rules';

export * from './manual';
export * from './rules';

export const DIFFICULTIES = {
  easy: { label: '🟢 Easy', modules: 3, seconds: 300 },
  normal: { label: '🟡 Normal', modules: 4, seconds: 240 },
  hard: { label: '🔴 Hard', modules: 5, seconds: 180 },
} as const;
export type Difficulty = keyof typeof DIFFICULTIES;
export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES) as Difficulty[];

export const MAX_STRIKES = 3;
/** A press shorter than this counts as a tap. */
export const TAP_MS = 600;

export type Module =
  | { kind: 'wires'; wires: WireColor[]; cut: number[]; solved: boolean }
  | { kind: 'button'; color: ButtonColor; label: ButtonLabel; holding: { strip: ButtonColor; since: number } | null; solved: boolean }
  | { kind: 'symbols'; symbols: string[]; pressed: string[]; solved: boolean }
  | { kind: 'simon'; flashes: SimonColor[]; stage: number; input: SimonColor[]; solved: boolean }
  | { kind: 'password'; columns: string[][]; positions: number[]; solved: boolean };

export type ModuleKind = Module['kind'];

export interface Bomb extends BombInfo {
  modules: Module[];
  strikes: number;
  startedAt: number;
  endsAt: number;
}

export interface BombResult {
  n: number;
  defuserId: string;
  outcome: 'defused' | 'exploded';
  cause: 'strikes' | 'time' | null;
  timeLeftMs: number;
  strikes: number;
  difficulty: Difficulty;
}

export interface Room extends BaseRoom {
  phase: 'LOBBY' | 'ARMED' | 'RESULT';
  difficulty: Difficulty;
  bomb: Bomb | null;
  defuserId: string | null;
  results: BombResult[];
  readyForNext: string[];
}

export interface PublicState extends PublicBase {
  phase: Room['phase'];
  difficulty: Difficulty;
  role: 'defuser' | 'expert' | null;
  defuserId: string | null;
  /** Only the Defuser gets the bomb while it's armed; both see it after. */
  bomb: Bomb | null;
  /** Everyone sees these. */
  strikes: number;
  modulesTotal: number;
  modulesSolved: number;
  results: BombResult[];
  readyForNext: string[];
}

export type { BombInfo };

export const SettingsSchema = z.object({ difficulty: z.enum(['easy', 'normal', 'hard']) });

/** Every defuser interaction, discriminated by `op`. */
export const BombActSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('cut'), module: z.number().int().min(0).max(9), wire: z.number().int().min(0).max(5) }),
  z.object({ op: z.literal('press'), module: z.number().int().min(0).max(9) }),
  z.object({ op: z.literal('release'), module: z.number().int().min(0).max(9), shown: z.string().max(8) }),
  z.object({ op: z.literal('symbol'), module: z.number().int().min(0).max(9), symbol: z.string().max(4) }),
  z.object({ op: z.literal('simon'), module: z.number().int().min(0).max(9), color: z.enum(['red', 'blue', 'green', 'yellow']) }),
  z.object({ op: z.literal('spin'), module: z.number().int().min(0).max(9), column: z.number().int().min(0).max(4), dir: z.union([z.literal(1), z.literal(-1)]) }),
  z.object({ op: z.literal('submit'), module: z.number().int().min(0).max(9) }),
]);
export type BombAct = z.infer<typeof BombActSchema>;
