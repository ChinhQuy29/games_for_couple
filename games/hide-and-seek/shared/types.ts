import type { MapId, PropType } from './constants';

export type Phase = 'LOBBY' | 'HIDE' | 'SEEK' | 'REVEAL' | 'RECAP';

export interface Settings {
  rounds: 2 | 4 | 6;
  hideSec: 30 | 45 | 60;
  seekSec: 45 | 60 | 90;
  shots: 3 | 5 | 7;
  map: 'random' | MapId;
  taunts: boolean;
  sneaks: 0 | 2 | 3;
  /** Who hides in round 1: random, the host, or the guest. Roles swap every round after. */
  firstHider: 'random' | 'host' | 'guest';
}

export interface Placement {
  x: number;
  y: number;
  /** Degrees, multiples of 15. */
  rot: number;
  /** 0.9–1.1 */
  scale: number;
}

/** A prop as clients see it. The hider's fake looks exactly like this too. */
export interface Prop extends Placement {
  id: string;
  type: PropType;
}

export interface Shot {
  propId: string;
  x: number;
  y: number;
  hit: boolean;
  at: number;
}

export interface Round {
  n: number;
  map: MapId;
  hiderId: string;
  hunterId: string;
  /** The 3 object types the hider may become. */
  choices: PropType[];
  hiderType: PropType;
  hider: Placement;
  hiderPropId: string;
  /** The real props in this round's layout. */
  props: Prop[];
  shots: Shot[];
  sneaksLeft: number;
  result: 'found' | 'survived' | null;
  points: Record<string, number>;
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
  rounds: Round[];
  /** Index into `players` of who hides in round 1 (coin flip); roles alternate after. */
  firstHider: 0 | 1;
  scores: Record<string, number>;
  startedAt: number;
  deadline: number | null;
  /** Taunt currently playing (cleared after ~1s). */
  taunt: { propId: string; until: number } | null;
  nextTauntAt: number | null;
  readyForNext: string[];
}

// ---------- what a client is allowed to see ----------

export type PublicPlayer = Omit<Player, 'token'>;

export interface PublicRound {
  n: number;
  map: MapId;
  hiderId: string;
  hunterId: string;
  /** Null for the hunter while hiding. */
  props: Prop[] | null;
  /** Hider only (while hiding). */
  choices: PropType[] | null;
  /** Hider only (and everyone after the round). */
  myPropId: string | null;
  hiderPropId: string | null;
  /** Hider's current object and placement: hider only while playing. */
  hider: (Placement & { type: PropType }) | null;
  shots: Shot[];
  shotsLeft: number;
  sneaksLeft: number;
  result: Round['result'];
  points: Record<string, number> | null;
}

export interface PublicRoomState {
  code: string;
  you: string;
  serverNow: number;
  players: PublicPlayer[];
  settings: Settings;
  phase: Phase;
  roundIndex: number;
  totalRounds: number;
  startedAt: number;
  deadline: number | null;
  round: PublicRound | null;
  history: PublicRound[];
  scores: Record<string, number>;
  /** Prop wiggling right now (both roles see it — that's the point). */
  tauntPropId: string | null;
  readyForNext: string[];
}
