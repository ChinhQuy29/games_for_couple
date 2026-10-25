// Handle With Care — the rules. Physics comes from shared/physics.ts; this file runs a house:
// two movers, a pile of valuables, a truck. Small things take one pair of hands (and can be
// thrown); big things need both of you. Bumps and falls chip the value; fragile things break.

import { requireHost, requirePhase, requirePlayer, requireTwo, type Ctx } from '@gfc/kit/server';
import {
  BIG_STRETCH,
  COUNTDOWN_MS,
  HEAVY_SPEED,
  HOUSES,
  HZ,
  ITEMS,
  LH,
  LW,
  NO_INPUT,
  PHYS,
  REACH,
  center,
  find,
  inTruck,
  moveBody,
  moverAt,
  newBody,
  standing,
  stepBody,
  type Frame,
  type Item,
  type Room,
  type World,
} from '../shared';

const NOTHING = { left: false, right: false, jump: false, grab: false, throw: false };

export function newRoom(code: string, ctx: Ctx): Room {
  return {
    code,
    createdAt: ctx.now,
    lastActivityAt: ctx.now,
    players: [],
    phase: 'LOBBY',
    startHouse: 0,
    house: 0,
    bodies: [],
    holding: {},
    held: {},
    prevButtons: {},
    items: [],
    earned: 0,
    steps: 0,
    startsAt: 0,
    feed: [],
    nextId: 1,
    results: [],
    readyForNext: [],
  };
}

export function resetToLobby(room: Room): void {
  room.phase = 'LOBBY';
  room.bodies = [];
  room.items = [];
  room.readyForNext = [];
}

function beginHouse(room: Room, index: number, ctx: Ctx) {
  const house = HOUSES[index]!;
  const [sx, sy] = find(house, 'S')!;
  room.phase = 'MOVE';
  room.house = index;
  room.bodies = [newBody(sx, sy + 1 - PHYS.h), newBody(sx + 1.2, sy + 1 - PHYS.h)];
  room.bodies[1]!.facing = -1;
  room.holding = Object.fromEntries(room.players.map((p) => [p.id, null]));
  room.held = Object.fromEntries(room.players.map((p) => [p.id, { ...NOTHING }]));
  room.prevButtons = Object.fromEntries(room.players.map((p) => [p.id, { grab: false, throw: false }]));
  room.items = house.items.map(([kind, x, floor], i) => {
    const k = ITEMS[kind];
    return { id: i, kind, body: newBody(x, floor - k.h, k.w, k.h), hp: 1, holders: [], state: 'house', bumpCooldown: 0 };
  });
  room.earned = 0;
  room.steps = 0;
  room.startsAt = ctx.now + COUNTDOWN_MS;
  room.feed = [];
  room.readyForNext = [];
}

export function setStartHouse(room: Room, playerId: string, startHouse: number): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  room.startHouse = Math.max(0, Math.min(HOUSES.length - 1, startHouse));
}

export function startGame(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  requireTwo(room);
  room.results = [];
  beginHouse(room, room.startHouse ?? 0, ctx);
}

export function readyForNext(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'DONE');
  requirePlayer(room, playerId);
  if (!room.readyForNext.includes(playerId)) room.readyForNext.push(playerId);
  if (room.readyForNext.length < 2) return;
  requireTwo(room);
  if (room.house + 1 >= HOUSES.length) {
    room.phase = 'FINISH';
    room.readyForNext = [];
  } else beginHouse(room, room.house + 1, ctx);
}

export function toLobby(room: Room, playerId: string): void {
  requirePhase(room, 'DONE', 'FINISH');
  requireHost(room, playerId);
  resetToLobby(room);
}

export function setHeld(room: Room, playerId: string, held: Room['held'][string]): void {
  if (room.phase !== 'MOVE') return;
  requirePlayer(room, playerId);
  room.held[playerId] = held;
}

export const simTime = (room: Room) => room.steps / HZ;
export const timeLeft = (room: Room) => Math.max(0, HOUSES[room.house]!.timeS - simTime(room));
export const possible = (room: Room) => room.items.reduce((a, i) => a + ITEMS[i.kind].value, 0);

export function worldAt(room: Room, t = simTime(room)): World {
  const house = HOUSES[room.house]!;
  const tile = (tx: number, ty: number) => (tx < 0 || tx >= LW || ty < 0 ? '#' : ty >= LH ? '#' : house.rows[ty]![tx]!);
  return {
    solid: (tx, ty) => tile(tx, ty) === '#',
    oneWay: (tx, ty) => tile(tx, ty) === '-',
    platforms: house.movers.map((_, i) => moverAt(house, i, t)),
  };
}

