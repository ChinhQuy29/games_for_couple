// Hide and Seek — the game rules (a two-player prop hunt).
// No sockets, no timers, no Date.now(): callers pass `now` and `rng` in, so
// everything here is deterministic and unit-testable. Functions validate
// first, then mutate the room in place, and throw GameError on bad intents.
//
// Each round: the hider becomes one of 3 objects and places it (HIDE) while the
// hunter can't see the room, then the hunter gets a few shots to find it (SEEK).

import {
  LIMITS,
  MAP_IDS,
  POINTS,
  PROP_TYPES,
  ROTATE_STEP,
  SCALE_RANGE,
  TIMING,
  WORLD,
  type ErrorCode,
  type MapId,
  type Placement,
  type Player,
  type Prop,
  type PropType,
  type Room,
  type Round,
  type Settings,
  type SettingsPatch,
} from '../shared';
import { MAP_SPOTS } from './content/maps';

export interface Ctx {
  now: number;
  rng: () => number;
}

export class GameError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const fail = (code: ErrorCode, message: string): never => {
  throw new GameError(code, message);
};

export const DEFAULT_SETTINGS: Settings = {
  rounds: 6,
  hideSec: 45,
  seekSec: 60,
  shots: 5,
  map: 'random',
  taunts: true,
  sneaks: 2,
  firstHider: 'random',
};

const pick = <T>(arr: readonly T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)]!;

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const ID_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';
function newId(rng: () => number, taken: Set<string>): string {
  let id: string;
  do id = Array.from({ length: 6 }, () => pick(ID_CHARS.split(''), rng)).join('');
  while (taken.has(id));
  taken.add(id);
  return id;
}

export function cleanText(s: string): string {
  return s
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Keeps a placement on the map, rotation on the 15° grid, and size in range. */
export function normalizePlacement(type: PropType, p: Placement): Placement {
  const def = PROP_TYPES[type];
  const half = Math.max(def.w, def.h) / 2;
  const rot = ((Math.round(p.rot / ROTATE_STEP) * ROTATE_STEP) % 360 + 360) % 360;
  const scale = Math.round(clamp(p.scale, SCALE_RANGE.min, SCALE_RANGE.max) * 100) / 100;
  return {
    x: Math.round(clamp(p.x, half / 2, WORLD.w - half / 2)),
    y: Math.round(clamp(p.y, half / 2, WORLD.h - half / 2)),
    rot,
    scale,
  };
}

// ---------- room setup ----------

export function newRoom(code: string, ctx: Ctx): Room {
  return {
    code,
    createdAt: ctx.now,
    lastActivityAt: ctx.now,
    players: [],
    settings: { ...DEFAULT_SETTINGS },
    phase: 'LOBBY',
    rounds: [],
    firstHider: 0,
    scores: {},
    startedAt: 0,
    deadline: null,
    taunt: null,
    nextTauntAt: null,
    readyForNext: [],
  };
}

export function addPlayer(room: Room, p: { id: string; token: string; name: string }): Player {
  if (room.players.length >= 2) fail('ROOM_FULL', 'This room is taken 💔');
  if (room.phase !== 'LOBBY') fail('GAME_IN_PROGRESS', 'A game is already going in this room');
  const name = cleanText(p.name).slice(0, LIMITS.nameMax);
  if (name.length < LIMITS.nameMin) fail('TOO_SHORT', 'Pick a name first');
  const player: Player = { ...p, name, connected: true, isHost: room.players.length === 0 };
  room.players.push(player);
  return player;
}

export function removePlayer(room: Room, playerId: string): void {
  const idx = room.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return;
  room.players.splice(idx, 1);
  if (room.players[0]) room.players[0].isHost = true;
  if (room.phase !== 'LOBBY') resetToLobby(room);
}

function resetToLobby(room: Room): void {
  room.phase = 'LOBBY';
  room.rounds = [];
  room.scores = {};
  room.deadline = null;
  room.taunt = null;
  room.nextTauntAt = null;
  room.readyForNext = [];
}

function requirePlayer(room: Room, playerId: string): Player {
  return room.players.find((p) => p.id === playerId) ?? fail('NOT_IN_ROOM', 'You are not in this room');
}

function requirePhase(room: Room, ...phases: Room['phase'][]): void {
  if (!phases.includes(room.phase)) fail('WRONG_PHASE', 'Not right now!');
}

export const currentRound = (room: Room): Round | undefined => room.rounds[room.rounds.length - 1];

// ---------- lobby ----------

export function updateSettings(room: Room, playerId: string, patch: SettingsPatch): void {
  requirePhase(room, 'LOBBY');
  if (!requirePlayer(room, playerId).isHost) fail('NOT_HOST', 'Only the host can change settings');
  room.settings = { ...room.settings, ...patch } as Settings;
}

export function startGame(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'LOBBY');
  if (!requirePlayer(room, playerId).isHost) fail('NOT_HOST', 'Only the host can start');
  if (room.players.length !== 2 || room.players.some((p) => !p.connected)) {
    fail('NEED_TWO_PLAYERS', 'You need your partner here first 💞');
  }
  room.rounds = [];
  room.scores = Object.fromEntries(room.players.map((p) => [p.id, 0]));
  // Coin flip for who hides first; after that roles alternate.
  const hostSeat = Math.max(0, room.players.findIndex((p) => p.isHost)) as 0 | 1;
  const pick = room.settings.firstHider ?? 'random';
  room.firstHider = pick === 'host' ? hostSeat : pick === 'guest' ? ((1 - hostSeat) as 0 | 1) : ctx.rng() < 0.5 ? 0 : 1;
  enterHide(room, ctx);
}

