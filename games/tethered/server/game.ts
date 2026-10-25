// Tethered — the rules. The physics lives in shared/physics.ts; this file runs the climb:
// two bodies, one chain, moving and crumbling platforms, checkpoints, falls and the summit.
// Pure: time comes in through ctx, and the simulation uses a fixed step.

import { requireHost, requirePhase, requirePlayer, requireTwo, type Ctx } from '@gfc/kit/server';
import {
  CHAIN_LENGTH,
  CHECKPOINTS,
  COUNTDOWN_MS,
  CRUMBLE,
  FALL_ROWS,
  HZ,
  LW,
  MOVERS,
  NO_INPUT,
  PHYS,
  SUMMIT,
  applyChain,
  center,
  moveBody,
  moverAt,
  newBody,
  stepBody,
  tile,
  type Body,
  type Frame,
  type Input,
  type Room,
  type World,
} from '../shared';

export function newRoom(code: string, ctx: Ctx): Room {
  return {
    code,
    createdAt: ctx.now,
    lastActivityAt: ctx.now,
    players: [],
    phase: 'LOBBY',
    bodies: [],
    inputs: {},
    checkpoint: 0,
    falls: 0,
    pulls: 0,
    steps: 0,
    startsAt: 0,
    crumbles: {},
    lastFallAt: 0,
    results: [],
    readyForNext: [],
  };
}

export function resetToLobby(room: Room): void {
  room.phase = 'LOBBY';
  room.bodies = [];
  room.inputs = {};
  room.readyForNext = [];
}

function spawnAt(room: Room, cp: number) {
  const c = CHECKPOINTS[cp]!;
  room.bodies = [newBody(c.x, c.y), newBody(c.x + 1, c.y)];
  room.bodies[1]!.facing = -1;
  for (const id of Object.keys(room.inputs)) room.inputs[id] = { ...NO_INPUT };
}

function beginClimb(room: Room, ctx: Ctx) {
  room.phase = 'CLIMB';
  room.checkpoint = 0;
  room.falls = 0;
  room.pulls = 0;
  room.steps = 0;
  room.crumbles = {};
  room.lastFallAt = 0;
  room.inputs = Object.fromEntries(room.players.map((p) => [p.id, { ...NO_INPUT }]));
  room.startsAt = ctx.now + COUNTDOWN_MS;
  room.readyForNext = [];
  spawnAt(room, 0);
}

export function startGame(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  requireTwo(room);
  room.results = [];
  beginClimb(room, ctx);
}

export function readyForNext(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'SUMMIT');
  requirePlayer(room, playerId);
  if (!room.readyForNext.includes(playerId)) room.readyForNext.push(playerId);
  if (room.readyForNext.length < 2) return;
  requireTwo(room);
  beginClimb(room, ctx);
}

export function toLobby(room: Room, playerId: string): void {
  requirePhase(room, 'SUMMIT');
  requireHost(room, playerId);
  resetToLobby(room);
}

/** Held keys. Quiet: no full broadcast; the next frame shows the result. */
export function setInput(room: Room, playerId: string, input: Input): void {
  if (room.phase !== 'CLIMB') return;
  requirePlayer(room, playerId);
  room.inputs[playerId] = input;
}

export const simTime = (room: Room) => room.steps / HZ;

/** Tiles gone right now (crumbled and not back yet). */
function isGone(room: Room, tx: number, ty: number, t: number): boolean {
  const c = room.crumbles[ty * LW + tx];
  return !!c && c.goneUntil !== null && t < c.goneUntil;
}

export function worldAt(room: Room, t = simTime(room)): World {
  return {
    solid: (tx, ty) => {
      const ch = tile(tx, ty);
      return ch === '#' || (ch === 'x' && !isGone(room, tx, ty, t));
    },
    oneWay: (tx, ty) => tile(tx, ty) === '-',
    platforms: MOVERS.map((_, i) => moverAt(i, t)),
  };
}

function fall(room: Room, ctx: Ctx) {
  room.falls += 1;
  room.lastFallAt = ctx.now;
  spawnAt(room, room.checkpoint);
}

