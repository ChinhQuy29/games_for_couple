import { z } from 'zod';
import type { BaseRoom, PublicBase } from '@gfc/kit/shared';
import type { Dir, RoomId } from './map';

export * from './map';

// ---------- ghosts and evidence ----------

export const EVIDENCE = {
  emf: { emoji: '📟', name: 'EMF 5', how: "The Navigator's EMF readout hits 5 while the Explorer is in the ghost's room." },
  freezing: { emoji: '🥶', name: 'Freezing', how: "The Navigator's thermometer drops below 0°C in the ghost's room." },
  orbs: { emoji: '🔮', name: 'Ghost orbs', how: 'A camera placed in the ghost room shows orbs on the Navigator’s feed.' },
  writing: { emoji: '📓', name: 'Ghost writing', how: 'A book left in the ghost room gets scribbled in. Go back and look.' },
  spiritbox: { emoji: '📻', name: 'Spirit box', how: 'Use the spirit box in the ghost room. Sometimes it answers.' },
  prints: { emoji: '🖐️', name: 'Handprints', how: "With the UV light on, the ghost room's doorways show handprints." },
} as const;
export type Evidence = keyof typeof EVIDENCE;
export const EVIDENCE_IDS = Object.keys(EVIDENCE) as Evidence[];

export const GHOSTS = {
  spirit: { name: 'Spirit', evidence: ['emf', 'spiritbox', 'writing'], trait: 'Plain and polite. Hunts only when you are very scared.', huntBelow: 40, huntChance: 0.4 },
  wraith: { name: 'Wraith', evidence: ['emf', 'spiritbox', 'freezing'], trait: 'Floats fast. Moves 1 extra tile now and then during hunts.', huntBelow: 50, huntChance: 0.5 },
  phantom: { name: 'Phantom', evidence: ['spiritbox', 'prints', 'orbs'], trait: 'Looking at it hurts: sanity drains faster when it is near.', huntBelow: 50, huntChance: 0.5 },
  poltergeist: { name: 'Poltergeist', evidence: ['spiritbox', 'prints', 'writing'], trait: 'Loud and messy. Makes lots of noise in the feed.', huntBelow: 50, huntChance: 0.5 },
  banshee: { name: 'Banshee', evidence: ['prints', 'orbs', 'freezing'], trait: 'Stalks you. Wanders out of its room more often.', huntBelow: 50, huntChance: 0.5 },
  jinn: { name: 'Jinn', evidence: ['emf', 'prints', 'freezing'], trait: 'Territorial. Rarely leaves its room.', huntBelow: 50, huntChance: 0.5 },
  mare: { name: 'Mare', evidence: ['spiritbox', 'orbs', 'writing'], trait: 'Loves the dark. Hunts early.', huntBelow: 60, huntChance: 0.5 },
  demon: { name: 'Demon', evidence: ['prints', 'writing', 'freezing'], trait: 'Aggressive. Hunts early and often.', huntBelow: 70, huntChance: 0.75 },
} as const satisfies Record<string, { name: string; evidence: readonly [Evidence, Evidence, Evidence]; trait: string; huntBelow: number; huntChance: number }>;
export type GhostType = keyof typeof GHOSTS;
export const GHOST_IDS = Object.keys(GHOSTS) as GhostType[];

export const TIMING = {
  tickMs: 200,
  /** The explorer may step at most this often. */
  moveMs: 150,
  gameMs: 10 * 60_000,
  readingEveryTicks: 5,
  wanderEveryTicks: 3,
  huntCheckEveryMs: 10_000,
  huntWarningMs: 3000,
  huntMs: 15_000,
  huntCooldownMs: 20_000,
  spiritboxCooldownMs: 2500,
  /** Sanity lost per tick, always and near the ghost. */
  drainPerTick: 0.055,
  nearDrainPerTick: 0.2,
} as const;

export const CAMERAS = 2;

// ---------- state ----------

export type Hunt = 'calm' | 'warning' | 'hunt';

export interface Journal {
  marks: Record<Evidence, 'yes' | 'no' | null>;
  guess: GhostType | null;
}

export interface GameResult {
  n: number;
  explorerId: string;
  ghost: GhostType;
  ghostRoom: RoomId;
  guess: GhostType | null;
  outcome: 'escaped' | 'wrong' | 'caught' | 'timeout';
  ms: number;
}

export interface Room extends BaseRoom {
  phase: 'LOBBY' | 'HUNT' | 'RESULT';
  explorerId: string | null;
  ghost: GhostType;
  ghostRoom: RoomId;
  ghostPos: [number, number];
  me: { pos: [number, number]; facing: Dir; hidden: boolean; uv: boolean; lastMoveAt: number };
  sanity: number;
  hunt: Hunt;
  huntUntil: number;
  nextHuntCheckAt: number;
  cameras: { pos: [number, number]; room: RoomId }[];
  book: { pos: [number, number]; room: RoomId; writeAt: number | null; written: boolean } | null;
  prints: [number, number][];
  readings: { room: RoomId | null; emf: number; temp: number };
  roomTemps: Record<RoomId, number>;
  spiritboxReadyAt: number;
  feed: { id: number; at: number; text: string }[];
  journal: Journal;
  startedAt: number;
  endsAt: number;
  tickN: number;
  nextTickAt: number;
  nextId: number;
  results: GameResult[];
  readyForNext: string[];
}

export interface ExplorerView {
  role: 'explorer';
  pos: [number, number];
  facing: Dir;
  hidden: boolean;
  uv: boolean;
  /** Tiles visible right now, as index → tile char. */
  visible: Record<number, string>;
  /** Only while hunting and in sight. */
  ghost: [number, number] | null;
  book: { pos: [number, number]; written: boolean | null } | null;
  cameras: [number, number][];
  /** Doorways showing handprints (UV on, in sight). */
  prints: [number, number][];
}

export interface NavigatorView {
  role: 'navigator';
  map: string;
  explorer: { pos: [number, number]; facing: Dir; hidden: boolean; uv: boolean };
  cameras: { pos: [number, number]; room: RoomId; orbs: boolean; motion: boolean }[];
  book: { pos: [number, number] } | null;
  readings: Room['readings'];
}

export interface PublicState extends PublicBase {
  phase: Room['phase'];
  explorerId: string | null;
  view: ExplorerView | NavigatorView | null;
  sanity: number;
  hunt: Hunt;
  feed: Room['feed'];
  journal: Journal;
  camerasLeft: number;
  spiritboxReadyAt: number;
  results: GameResult[];
  readyForNext: string[];
}

export const MoveSchema = z.object({ dir: z.enum(['up', 'down', 'left', 'right']) });
export const ToolSchema = z.object({ tool: z.enum(['uv', 'spiritbox', 'book', 'camera', 'hide']) });
export const JournalSchema = z.object({
  mark: z.object({ evidence: z.enum(['emf', 'freezing', 'orbs', 'writing', 'spiritbox', 'prints']), value: z.enum(['yes', 'no']).nullable() }).optional(),
  guess: z.enum(['spirit', 'wraith', 'phantom', 'poltergeist', 'banshee', 'jinn', 'mare', 'demon']).nullable().optional(),
});

/** Ghosts still possible given the journal marks. */
export function possibleGhosts(marks: Journal['marks']): GhostType[] {
  return GHOST_IDS.filter((g) => {
    const ev: readonly Evidence[] = GHOSTS[g].evidence;
    return EVIDENCE_IDS.every((e) => (marks[e] === 'yes' ? ev.includes(e) : marks[e] === 'no' ? !ev.includes(e) : true));
  });
}
