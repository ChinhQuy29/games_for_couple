import { z } from 'zod';
import type { BaseRoom, PublicBase } from '@gfc/kit/shared';
import type { BombInfo, ButtonColor, ButtonLabel, Edition, LedColor, SimonColor, WireColor } from './edition';

export * from './edition';

export const DIFFICULTIES = {
  easy: { label: '🟢 Easy', modules: 3, seconds: 300 },
  normal: { label: '🟡 Normal', modules: 4, seconds: 270 },
  hard: { label: '🔴 Hard', modules: 6, seconds: 330 },
} as const;
export type Difficulty = keyof typeof DIFFICULTIES;
export const DIFFICULTY_IDS = Object.keys(DIFFICULTIES) as Difficulty[];

/** "M:SS" as shown on the bomb timer. */
export function formatTimer(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export const MAX_STRIKES = 3;
/** A press shorter than this counts as a tap. */
export const TAP_MS = 600;

export type Dir = 'up' | 'down' | 'left' | 'right';

export type Module =
  | { kind: 'wires'; wires: WireColor[]; cut: number[]; solved: boolean }
  | { kind: 'button'; color: ButtonColor; label: ButtonLabel; holding: { strip: ButtonColor; since: number } | null; solved: boolean }
  | { kind: 'symbols'; symbols: string[]; pressed: string[]; solved: boolean }
  | { kind: 'simon'; flashes: SimonColor[]; stage: number; input: SimonColor[]; solved: boolean }
  | { kind: 'password'; columns: string[][]; positions: number[]; solved: boolean }
  | { kind: 'morse'; word: string; freqs: string[]; index: number; solved: boolean }
  | { kind: 'maze'; maze: number; markers: [[number, number], [number, number]]; pos: [number, number]; goal: [number, number]; solved: boolean }
  | { kind: 'memory'; stage: number; display: number; labels: number[]; history: { pos: number; label: number }[]; solved: boolean }
  | { kind: 'switches'; leds: LedColor[]; up: boolean[]; solved: boolean };

export type ModuleKind = Module['kind'];
export const MODULE_KINDS: ModuleKind[] = ['wires', 'button', 'symbols', 'simon', 'password', 'morse', 'maze', 'memory', 'switches'];

export const MODULE_INFO: Record<ModuleKind, { title: string; emoji: string }> = {
  wires: { title: 'Wires', emoji: '〰️' },
  button: { title: 'The Button', emoji: '🔴' },
  symbols: { title: 'Symbols', emoji: '🔣' },
  simon: { title: 'Simon Says', emoji: '🟦' },
  password: { title: 'Password', emoji: '🔤' },
  morse: { title: 'Morse Code', emoji: '📡' },
  maze: { title: 'Maze', emoji: '🌀' },
  memory: { title: 'Memory', emoji: '🧠' },
  switches: { title: 'Switches', emoji: '🎚️' },
};

export interface Bomb extends BombInfo {
  /** Which manual edition this bomb was built for: the rules change every bomb. */
  edition: number;
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
  kinds: ModuleKind[];
}

export interface Room extends BaseRoom {
  phase: 'LOBBY' | 'ARMED' | 'RESULT';
  difficulty: Difficulty;
  bomb: Bomb | null;
  defuserId: string | null;
  /** Module kinds on the last bomb, so the next one mixes it up. */
  lastKinds: ModuleKind[];
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
  /** The manual: only the Expert gets it while armed. */
  manual: Edition | null;
  /** Both see which edition and which modules are on the bomb (not their details). */
  edition: number | null;
  kinds: ModuleKind[];
  strikes: number;
  modulesTotal: number;
  modulesSolved: number;
  results: BombResult[];
  readyForNext: string[];
}

export type { BombInfo };

export const SettingsSchema = z.object({ difficulty: z.enum(['easy', 'normal', 'hard']) });

const mod = z.number().int().min(0).max(9);
/** Every defuser interaction, discriminated by `op`. */
export const BombActSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('cut'), module: mod, wire: z.number().int().min(0).max(5) }),
  z.object({ op: z.literal('press'), module: mod }),
  z.object({ op: z.literal('release'), module: mod, shown: z.string().max(8) }),
  z.object({ op: z.literal('symbol'), module: mod, symbol: z.string().max(4) }),
  z.object({ op: z.literal('simon'), module: mod, color: z.enum(['red', 'blue', 'green', 'yellow']) }),
  z.object({ op: z.literal('spin'), module: mod, column: z.number().int().min(0).max(4), dir: z.union([z.literal(1), z.literal(-1)]) }),
  z.object({ op: z.literal('submit'), module: mod }),
  z.object({ op: z.literal('tune'), module: mod, dir: z.union([z.literal(1), z.literal(-1)]) }),
  z.object({ op: z.literal('transmit'), module: mod }),
  z.object({ op: z.literal('move'), module: mod, dir: z.enum(['up', 'down', 'left', 'right']) }),
  z.object({ op: z.literal('memory'), module: mod, pos: z.number().int().min(0).max(3) }),
  z.object({ op: z.literal('flip'), module: mod, i: z.number().int().min(0).max(4) }),
  z.object({ op: z.literal('check'), module: mod }),
]);
export type BombAct = z.infer<typeof BombActSchema>;
