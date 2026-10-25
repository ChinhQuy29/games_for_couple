import type { CategoryId, Reaction } from './constants';

export type Mode = 'classic' | 'peek' | 'blind';
export type Phase = 'LOBBY' | 'START' | 'FINISH' | 'REVEAL' | 'RECAP';
export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Settings {
  rounds: 3 | 5 | 7 | 10;
  mode: Mode;
  timerSec: 30 | 45 | 60 | 90 | null;
  modifiersOn: boolean;
  categories: CategoryId[];
}

export interface Modifier {
  id: string;
  emoji: string;
  text: string;
}

export interface Player {
  id: string;
  token: string;
  name: string;
  connected: boolean;
  isHost: boolean;
}

export interface Sentence {
  id: string;
  round: number;
  starterAuthorId: string;
  finisherId: string;
  starter: string;
  starterFromDeck: boolean;
  ending: string | null;
  endingWasAfk: boolean;
  modifier: Modifier | null;
  /** Result of the modifier's automatic check, if it has one. */
  modifierPassed: boolean | null;
  revealed: boolean;
  ratings: Record<string, Rating>;
  reactions: Record<Reaction, number>;
}

export interface PendingStarter {
  text: string | null;
  fromDeck: boolean;
  rerollsLeft: number;
  dealt: string | null;
  dealtId: string | null;
}

export interface Room {
  code: string;
  createdAt: number;
  lastActivityAt: number;
  players: Player[];
  settings: Settings;
  phase: Phase;
  round: number;
  deadline: number | null;
  sentences: Sentence[];
  pending: Record<string, PendingStarter>;
  readyForNext: string[];
  revealIndex: number;
  usedStarterIds: string[];
  lastModifierId: string | null;
}

// ---------- What a client is allowed to see ----------

export type PublicPlayer = Omit<Player, 'token'>;

export interface PublicSentence extends Omit<Sentence, 'starter' | 'ending' | 'ratings'> {
  /** null while hidden from this viewer (blind/peek finishing). */
  starter: string | null;
  ending: string | null;
  /** Only this viewer's rating until RECAP. */
  myRating: Rating | null;
  /** Combined rating total, only filled in at RECAP. */
  ratingTotal: number | null;
}

export interface MyTask {
  sentenceId: string;
  starterVisible: string;
  wordCount: number;
  modifier: Modifier | null;
  submitted: boolean;
}

export interface PublicRoomState {
  code: string;
  you: string;
  serverNow: number;
  players: PublicPlayer[];
  settings: Settings;
  phase: Phase;
  round: number;
  deadline: number | null;
  /** Sentences from finished/current rounds, redacted for this viewer. */
  sentences: PublicSentence[];
  /** START phase: my own pending starter state. */
  myStarter: { submitted: boolean; text: string | null; rerollsLeft: number; dealt: string | null } | null;
  partnerSubmitted: boolean;
  /** FINISH phase: what I have to finish. */
  myTask: MyTask | null;
  readyForNext: string[];
  revealIndex: number;
}