function say(room: Room, text: string, good: boolean) {
  room.feed = [...room.feed, { id: room.nextId++, text, good }].slice(-4);
}

const bodyOf = (room: Room, playerId: string) => room.bodies[room.players.findIndex((p) => p.id === playerId)];

function release(room: Room, item: Item) {
  for (const h of item.holders) room.holding[h] = null;
  item.holders = [];
}

function damage(room: Room, item: Item, amount: number, why: string) {
  if (item.state !== 'house' || amount <= 0) return;
  const before = item.hp;
  item.hp = Math.max(0, item.hp - amount * ITEMS[item.kind].fragile);
  if (item.hp <= 0) {
    item.state = 'broken';
    release(room, item);
    say(room, `💔 The ${ITEMS[item.kind].name.toLowerCase()} broke!`, false);
  } else if (before - item.hp >= 0.05) say(room, `${why} −$${Math.round((before - item.hp) * ITEMS[item.kind].value)}`, false);
}

/** Grab the nearest thing in reach, or let go of what you're holding. */
function toggleGrab(room: Room, playerId: string) {
  const mine = room.holding[playerId];
  if (mine !== null && mine !== undefined) {
    const item = room.items.find((i) => i.id === mine)!;
    const b = bodyOf(room, playerId)!;
    item.holders = item.holders.filter((h) => h !== playerId);
    room.holding[playerId] = null;
    if (!ITEMS[item.kind].big) {
      item.body.vx = b.vx * 0.6;
      item.body.vy = 0;
    }
    return;
  }
  const b = bodyOf(room, playerId)!;
  const [bx, by] = center(b);
  let best: Item | null = null;
  let bestD = Infinity;
  for (const item of room.items) {
    if (item.state !== 'house') continue;
    const big = ITEMS[item.kind].big;
    if (item.holders.length >= (big ? 2 : 1)) continue;
    const [ix, iy] = center(item.body);
    // Big things can be grabbed anywhere along their width.
    const dx = Math.max(0, Math.abs(bx - ix) - (big ? item.body.w / 2 : 0));
    const d = Math.hypot(dx, by - iy);
    if (d <= REACH && d < bestD) {
      best = item;
      bestD = d;
    }
  }
  if (!best) return;
  best.holders.push(playerId);
  room.holding[playerId] = best.id;
}

function throwItem(room: Room, playerId: string) {
  const id = room.holding[playerId];
  if (id === null || id === undefined) return;
  const item = room.items.find((i) => i.id === id)!;
  if (ITEMS[item.kind].big) return;
  const b = bodyOf(room, playerId)!;
  release(room, item);
  item.body.vx = b.facing * 9 + b.vx * 0.3;
  item.body.vy = -7;
}

/** Moves a carried item toward where it should be; bumps hurt it, big snags knock it loose. */
function carry(room: Room, item: Item, world: World) {
  const holders = item.holders.map((h) => bodyOf(room, h)!);
  const big = ITEMS[item.kind].big;
  if (big && holders.length < 2) return; // one person can't lift it: it just sits there
  const cx = holders.reduce((a, h) => a + center(h)[0], 0) / holders.length;
  const top = Math.min(...holders.map((h) => h.y));
  const tx = cx - item.body.w / 2;
  const ty = top - item.body.h;
  const speed = Math.max(...holders.map((h) => Math.abs(h.vx)));
  const hit = moveBody(item.body, tx - item.body.x, ty - item.body.y, world);
  item.body.vx = holders[0]!.vx;
  item.body.vy = 0;
  if ((hit.hitX || hit.hitY) && speed > 3 && item.bumpCooldown <= 0) {
    damage(room, item, 0.08, '💥 Bonk!');
    item.bumpCooldown = 0.6;
  }
  const off = Math.hypot(item.body.x - tx, item.body.y - ty);
  const stretched = big && Math.abs(center(holders[0]!)[0] - center(holders[1]!)[0]) > item.body.w + BIG_STRETCH;
  if (off > 1.2 || stretched) {
    release(room, item);
    say(room, stretched ? `😬 You pulled apart and dropped the ${ITEMS[item.kind].name.toLowerCase()}!` : `😬 It got knocked out of your hands!`, false);
  }
}

/** A loose item: gravity, friction, landing damage. */
function fall(room: Room, item: Item, world: World) {
  const b = item.body;
  const grounded = standing(b, world);
  b.vy = Math.min(PHYS.maxFall, b.vy + PHYS.gravity * PHYS.dt);
  b.vx *= grounded ? 0.75 : 0.99;
  if (Math.abs(b.vx) < 0.05) b.vx = 0;
  const vy = b.vy;
  const vx = b.vx;
  b.onGround = false;
  b.riding = -1;
  const hit = moveBody(b, b.vx * PHYS.dt, b.vy * PHYS.dt, world);
  if (hit.hitY) {
    if (vy > 9) damage(room, item, (vy - 9) * 0.05, '💥 Crash!');
    b.vy = 0;
  }
  if (hit.hitX) {
    if (Math.abs(vx) > 6) damage(room, item, 0.06, '💥 Thud!');
    b.vx = 0;
  }
}

