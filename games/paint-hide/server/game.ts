// Paint & Hide — the rules. Pure functions: time and randomness come in through ctx.
//
// The Hider places a chameleon somewhere on a busy scene and paints it to blend in. The
// Seeker then gets 25 seconds and 3 clicks to find it. Roles swap every round.

import { firstPlayer, fail, requireHost, requirePhase, requirePlayer, requireTwo, type Ctx } from '@gfc/kit/server';
import { CLICKS, ROUNDS, SCENE, TIMING, hits, type Placement, type Room } from '../shared';

export function newRoom(code: string, ctx: Ctx): Room {
  return {
    code,
    createdAt: ctx.now,
    lastActivityAt: ctx.now,
    players: [],
    phase: 'LOBBY',
    round: 0,
    hiderId: null,
    seed: 0,
    placement: null,
    paint: null,
    clicks: [],
    hideEndsAt: 0,
    seekStartsAt: 0,
    seekEndsAt: 0,
    found: false,
    scores: {},
    results: [],
    readyForNext: [],
  };
}

export function resetToLobby(room: Room): void {
  room.phase = 'LOBBY';
  room.hiderId = null;
  room.placement = null;
  room.paint = null;
  room.readyForNext = [];
}

function beginRound(room: Room, n: number, hiderId: string, ctx: Ctx) {
  room.phase = 'HIDE';
  room.round = n;
  room.hiderId = hiderId;
  room.seed = Math.floor(ctx.rng() * 2 ** 31);
  room.placement = null;
  room.paint = null;
  room.clicks = [];
  room.found = false;
  room.hideEndsAt = ctx.now + TIMING.hideMs;
  room.seekStartsAt = 0;
  room.seekEndsAt = 0;
  room.readyForNext = [];
}

export function startGame(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  requireTwo(room);
  room.results = [];
  room.scores = Object.fromEntries(room.players.map((p) => [p.id, 0]));
  beginRound(room, 1, firstPlayer(room, ctx.rng).id, ctx);
}

const seeker = (room: Room) => room.players.find((p) => p.id !== room.hiderId)!.id;

function startSeeking(room: Room, now: number) {
  room.phase = 'SEEK';
  room.seekStartsAt = now;
  room.seekEndsAt = now + TIMING.seekMs;
}

/** The Hider is done: where it is and what it looks like. */
export function hide(room: Room, playerId: string, placement: Placement, paint: string, ctx: Ctx): void {
  requirePhase(room, 'HIDE');
  requirePlayer(room, playerId);
  if (playerId !== room.hiderId) fail('NOT_HIDER', "You're seeking this round. No peeking! 🙈");
  room.placement = { x: Math.max(0, Math.min(SCENE.w, placement.x)), y: Math.max(0, Math.min(SCENE.h, placement.y)), rot: placement.rot, flip: placement.flip };
  room.paint = paint;
  startSeeking(room, ctx.now);
}

function reveal(room: Room, found: boolean, now: number) {
  room.phase = 'REVEAL';
  room.found = found;
  const secs = found ? Math.round((now - room.seekStartsAt) / 100) / 10 : null;
  const seekerId = seeker(room);
  // Finding it fast is worth more; staying hidden is worth a flat 150.
  const points = found ? 100 + Math.max(0, Math.ceil((room.seekEndsAt - now) / 1000) * 4) : 150;
  const to = found ? seekerId : room.hiderId!;
  room.scores[to] = (room.scores[to] ?? 0) + points;
  room.results.push({ n: room.round, hiderId: room.hiderId!, found, secs, points, pointsTo: to });
  room.readyForNext = [];
}

export function click(room: Room, playerId: string, x: number, y: number, ctx: Ctx): boolean {
  requirePhase(room, 'SEEK');
  requirePlayer(room, playerId);
  if (playerId === room.hiderId) fail('NOT_SEEKER', "You're the one hiding! 🦎");
  if (room.clicks.length >= CLICKS) fail('NO_CLICKS', 'Out of guesses');
  const hit = hits(room.placement!, x, y);
  room.clicks.push({ x, y, hit });
  if (hit) reveal(room, true, ctx.now);
  else if (room.clicks.length >= CLICKS) reveal(room, false, ctx.now);
  return hit;
}

export function readyForNext(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'REVEAL');
  requirePlayer(room, playerId);
  if (!room.readyForNext.includes(playerId)) room.readyForNext.push(playerId);
  if (room.readyForNext.length < 2) return;
  requireTwo(room);
  if (room.round >= ROUNDS) {
    room.phase = 'FINISH';
    room.readyForNext = [];
    return;
  }
  beginRound(room, room.round + 1, seeker(room), ctx);
}

export function toLobby(room: Room, playerId: string): void {
  requirePhase(room, 'REVEAL', 'FINISH');
  requireHost(room, playerId);
  resetToLobby(room);
}

export function wakeAt(room: Room): number | null {
  if (room.phase === 'HIDE') return room.hideEndsAt + TIMING.graceMs;
  if (room.phase === 'SEEK') return room.seekEndsAt;
  return null;
}

/** The hider's client auto-submits at the deadline; if it never arrives, hide it unpainted. */
export function tick(room: Room, ctx: Ctx): boolean {
  if (room.phase === 'HIDE' && ctx.now >= room.hideEndsAt + TIMING.graceMs) {
    room.placement = { x: SCENE.w * (0.2 + ctx.rng() * 0.6), y: SCENE.h * (0.2 + ctx.rng() * 0.6), rot: 0, flip: false };
    room.paint = null;
    startSeeking(room, ctx.now);
    return true;
  }
  if (room.phase === 'SEEK' && ctx.now >= room.seekEndsAt) {
    reveal(room, false, ctx.now);
    return true;
  }
  return false;
}
