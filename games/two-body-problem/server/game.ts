// Two-Body Problem — the rules. One character, two players: the Walker owns left/right,
// the Jumper owns jump. Swap pads trade the jobs. The physics is shared/physics.ts (copied
// from Tethered); this file runs the levels at 30 Hz with a fixed step.

import { firstSeat, requireHost, requirePhase, requirePlayer, requireTwo, type Ctx } from '@gfc/kit/server';
import {
  COUNTDOWN_MS,
  GATE_OPEN_S,
  HZ,
  LEVELS,
  LH,
  LW,
  PHYS,
  find,
  moveBody,
  moverAt,
  newBody,
  stepBody,
  type Frame,
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
    startLevel: 0,
    firstWalker: 0,
    level: 0,
    body: newBody(2, 15),
    walkerId: null,
    held: {},
    hasKey: false,
    gateUntil: 0,
    onSwapPad: false,
    deaths: 0,
    swaps: 0,
    steps: 0,
    startsAt: 0,
    lastDeathAt: 0,
    results: [],
    readyForNext: [],
  };
}

export function resetToLobby(room: Room): void {
  room.phase = 'LOBBY';
  room.walkerId = null;
  room.held = {};
  room.readyForNext = [];
}

export function setStartLevel(room: Room, playerId: string, startLevel: number): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  room.startLevel = startLevel;
}

const startPos = (level: number) => {
  const [x, y] = find(LEVELS[level]!, 'S')!;
  return newBody(x + 0.15, y + 1 - PHYS.h);
};

function respawn(room: Room) {
  room.body = startPos(room.level);
  room.hasKey = false;
  room.gateUntil = 0;
  room.onSwapPad = false;
}

function beginLevel(room: Room, level: number, ctx: Ctx) {
  room.phase = 'PLAY';
  room.level = level;
  // Alternate who walks first each level, so nobody is stuck jumping forever.
  room.walkerId = room.players[(room.firstWalker + level - room.startLevel) % 2]?.id ?? room.players[0]!.id;
  room.held = Object.fromEntries(room.players.map((p) => [p.id, { left: false, right: false, jump: false }]));
  room.deaths = 0;
  room.swaps = 0;
  room.steps = 0;
  room.startsAt = ctx.now + COUNTDOWN_MS;
  room.lastDeathAt = 0;
  room.readyForNext = [];
  respawn(room);
}

export function startGame(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  requireTwo(room);
  room.results = [];
  room.firstWalker = firstSeat(room, ctx.rng);
  beginLevel(room, room.startLevel, ctx);
}

/** Both pressed "next": go to the next level (or the finish screen). */
export function readyForNext(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'CLEAR');
  requirePlayer(room, playerId);
  if (!room.readyForNext.includes(playerId)) room.readyForNext.push(playerId);
  if (room.readyForNext.length < 2) return;
  requireTwo(room);
  if (room.level + 1 >= LEVELS.length) {
    room.phase = 'FINISH';
    room.readyForNext = [];
  } else beginLevel(room, room.level + 1, ctx);
}

export function retry(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'PLAY');
  requirePlayer(room, playerId);
  room.deaths += 1;
  room.lastDeathAt = ctx.now;
  respawn(room);
}

export function toLobby(room: Room, playerId: string): void {
  requirePhase(room, 'CLEAR', 'FINISH');
  requireHost(room, playerId);
  resetToLobby(room);
}

export function setHeld(room: Room, playerId: string, held: { left: boolean; right: boolean; jump: boolean }): void {
  if (room.phase !== 'PLAY') return;
  requirePlayer(room, playerId);
  room.held[playerId] = held;
}

/** The controls the body actually gets: left/right from the Walker, jump from the Jumper. */
export function combinedInput(room: Room) {
  const walker = room.held[room.walkerId ?? ''];
  const jumperId = room.players.find((p) => p.id !== room.walkerId)?.id ?? '';
  const jumper = room.held[jumperId];
  return { left: !!walker?.left, right: !!walker?.right, jump: !!jumper?.jump, grab: false };
}

export const simTime = (room: Room) => room.steps / HZ;

export function worldAt(room: Room, t = simTime(room)): World {
  const level = LEVELS[room.level]!;
  const tileAt = (tx: number, ty: number) => (tx < 0 || tx >= LW || ty < 0 ? '#' : ty >= LH ? ' ' : level.rows[ty]![tx]!);
  return {
    solid: (tx, ty) => {
      const ch = tileAt(tx, ty);
      return ch === '#' || (ch === 'D' && !room.hasKey) || (ch === 'H' && t >= room.gateUntil);
    },
    oneWay: (tx, ty) => tileAt(tx, ty) === '-',
    platforms: level.movers.map((_, i) => moverAt(level, i, t)),
  };
}

/** The marker tiles the body overlaps. */
function touching(room: Room): Set<string> {
  const level = LEVELS[room.level]!;
  const b = room.body;
  const out = new Set<string>();
  for (let ty = Math.floor(b.y); ty <= Math.floor(b.y + PHYS.h - 1e-4); ty++)
    for (let tx = Math.floor(b.x); tx <= Math.floor(b.x + PHYS.w - 1e-4); tx++) {
      const ch = level.rows[ty]?.[tx];
      if (ch) out.add(ch);
    }
  return out;
}

/** One 1/30 s step. Returns true when clients need a full new state. */
export function step(room: Room, ctx: Ctx): boolean {
  if (room.phase !== 'PLAY' || ctx.now < room.startsAt) return false;
  const level = LEVELS[room.level]!;
  const t0 = simTime(room);
  room.steps += 1;
  const t = simTime(room);
  const world = worldAt(room, t);
  const b = room.body;

  if (b.riding >= 0) {
    const before = moverAt(level, b.riding, t0);
    const after = world.platforms[b.riding]!;
    moveBody(b, after.x - before.x, 0, world);
    b.y = after.y - PHYS.h;
  }
  stepBody(b, combinedInput(room), world);

  const on = touching(room);
  if (on.has('^') || b.y > LH) {
    room.deaths += 1;
    room.lastDeathAt = ctx.now;
    respawn(room);
    return true;
  }
  let changed = false;
  if (on.has('K') && !room.hasKey) {
    room.hasKey = true;
    changed = true;
  }
  if (on.has('B')) room.gateUntil = t + GATE_OPEN_S;
  const onPad = on.has('~');
  if (onPad && !room.onSwapPad) {
    room.walkerId = room.players.find((p) => p.id !== room.walkerId)?.id ?? room.walkerId;
    room.swaps += 1;
    changed = true;
  }
  room.onSwapPad = onPad;
  if (on.has('G')) {
    room.phase = 'CLEAR';
    room.results.push({ level: room.level, ms: Math.round(t * 1000), deaths: room.deaths, swaps: room.swaps });
    room.readyForNext = [];
    return true;
  }
  return changed;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function frame(room: Room): Frame {
  const t = simTime(room);
  const b = room.body;
  return {
    t: r2(t),
    b: [r2(b.x), r2(b.y), r2(b.vx), r2(b.vy), (b.onGround ? 2 : 0) | (b.facing < 0 ? 4 : 0)],
    key: room.hasKey,
    gate: r2(Math.max(0, room.gateUntil - t)),
    walker: room.walkerId,
    deaths: room.deaths,
  };
}
