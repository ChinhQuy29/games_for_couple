import type { ChaosId, Reaction } from './constants';

export type Phase = 'LOBBY' | 'PROMPT' | 'STEP' | 'REVEAL' | 'RECAP';

export interface Settings {
  rounds: 1 | 2 | 3;
  /** Draw/guess steps after the prompt. Even, so every chain ends on a guess. */
  steps: 2 | 4 | 6;
  drawSec: 45 | 60 | 90 | null;
  guessSec: 20 | 30 | 45 | null;
  chaosOn: boolean;
}

/** One continuous line. `p` is a flat [x0, y0, x1, y1, …] list on a 1000×1000 grid. */
export interface Stroke {
  c: number;
  w: number;
  p: number[];
}

export interface Drawing {
  strokes: Stroke[];
}

export type Entry =
  | { kind: 'prompt'; text: string; by: string; fromDeck: boolean }
  | { kind: 'guess'; text: string; by: string; afk: boolean }
  | { kind: 'drawing'; drawing: Drawing; by: string; afk: boolean; chaos: ChaosId | null };

export interface Chain {
  id: string;
  round: number;
  /** Index into room.players of who started it (and drew it first). */
  owner: number;
  entries: Entry[];
  /** Chaos rule for each upcoming drawing step, decided when the chain starts. */
  chaosByStep: Record<number, ChaosId | null>;
  reactions: Record<Reaction, number>;
}

export interface Player {
  id: string;
  token: string;
  name: string;
  connected: boolean;
  isHost: boolean;
}

export interface PendingPrompt {
  text: string | null;
  fromDeck: boolean;
  dealt: string;
  rerollsLeft: number;
}

export interface Room {
  code: string;
  createdAt: number;
  lastActivityAt: number;
  players: Player[];
  settings: Settings;
  phase: Phase;
  round: number;
  /** STEP phase: which draw/guess step (0-based) everyone is on. */
  step: number;
  deadline: number | null;
  chains: Chain[];
  pending: Record<string, PendingPrompt>;
  /** REVEAL: which of this round's chains, and how many of its entries are showing. */
  revealChain: number;
  revealCount: number;
  readyForNext: string[];
  usedPromptIds: string[];
}

// ---------- what a client is allowed to see ----------

export type PublicPlayer = Omit<Player, 'token'>;

export interface PublicChain extends Omit<Chain, 'entries' | 'chaosByStep'> {
  /** Only the entries this viewer may see right now. */
  entries: Entry[];
  total: number;
}

export interface StepTask {
  kind: 'drawing' | 'guess';
  /** What to draw (prompt or guess text) — for drawing steps. */
  text: string | null;
  /** What to guess — for guess steps. */
  drawing: Drawing | null;
  chaos: ChaosId | null;
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
  step: number;
  deadline: number | null;
  chains: PublicChain[];
  myPrompt: { submitted: boolean; text: string | null; dealt: string; rerollsLeft: number } | null;
  myTask: StepTask | null;
  partnerSubmitted: boolean;
  revealChain: number;
  revealCount: number;
  readyForNext: string[];
}