/** One 1/30 s step. Returns true when the full state should be rebroadcast. */
export function step(room: Room, ctx: Ctx): boolean {
  if (room.phase !== 'CLIMB' || ctx.now < room.startsAt) return false;
  const t0 = simTime(room);
  room.steps += 1;
  const t = simTime(room);
  const world = worldAt(room, t);

  // Moving platforms carry whoever stands on them.
  for (const b of room.bodies) {
    if (b.riding < 0) continue;
    const before = moverAt(b.riding, t0);
    const after = world.platforms[b.riding]!;
    moveBody(b, after.x - before.x, 0, world);
    b.y = after.y - PHYS.h;
  }

  room.players.forEach((p, i) => {
    const b = room.bodies[i];
    if (b) stepBody(b, room.inputs[p.id] ?? NO_INPUT, world);
  });
  const [a, b] = room.bodies as [Body, Body];
  if (applyChain(a, b, CHAIN_LENGTH, world) && Math.hypot(a.vy, b.vy) > 12) room.pulls += 1;

  // Crumbling: standing on an 'x' starts it; it vanishes after a moment and comes back later.
  for (const body of room.bodies) {
    const row = Math.floor(body.y + PHYS.h + 0.02);
    if (Math.abs(body.y + PHYS.h - row) > 0.03) continue;
    for (let tx = Math.floor(body.x); tx <= Math.floor(body.x + PHYS.w - 1e-4); tx++) {
      if (tile(tx, row) !== 'x') continue;
      const key = row * LW + tx;
      const c = room.crumbles[key];
      if (!c || (c.goneUntil !== null && t >= c.goneUntil)) room.crumbles[key] = { since: t, goneUntil: null };
    }
  }
  for (const c of Object.values(room.crumbles)) if (c.goneUntil === null && t - c.since >= CRUMBLE.delayS) c.goneUntil = t + CRUMBLE.goneS;

  // Checkpoints, spikes, falls, the summit.
  let changed = false;
  for (const body of room.bodies) {
    const [cx, cy] = center(body);
    if (tile(Math.floor(cx), Math.floor(cy)) === '^' || tile(Math.floor(cx), Math.floor(body.y + PHYS.h - 0.05)) === '^') {
      fall(room, ctx);
      return true;
    }
    for (let k = room.checkpoint + 1; k < CHECKPOINTS.length; k++) {
      const c = CHECKPOINTS[k]!;
      if (Math.abs(cx - (c.flagX + 0.5)) < 1.6 && Math.abs(cy - (c.flagY + 0.5)) < 1.2) {
        room.checkpoint = k;
        changed = true;
      }
    }
    if (Math.abs(cx - (SUMMIT.x + 0.5)) < 1.2 && Math.abs(cy - (SUMMIT.y + 0.5)) < 1.2) {
      room.phase = 'SUMMIT';
      room.results.push({ n: room.results.length + 1, ms: Math.round(t * 1000), falls: room.falls, pulls: room.pulls });
      room.readyForNext = [];
      return true;
    }
  }
  const floorY = CHECKPOINTS[room.checkpoint]!.y + FALL_ROWS;
  if (room.bodies.every((body) => body.y > floorY) || room.bodies.some((body) => body.y > floorY + 4)) {
    fall(room, ctx);
    return true;
  }
  return changed;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function frame(room: Room): Frame {
  const t = simTime(room);
  return {
    t: r2(t),
    b: room.bodies.map((b) => [r2(b.x), r2(b.y), r2(b.vx), r2(b.vy), (b.grabbing ? 1 : 0) | (b.onGround ? 2 : 0) | (b.facing < 0 ? 4 : 0), Math.round(b.stamina)]),
    gone: Object.entries(room.crumbles)
      .filter(([, c]) => c.goneUntil !== null && t < c.goneUntil)
      .map(([k]) => Number(k)),
    falls: room.falls,
    pulls: room.pulls,
    checkpoint: room.checkpoint,
  };
}
