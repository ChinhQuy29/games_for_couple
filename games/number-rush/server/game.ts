// Number Rush — the rules. Pure functions: time and randomness come in through ctx.
//
// Every number is on the board; both players hunt for the same target. The first
// correct click starts a short "photo finish": the other player's correct click can
// still win it if their own device measured a faster reaction. That keeps it fair
// when one of you has a slower connection.

import { fail, pick, requireHost, requirePhase, requirePlayer, requireTwo, shuffle, type Ctx } from '@gfc/kit/server';
import { TIMING, WORLD, type Cell, type Room, type Settings } from '../shared';

export const DEFAULT_SETTINGS: Settings = { count: 100, order: 'asc', style: 'chaos' };

const COLORS = ['#2b2140', '#ff4f8b', '#4cc9f0', '#3ddc97', '#ff9f43', '#9b5de5', '#e0a91f'];

export function newRoom(code: string, ctx: Ctx): Room {
  return {
    code,
    createdAt: ctx.now,
    lastActivityAt: ctx.now,
    players: [],
    phase: 'LOBBY',
    settings: { ...DEFAULT_SETTINGS },
    board: [],
    sequence: [],
    index: 0,
    startsAt: 0,
    targetSince: 0,
    finds: [],
    scores: {},
    lockedUntil: {},
    pending: null,
  };
}

export function resetToLobby(room: Room): void {
  room.phase = 'LOBBY';
  room.board = [];
  room.sequence = [];
  room.index = 0;
  room.finds = [];
  room.scores = {};
  room.lockedUntil = {};
  room.pending = null;
}

export function updateSettings(room: Room, playerId: string, patch: Partial<Settings>): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  room.settings = { ...room.settings, ...patch };
}

/** Scatters 1..count on a jittered grid so numbers never overlap. */
export function buildBoard(count: number, style: Settings['style'], rng: () => number): Cell[] {
  const cols = Math.ceil(Math.sqrt(count * (WORLD.w / WORLD.h)));
  const rows = Math.ceil(count / cols);
  const cw = WORLD.w / cols;
  const ch = WORLD.h / rows;
  const cells = shuffle(
    Array.from({ length: cols * rows }, (_, i) => i),
    rng,
  ).slice(0, count);
  const base = Math.min(cw, ch);
  return cells.map((cell, i) => {
    const chaos = style === 'chaos';
    const size = Math.round(base * (chaos ? 0.32 + rng() * 0.3 : 0.42));
    const jx = (cw - size * 1.2) / 2;
    const jy = (ch - size) / 2;
    return {
      n: i + 1,
      x: Math.round((cell % cols) * cw + cw / 2 + (rng() * 2 - 1) * Math.max(0, jx) * 0.8),
      y: Math.round(Math.floor(cell / cols) * ch + ch / 2 + (rng() * 2 - 1) * Math.max(0, jy) * 0.8),
      size,
      rot: chaos ? Math.round((rng() * 2 - 1) * 35) : 0,
      color: chaos ? pick(COLORS, rng) : COLORS[0]!,
    };
  });
}

export function buildSequence(count: number, order: Settings['order'], rng: () => number): number[] {
  const asc = Array.from({ length: count }, (_, i) => i + 1);
  if (order === 'asc') return asc;
  if (order === 'desc') return asc.reverse();
  return shuffle(asc, rng);
}

export function startGame(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  requireTwo(room);
  const { count, order, style } = room.settings;
  room.board = buildBoard(count, style, ctx.rng);
  room.sequence = buildSequence(count, order, ctx.rng);
  room.index = 0;
  room.finds = [];
  room.scores = Object.fromEntries(room.players.map((p) => [p.id, 0]));
  room.lockedUntil = {};
  room.pending = null;
  room.phase = 'PLAY';
  room.startsAt = ctx.now + TIMING.countdownMs;
  room.targetSince = room.startsAt;
}

export const currentTarget = (room: Room): number | null => (room.phase === 'PLAY' ? (room.sequence[room.index] ?? null) : null);

/**
 * A click on number `n`. `ms` is the reaction time the player's device measured since
 * the current target appeared. Returns 'wrong' | 'claimed' | 'late'.
 */
export function pickNumber(room: Room, playerId: string, n: number, ms: number, ctx: Ctx): 'wrong' | 'claimed' | 'late' {
  requirePhase(room, 'PLAY');
  requirePlayer(room, playerId);
  if (ctx.now < room.startsAt) fail('TOO_EARLY', 'Wait for the countdown!');
  if ((room.lockedUntil[playerId] ?? 0) > ctx.now) fail('LOCKED', 'Locked for a moment after a wrong click 🔒');
  const target = currentTarget(room);
  if (target === null) fail('WRONG_PHASE', 'Not right now!');

  if (n !== target) {
    // Clicking a number that's already found is harmless; any other wrong number locks you briefly.
    if (room.finds.some((f) => f.n === n)) return 'late';
    room.lockedUntil[playerId] = ctx.now + TIMING.lockMs;
    return 'wrong';
  }

  // Trust the device's timing, within a lag window of what the server actually saw.
  const serverMs = ctx.now - room.targetSince;
  const fair = Math.max(0, Math.min(Math.max(ms, serverMs - TIMING.maxLagMs), serverMs + 1500));

  if (!room.pending) room.pending = { n, claims: [], closesAt: ctx.now + TIMING.photoFinishMs };
  if (!room.pending.claims.some((c) => c.playerId === playerId)) room.pending.claims.push({ playerId, ms: fair });
  if (room.pending.claims.length >= room.players.length) resolve(room, ctx);
  return 'claimed';
}

/** Awards the pending number to the fastest claim and moves to the next target. */
function resolve(room: Room, ctx: Ctx): void {
  const p = room.pending;
  if (!p) return;
  const best = [...p.claims].sort((a, b) => a.ms - b.ms)[0]!;
  room.finds.push({ n: p.n, by: best.playerId, ms: best.ms });
  room.scores[best.playerId] = (room.scores[best.playerId] ?? 0) + 1;
  room.pending = null;
  room.index += 1;
  room.targetSince = ctx.now;
  if (room.index >= room.sequence.length) room.phase = 'RECAP';
}

export function rematch(room: Room, playerId: string): void {
  requirePhase(room, 'RECAP');
  requirePlayer(room, playerId);
  resetToLobby(room);
}

export const wakeAt = (room: Room): number | null => room.pending?.closesAt ?? null;

export function tick(room: Room, ctx: Ctx): boolean {
  if (room.pending && ctx.now >= room.pending.closesAt) {
    resolve(room, ctx);
    return true;
  }
  return false;
}