// ---------- layouts ----------

/** Fills the map's spots for one round. Returns the real props (no hider yet). */
export function buildLayout(map: MapId, rng: () => number, ids: Set<string>): { props: Prop[]; emptySpots: { x: number; y: number }[] } {
  const props: Prop[] = [];
  const emptySpots: { x: number; y: number }[] = [];
  for (const spot of MAP_SPOTS[map]) {
    if (rng() >= (spot.fill ?? 0.8)) {
      emptySpots.push({ x: spot.x, y: spot.y });
      continue;
    }
    const type = pick(spot.types, rng);
    const def = PROP_TYPES[type];
    const jitter = def.hideable ? 12 : 4;
    const rot = spot.rot ?? (def.hideable ? pick([-30, -15, 0, 0, 15, 30], rng) : 0);
    const scale = def.hideable ? pick([0.9, 0.95, 1, 1, 1.05, 1.1], rng) : 1;
    const placed = normalizePlacement(type, {
      x: spot.x + (rng() * 2 - 1) * jitter,
      y: spot.y + (rng() * 2 - 1) * jitter,
      rot,
      scale,
    });
    props.push({ id: newId(rng, ids), type, ...placed });
  }
  return { props, emptySpots };
}

function nextMap(room: Room, rng: () => number): MapId {
  if (room.settings.map !== 'random') return room.settings.map;
  const last = currentRound(room)?.map;
  return pick(
    MAP_IDS.filter((m) => m !== last),
    rng,
  );
}

function enterHide(room: Room, ctx: Ctx): void {
  const n = room.rounds.length + 1;
  const hider = room.players[(n - 1 + room.firstHider) % 2]!;
  const hunter = room.players[(n + room.firstHider) % 2]!;
  const map = nextMap(room, ctx.rng);
  const ids = new Set<string>();
  const { props, emptySpots } = buildLayout(map, ctx.rng, ids);

  // The 3 choices come from hideable things already in this room, so real twins exist.
  const present = [...new Set(props.map((p) => p.type).filter((t) => PROP_TYPES[t].hideable))];
  const fallback = [...new Set(MAP_SPOTS[map].flatMap((s) => s.types).filter((t) => PROP_TYPES[t].hideable))];
  const pool = present.length >= 3 ? present : [...new Set([...present, ...fallback])];
  const choices = shuffle(pool, ctx.rng).slice(0, 3);

  const start = emptySpots.length ? pick(emptySpots, ctx.rng) : { x: WORLD.w / 2, y: WORLD.h / 2 };
  const hiderType = choices[0]!;
  room.rounds.push({
    n,
    map,
    hiderId: hider.id,
    hunterId: hunter.id,
    choices,
    hiderType,
    hider: normalizePlacement(hiderType, { ...start, rot: 0, scale: 1 }),
    hiderPropId: newId(ctx.rng, ids),
    props,
    shots: [],
    sneaksLeft: room.settings.sneaks,
    result: null,
    points: {},
  });
  room.phase = 'HIDE';
  room.readyForNext = [];
  room.startedAt = ctx.now;
  room.deadline = ctx.now + room.settings.hideSec * 1000;
  room.taunt = null;
  room.nextTauntAt = null;
}

// ---------- HIDE ----------

function requireRole(round: Round, playerId: string, role: 'hider' | 'hunter'): void {
  const id = role === 'hider' ? round.hiderId : round.hunterId;
  if (id !== playerId) fail('NOT_YOUR_ROLE', role === 'hider' ? "You're the hunter this round 🔫" : "You're hiding this round 🙈");
}

export function pickObject(room: Room, playerId: string, type: string): void {
  requirePhase(room, 'HIDE');
  const round = currentRound(room)!;
  requireRole(round, playerId, 'hider');
  if (!round.choices.includes(type as PropType)) fail('BAD_INPUT', 'That object is not one of your choices');
  round.hiderType = type as PropType;
  round.hider = normalizePlacement(round.hiderType, round.hider);
}

export function place(room: Room, playerId: string, p: Placement): void {
  requirePhase(room, 'HIDE');
  const round = currentRound(room)!;
  requireRole(round, playerId, 'hider');
  round.hider = normalizePlacement(round.hiderType, p);
}

export function hideReady(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'HIDE');
  requireRole(currentRound(room)!, playerId, 'hider');
  enterSeek(room, ctx);
}

