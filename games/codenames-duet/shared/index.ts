import { z } from 'zod';
import type { BaseRoom, PublicBase } from '@gfc/kit/shared';
import type { Lang } from './words';

export * from './words';

/** What a card is on one side's key. */
export type Mark = 'agent' | 'bystander' | 'assassin';

/** The Duet key layout: [my side, partner's side] and how many cards get it (25 total, 15 agents). */
export const KEY_LAYOUT: [Mark, Mark, number][] = [
  ['agent', 'agent', 3],
  ['agent', 'bystander', 5],
  ['agent', 'assassin', 1],
  ['bystander', 'agent', 5],
  ['assassin', 'agent', 1],
  ['assassin', 'assassin', 1],
  ['assassin', 'bystander', 1],
  ['bystander', 'assassin', 1],
  ['bystander', 'bystander', 7],
];
export const AGENTS_TOTAL = 15;

export const TURN_OPTIONS = [11, 9, 7] as const;
export type Turns = (typeof TURN_OPTIONS)[number];

export interface Clue {
  word: string;
  count: number;
  /** Seat that gave it; the other seat guesses using the giver's key. */
  by: 0 | 1;
  /** Agents found under this clue so far. */
  got: string[];
}

export interface Room extends BaseRoom {
  phase: 'LOBBY' | 'PLAY' | 'OVER';
  lang: Lang;
  turns: Turns;
  words: string[];
  /** keys[seat][i]: what card i is on that seat's key. */
  keys: [Mark[], Mark[]];
  /** Agents found (by card index). */
  found: boolean[];
  /** bystanderFor[seat][i]: card i was guessed as a bystander from that seat's key. */
  bystanderFor: [boolean[], boolean[]];
  /** Whose turn it is to give a clue. */
  giver: 0 | 1;
  /** Who gave the first clue on this board (the next board starts with the other). */
  startGiver: 0 | 1;
  clue: Clue | null;
  turnsLeft: number;
  /** Every clue so far, with what came of it. */
  log: { word: string; count: number; by: 0 | 1; got: string[]; ended: 'bystander' | 'stopped' | 'assassin' | 'won' }[];
  outcome: null | { won: boolean; why: 'all-found' | 'assassin' | 'out-of-time'; assassinBy?: 0 | 1; card?: number };
  record: { wins: number; games: number };
  readyForNext: string[];
}

export interface PublicCard {
  word: string;
  /** What it is on MY key (my partner never sees this). */
  mine: Mark;
  found: boolean;
  /** Guessed as a bystander when I gave the clue / when my partner gave it. */
  bystanderMine: boolean;
  bystanderTheirs: boolean;
  /** Revealed after the game ends: my partner's key. */
  theirs: Mark | null;
}

export interface PublicState extends PublicBase {
  phase: Room['phase'];
  lang: Lang;
  turns: Turns;
  mySeat: 0 | 1;
  cards: PublicCard[];
  giver: 0 | 1;
  clue: Clue | null;
  turnsLeft: number;
  agentsLeft: number;
  /** My agents still unfound, and my partner's. */
  myAgentsLeft: number;
  theirAgentsLeft: number;
  log: Room['log'];
  outcome: Room['outcome'];
  record: Room['record'];
  readyForNext: string[];
}

export const SettingsSchema = z.object({ lang: z.enum(['en', 'vi']).optional(), turns: z.union([z.literal(11), z.literal(9), z.literal(7)]).optional() });
export const ClueSchema = z.object({ word: z.string().min(1).max(30), count: z.number().int().min(0).max(9) });
export const GuessSchema = z.object({ card: z.number().int().min(0).max(24) });
