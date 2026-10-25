import type { CategoryId, Reaction } from './constants';

export type Phase = 'LOBBY' | 'WRITE' | 'ANSWER' | 'DEBATE' | 'RESULT' | 'RECAP';
export type Choice = 'a' | 'b';

export interface Settings {
  questions: 10 | 15 | 20;
  answerSec: 15 | 30 | null;
  /** Every Nth question is written by one of you (alternating). null = deck only. */
  customEvery: 5 | 3 | null;
  categories: CategoryId[];
}

export interface Question {
  id: string;
  a: string;
  b: string;
  /** Set when a player wrote it. */
  authorId: string | null;
}

export interface Turn {
  index: number;
  question: Question;
  picks: Record<string, Choice>;
  /** What each player thinks their PARTNER picked. */
  predictions: Record<string, Choice>;
  /** Answers the game filled in because time ran out. */
  autoPicked: string[];
  defenses: Record<string, string>;
  reactions: Record<Reaction, number>;
}

export interface Player {
  id: string;
  token: string;
  name: string;
  connected: boolean;
  isHost: boolean;
}

export interface Room {
  code: string;
  createdAt: number;
  lastActivityAt: number;
  players: Player[];
  settings: Settings;
  phase: Phase;
  /** 1-based index of the current question. */
  index: number;
  deadline: number | null;
  turns: Turn[];
  /** WRITE phase: who is writing this question. */
  writerId: string | null;
  readyForNext: string[];
  usedQuestionIds: string[];
}

// ---------- what a client is allowed to see ----------

export type PublicPlayer = Omit<Player, 'token'>;

/** A turn with the partner's secrets removed until they're meant to be seen. */
export interface PublicTurn extends Omit<Turn, 'picks' | 'predictions' | 'defenses'> {
  picks: Record<string, Choice | null>;
  predictions: Record<string, Choice | null>;
  defenses: Record<string, string | null>;
  /** Who has locked in for the current step (answer or defense). */
  done: string[];
}

export interface PublicRoomState {
  code: string;
  you: string;
  serverNow: number;
  players: PublicPlayer[];
  settings: Settings;
  phase: Phase;
  index: number;
  deadline: number | null;
  /** The current question (null while it's being written). */
  current: PublicTurn | null;
  /** Finished questions, newest last. */
  history: PublicTurn[];
  writerId: string | null;
  readyForNext: string[];
}