// ---------- SEEK ----------

function enterSeek(room: Room, ctx: Ctx): void {
  room.phase = 'SEEK';
  room.startedAt = ctx.now;
  room.deadline = ctx.now + room.settings.seekSec * 1000;
  room.taunt = null;
  room.nextTauntAt = room.settings.taunts ? ctx.now + TIMING.tauntEveryMs : null;
}

/** All props in the room this round, the hider's fake included (looks the same). */
export function allProps(round: Round): Prop[] {
  return [...round.props, { id: round.hiderPropId, type: round.hiderType, ...round.hider }];
}

export const shotsLeft = (room: Room, round: Round) => room.settings.shots - round.shots.length;

export function shoot(room: Room, playerId: string, propId: string, ctx: Ctx): boolean {
  requirePhase(room, 'SEEK');
  const round = currentRound(room)!;
  requireRole(round, playerId, 'hunter');
  if (shotsLeft(room, round) <= 0) fail('NO_SHOTS', 'Out of shots!');
  if (round.shots.some((s) => s.propId === propId)) fail('ALREADY_SHOT', 'You already shot that one');
  const target = allProps(round).find((p) => p.id === propId) ?? fail('BAD_INPUT', 'Nothing there');
  const hit = propId === round.hiderPropId;
  round.shots.push({ propId, x: target.x, y: target.y, hit, at: ctx.now });
  if (hit) endRound(room, 'found');
  else if (shotsLeft(room, round) <= 0) endRound(room, 'survived');
  return hit;
}

export function sneak(room: Room, playerId: string, x: number, y: number): void {
  requirePhase(room, 'SEEK');
  const round = currentRound(room)!;
  requireRole(round, playerId, 'hider');
  if (round.sneaksLeft <= 0) fail('NO_SNEAKS', 'No sneak moves left — stay very still 🫣');
  round.sneaksLeft -= 1;
  round.hider = normalizePlacement(round.hiderType, { ...round.hider, x, y });
}

// ---------- end of round ----------

export function scoreRound(room: Room, round: Round): Record<string, number> {
  const misses = round.shots.filter((s) => !s.hit).length;
  const hiderPts = misses * POINTS.perMiss + (round.result === 'survived' ? POINTS.survived : 0);
  const hunterPts = round.result === 'found' ? POINTS.found + POINTS.perUnusedShot * shotsLeft(room, round) : 0;
  return { [round.hiderId]: hiderPts, [round.hunterId]: hunterPts };
}

function endRound(room: Room, result: 'found' | 'survived'): void {
  const round = currentRound(room)!;
  round.result = result;
  round.points = scoreRound(room, round);
  for (const [id, pts] of Object.entries(round.points)) room.scores[id] = (room.scores[id] ?? 0) + pts;
  room.phase = 'REVEAL';
  room.deadline = null;
  room.taunt = null;
  room.nextTauntAt = null;
}

export function readyForNext(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'REVEAL');
  requirePlayer(room, playerId);
  if (!room.readyForNext.includes(playerId)) room.readyForNext.push(playerId);
  if (!room.players.every((p) => room.readyForNext.includes(p.id))) return;
  if (room.rounds.length >= room.settings.rounds) {
    room.phase = 'RECAP';
    room.readyForNext = [];
  } else enterHide(room, ctx);
}

export function rematch(room: Room, playerId: string): void {
  requirePhase(room, 'RECAP');
  requirePlayer(room, playerId);
  resetToLobby(room);
}

// ---------- timers ----------

/** Earliest moment the server needs to act: phase end, next taunt, or the end of a taunt. */
export function wakeAt(room: Room): number | null {
  if (room.deadline === null) return null;
  const times = [room.deadline + TIMING.graceMs];
  if (room.phase === 'SEEK') {
    if (room.nextTauntAt !== null && room.nextTauntAt < room.deadline) times.push(room.nextTauntAt);
    if (room.taunt) times.push(room.taunt.until);
  }
  return Math.min(...times);
}

/** Handles whatever is due at `now`. Returns true if clients need a new state. */
export function tick(room: Room, ctx: Ctx): boolean {
  if (room.deadline === null) return false;
  let changed = false;
  if (room.phase === 'HIDE' && ctx.now >= room.deadline + TIMING.graceMs) {
    enterSeek(room, ctx);
    return true;
  }
  if (room.phase !== 'SEEK') return false;
  if (ctx.now >= room.deadline + TIMING.graceMs) {
    endRound(room, 'survived');
    return true;
  }
  if (room.taunt && ctx.now >= room.taunt.until) {
    room.taunt = null;
    changed = true;
  }
  if (room.nextTauntAt !== null && ctx.now >= room.nextTauntAt) {
    room.taunt = { propId: currentRound(room)!.hiderPropId, until: ctx.now + TIMING.tauntLengthMs };
    room.nextTauntAt += TIMING.tauntEveryMs;
    changed = true;
  }
  return changed;
}