function endHouse(room: Room) {
  room.phase = 'DONE';
  for (const p of room.players) room.holding[p.id] = null;
  room.results.push({
    house: room.house,
    earned: room.earned,
    possible: possible(room),
    delivered: room.items.filter((i) => i.state === 'delivered').length,
    broken: room.items.filter((i) => i.state === 'broken').length,
  });
  room.readyForNext = [];
}

/** One 1/30 s step. Returns true when clients need a full new state. */
export function step(room: Room, ctx: Ctx): boolean {
  if (room.phase !== 'MOVE' || ctx.now < room.startsAt) return false;
  const house = HOUSES[room.house]!;
  const t0 = simTime(room);
  room.steps += 1;
  const t = simTime(room);
  const world = worldAt(room, t);
  const before = JSON.stringify([room.holding, room.items.map((i) => [i.state, i.holders.length]), room.nextId]);

  // Movers carry whatever rests on them.
  const all = [...room.bodies, ...room.items.filter((i) => i.state === 'house' && i.holders.length === 0).map((i) => i.body)];
  for (const b of all) {
    if (b.riding < 0) continue;
    const a = moverAt(house, b.riding, t0);
    const z = world.platforms[b.riding]!;
    moveBody(b, z.x - a.x, 0, world);
    b.y = z.y - b.h;
  }

  // Buttons.
  room.players.forEach((p) => {
    const held = room.held[p.id] ?? NOTHING;
    const prev = room.prevButtons[p.id] ?? { grab: false, throw: false };
    if (held.grab && !prev.grab) toggleGrab(room, p.id);
    if (held.throw && !prev.throw) throwItem(room, p.id);
    room.prevButtons[p.id] = { grab: held.grab, throw: held.throw };
  });

  // Players.
  room.players.forEach((p, i) => {
    const b = room.bodies[i];
    if (!b) return;
    const id = room.holding[p.id];
    const item = id === null || id === undefined ? null : room.items.find((x) => x.id === id)!;
    const heavy = !!item && ITEMS[item.kind].big;
    const held = room.held[p.id] ?? NOTHING;
    stepBody(b, { ...NO_INPUT, left: held.left, right: held.right, jump: held.jump }, world, heavy ? { speed: HEAVY_SPEED, canJump: false } : {});
    // Walked away from a big thing you were holding on your own? You let go.
    if (item && heavy && item.holders.length === 1) {
      const dx = Math.abs(center(b)[0] - center(item.body)[0]) - item.body.w / 2;
      if (dx > REACH + 0.5) release(room, item);
    }
  });

  // Items.
  for (const item of room.items) {
    if (item.state !== 'house') continue;
    item.bumpCooldown = Math.max(0, item.bumpCooldown - PHYS.dt);
    if (item.holders.length && (!ITEMS[item.kind].big || item.holders.length === 2)) carry(room, item, world);
    else fall(room, item, world);
    // Delivered: put down (nobody holding it) and resting inside the truck.
    const [cx, cy] = center(item.body);
    if (item.state === 'house' && !item.holders.length && standing(item.body, world) && inTruck(house, cx, cy)) {
      item.state = 'delivered';
      const got = Math.round(ITEMS[item.kind].value * item.hp);
      room.earned += got;
      say(room, `🚚 ${ITEMS[item.kind].name} loaded! +$${got}`, true);
    }
  }

  if (t >= house.timeS || room.items.every((i) => i.state !== 'house')) {
    endHouse(room);
    return true;
  }
  return JSON.stringify([room.holding, room.items.map((i) => [i.state, i.holders.length]), room.nextId]) !== before;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function frame(room: Room): Frame {
  return {
    t: r2(simTime(room)),
    b: room.bodies.map((b, i) => {
      const id = room.players[i] ? room.holding[room.players[i]!.id] : null;
      return [r2(b.x), r2(b.y), (b.onGround ? 2 : 0) | (b.facing < 0 ? 4 : 0) | (id !== null && id !== undefined ? 8 : 0)];
    }),
    i: room.items.filter((i) => i.state === 'house').map((i) => [i.id, r2(i.body.x), r2(i.body.y), Math.round(i.hp * 100)]),
    earned: room.earned,
    left: Math.ceil(timeLeft(room)),
  };
}
