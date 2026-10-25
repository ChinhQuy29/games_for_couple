import type { CategoryId, Text } from './constants';

export type Phase = 'LOBBY' | 'QUESTION' | 'REVEAL' | 'RECAP';

/**
 * One trivia question. `mc` and `tf` are multiple choice (tf has True/False options);
 * `clues` reveals clues over time and pays more the earlier you answer.
 */
export interface QuestionDef {
  id: string;
  category: CategoryId;
  type: 'mc' | 'tf' | 'clues';
  /** 1 = casual fan, 3 = hardcore. */
  difficulty: 1 | 2 | 3;
  /** Counts for the SGP Special finale. */
  sgp?: boolean;
  q: Text;
  /** Answer options (not used for tf). The first one listed is NOT necessarily correct. */
  options?: Text[];
  /** Index of the correct option (for tf: 0 = true, 1 = false). */
  answer: number;
  /** Clue questions: up to 3 clues, most cryptic first. */
  clues?: Text[];
  /** Shown after the reveal. */
  explain: Text;
  source: string;
}

export interface Settings {
  questions: 10 | 15 | 20;
  timeSec: 15 | 20 | 30;
  categories: CategoryId[];
  /** Last few questions are SGP-only and worth double. */
  sgpFinale: boolean;
}

export interface Player {
  id: string;
  token: string;
  name: string;
  connected: boolean;
  isHost: boolean;
}

export interface Answer {
  choice: number | null;
  /** Measured on the player's own device from when the question appeared. */
  elapsedMs: number;
}

export interface Turn {
  index: number;
  questionId: string;
  finale: boolean;
  /** Display order of options: order[i] = original option index shown at position i. */
  order: number[];
  answers: Record<string, Answer>;
  points: Record<string, number>;
}

export interface Room {
  code: string;
  createdAt: number;
  lastActivityAt: number;
  players: Player[];
  settings: Settings;
  phase: Phase;
  index: number;
  /** Server time the current question started, and when it ends. */
  startedAt: number;
  deadline: number | null;
  /** Question ids picked for this game, in order. */
  plan: string[];
  /** How many questions at the end of `plan` are the SGP finale (0 = none). */
  finaleSize: number;
  turns: Turn[];
  scores: Record<string, number>;
  streaks: Record<string, number>;
  /** Question ids someone flagged as wrong (🚩). */
  flagged: string[];
  readyForNext: string[];
  usedQuestionIds: string[];
}

// ---------- what a client is allowed to see ----------

export type PublicPlayer = Omit<Player, 'token'>;

export interface PublicQuestion {
  id: string;
  category: CategoryId;
  type: QuestionDef['type'];
  difficulty: QuestionDef['difficulty'];
  q: Text;
  /** Options in display order. */
  options: Text[];
  /** Clues revealed so far. */
  clues: Text[];
  clueTotal: number;
  /** Seconds after the start at which each clue appears. */
  clueAt: number[];
  /** Only after the reveal. */
  correct: number | null;
  explain: Text | null;
  source: string | null;
}

export interface PublicTurn {
  index: number;
  finale: boolean;
  question: PublicQuestion;
  /** Your own answer always; your partner's only after the reveal. */
  answers: Record<string, Answer | null>;
  done: string[];
  points: Record<string, number> | null;
  flagged: boolean;
}

export interface PublicRoomState {
  code: string;
  you: string;
  serverNow: number;
  players: PublicPlayer[];
  settings: Settings;
  phase: Phase;
  index: number;
  total: number;
  startedAt: number;
  deadline: number | null;
  current: PublicTurn | null;
  history: PublicTurn[];
  scores: Record<string, number>;
  streaks: Record<string, number>;
  readyForNext: string[];
  deckSize: number;
}
