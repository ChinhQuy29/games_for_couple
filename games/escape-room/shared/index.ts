import { z } from 'zod';
import type { BaseRoom, PublicBase } from '@gfc/kit/shared';

// Two rooms, one escape. Every puzzle has its clue on one screen and its controls on the
// other: the "clue" player describes, the "actor" player acts.

export const SYMBOLS = ['☀', '☾', '★', '♥', '♣', '♠', '♦', '⚓', '✿', '☂'] as const;
export type Sym = (typeof SYMBOLS)[number];

export const COLORS = ['red', 'blue', 'green', 'yellow'] as const;
export type Color = (typeof COLORS)[number];

export const OBJECTS = ['🕯️', '📚', '🖼️', '🐟', '🍎', '🧸', '🔑', '🕰️', '🎩', '🧪'] as const;
export type Obj = (typeof OBJECTS)[number];

export type Dir = 'up' | 'down' | 'left' | 'right';
/** Maze walls per cell: bit 1 = north, 2 = east, 4 = south, 8 = west. */
export const WALL = { up: 1, right: 2, down: 4, left: 8 } as const;

export type Puzzle =
  | { kind: 'dial'; actor: 0 | 1; solved: boolean; answer: number[]; dials: number[] }
  | { kind: 'code'; actor: 0 | 1; solved: boolean; order: Obj[]; shelf: { obj: Obj; x: number; y: number; r: number }[]; answer: string }
  | { kind: 'colors'; actor: 0 | 1; solved: boolean; answer: Color[]; progress: number }
  | { kind: 'levers'; actor: 0 | 1; solved: boolean; answer: boolean[]; legend: { up: Sym; down: Sym }; state: boolean[] }
  | { kind: 'maze'; actor: 0 | 1; solved: boolean; size: number; walls: number[]; start: [number, number]; exit: [number, number]; pos: [number, number]; trail: [number, number][] };
export type PuzzleKind = Puzzle['kind'];

export const ROOMS = [
  { name: 'The Study', emoji: '📖', story: 'Dusty books, a ticking clock, and a door with far too many locks.', puzzles: ['dial', 'code', 'colors', 'levers'], colorLen: 4, maze: 5 },
  { name: 'The Lab', emoji: '🧪', story: 'Something bubbles in the corner. Best not to ask.', puzzles: ['code', 'maze', 'colors', 'dial'], colorLen: 5, maze: 5 },
  { name: 'The Attic', emoji: '🕸️', story: 'Creaky boards, a dark crawlspace, and the way out. Probably.', puzzles: ['maze', 'levers', 'code', 'colors'], colorLen: 6, maze: 6 },
] as const satisfies readonly { name: string; emoji: string; story: string; puzzles: readonly PuzzleKind[]; colorLen: number; maze: number }[];

export const MISTAKE_PENALTY_MS = 15_000;

export interface RoomResult {
  room: number;
  ms: number;
  mistakes: number;
}

export interface Room extends BaseRoom {
  phase: 'LOBBY' | 'PLAY' | 'CLEAR' | 'FINISH';
  room: number;
  puzzles: Puzzle[];
  /** Which seat acts on the first puzzle of this room. */
  firstActor: 0 | 1;
  mistakes: number;
  startedAt: number;
  /** A short "it worked!" / "wrong!" flash for both screens. */
  flash: { id: number; good: boolean; text: string } | null;
  results: RoomResult[];
  readyForNext: string[];
}

/** One puzzle as one player sees it: either the clue or the controls, never both. */
export type Card =
  | { kind: 'dial'; role: 'clue'; mural: number[] }
  | { kind: 'dial'; role: 'actor'; dials: number[] }
  | { kind: 'code'; role: 'clue'; order: Obj[] }
  | { kind: 'code'; role: 'actor'; shelf: { obj: Obj; x: number; y: number; r: number }[]; length: number }
  | { kind: 'colors'; role: 'clue'; window: Color[] }
  | { kind: 'colors'; role: 'actor'; length: number; progress: number }
  | { kind: 'levers'; role: 'clue'; pattern: Sym[] }
  | { kind: 'levers'; role: 'actor'; legend: { up: Sym; down: Sym }; state: boolean[] }
  | { kind: 'maze'; role: 'clue'; size: number; walls: number[]; exit: [number, number]; pos: [number, number] }
  | { kind: 'maze'; role: 'actor'; size: number; pos: [number, number]; trail: [number, number][] };

export interface PublicPuzzle {
  kind: PuzzleKind;
  solved: boolean;
  /** Only the current puzzle (and solved ones) show their card. */
  card: Card | null;
  actorSeat: 0 | 1;
}

export interface PublicState extends PublicBase {
  phase: Room['phase'];
  room: number;
  mySeat: 0 | 1;
  puzzles: PublicPuzzle[];
  current: number;
  mistakes: number;
  startedAt: number;
  flash: Room['flash'];
  results: RoomResult[];
  readyForNext: string[];
}

export const ActSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('spin'), dial: z.number().int().min(0).max(5), dir: z.union([z.literal(1), z.literal(-1)]) }),
  z.object({ op: z.literal('tryDial') }),
  z.object({ op: z.literal('code'), code: z.string().regex(/^\d{1,6}$/) }),
  z.object({ op: z.literal('color'), color: z.enum(COLORS) }),
  z.object({ op: z.literal('lever'), lever: z.number().int().min(0).max(9) }),
  z.object({ op: z.literal('tryLevers') }),
  z.object({ op: z.literal('move'), dir: z.enum(['up', 'down', 'left', 'right']) }),
]);
export type Act = z.infer<typeof ActSchema>;
