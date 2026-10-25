// Road Trip — the rules. Pure functions: time and randomness come in through ctx.
//
// The Driver steers; the Co-pilot works the pedals and holds the only map (which town to
// follow at each fork). Cows, potholes, rocks and mud are in the way, fuel runs low, and a
// wrong turn means a U-turn. Simulated at 30 Hz with a fixed step.

import { firstPlayer, requireHost, requirePhase, requirePlayer, requireTwo, shuffle, type Ctx } from '@gfc/kit/server';
import {
  COUNTDOWN_MS,
  DRIVE,
  HZ,
  ROAD_HALF,
  TOWNS,
  TRIPS,
  VAN,
  onRoad,
  roadCenter,
  type Frame,
  type Junction,
  type Obstacle,
  type ObstacleKind,
  type Room,
} from '../shared';

const dt = 1 / HZ;
const NOTHING = { left: false, right: false, gas: false, brake: false };

export function newRoom(code: string, ctx: Ctx): Room {
  return {
    code,
    createdAt: ctx.now,
    lastActivityAt: ctx.now,
    players: [],
    phase: 'LOBBY',
    trip: 0,
    driverId: null,
    held: {},
    van: { d: 0, x: 0, speed: 0, hp: 100, fuel: 100 },
    curve: { waves: [] },
    obstacles: [],
    junctions: [],
    route: [],
    stalledUntil: 0,
    wrongTurns: 0,
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
  room.driverId = null;
  room.readyForNext = [];
}

/** Lays out a trip: the curves, the forks and everything on the road. */
export function buildTrip(index: number, rng: () => number) {
  const trip = TRIPS[index]!;
  const curve = {
    waves: [
      [8 * trip.curve, 0.012, rng() * 6],
      [4 * trip.curve, 0.031, rng() * 6],
      [1.5 * trip.curve, 0.07, rng() * 6],
    ] as [number, number, number][],
  };
  const towns = shuffle(TOWNS, rng);
  const junctions: Junction[] = Array.from({ length: trip.junctions }, (_, i) => {
    const d = Math.round(((i + 1) * trip.length) / (trip.junctions + 1) + (rng() - 0.5) * 40);
    const correct = rng() < 0.5 ? 'left' : 'right';
    const good = towns[(i * 2) % towns.length]!;
    const bad = towns[(i * 2 + 1) % towns.length]!;
    return { d, correct, names: correct === 'left' ? [good, bad] : [bad, good], passed: false };
  });
  const route = junctions.map((j) => (j.correct === 'left' ? j.names[0] : j.names[1]));
  // Keep the forks clear, and the first stretch, so you can get going.
  const clear = (d: number) => d < 60 || d > trip.length - 30 || junctions.some((j) => d > j.d - 55 && d < j.d + 40);
  const obstacles: Obstacle[] = [];
  let id = 0;
  const place = (kind: ObstacleKind, n: number, spread: () => number) => {
    for (let k = 0; k < n; k++) {
      let d = 0;
      for (let tries = 0; tries < 50; tries++) {
        d = 60 + rng() * (trip.length - 100);
        if (!clear(d) && !obstacles.some((o) => Math.abs(o.d - d) < 18)) break;
      }
      obstacles.push({ id: id++, kind, d, x: roadCenter(curve, d) + spread(), vx: kind === 'cow' ? (rng() < 0.5 ? -1 : 1) * (0.8 + rng() * 0.8) : 0, hit: false });
    }
  };
  const lane = () => (rng() * 2 - 1) * (ROAD_HALF - 0.8);
  place('cow', trip.cows, lane);
  place('pothole', trip.potholes, lane);
  place('rock', trip.rocks, lane);
  place('mud', trip.mud, () => (rng() * 2 - 1) * 1.2);
  // Fuel cans every ~250 units.
  for (let d = 220; d < trip.length - 60; d += 230 + rng() * 60) {
    let fd = d;
    while (clear(fd)) fd += 20;
    obstacles.push({ id: id++, kind: 'fuel', d: fd, x: roadCenter(curve, fd) + lane(), vx: 0, hit: false });
  }
  return { curve, junctions, route, obstacles: obstacles.sort((a, b) => a.d - b.d) };
}

function beginTrip(room: Room, index: number, driverId: string, ctx: Ctx) {
  const t = buildTrip(index, ctx.rng);
  room.phase = 'DRIVE';
  room.trip = index;
  room.driverId = driverId;
  room.held = Object.fromEntries(room.players.map((p) => [p.id, { ...NOTHING }]));
  room.curve = t.curve;
  room.junctions = t.junctions;
  room.route = t.route;
  room.obstacles = t.obstacles;
  room.van = { d: 0, x: roadCenter(t.curve, 0), speed: 0, hp: 100, fuel: 100 };
  room.stalledUntil = 0;
  room.wrongTurns = 0;
  room.steps = 0;
  room.startsAt = ctx.now + COUNTDOWN_MS;
  room.feed = [];
  room.readyForNext = [];
}

export function startGame(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  requireTwo(room);
  room.results = [];
  beginTrip(room, 0, firstPlayer(room, ctx.rng).id, ctx);
}

/** Both ready: next trip, and you swap seats. */
export function readyForNext(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'ARRIVED');
  requirePlayer(room, playerId);
  if (!room.readyForNext.includes(playerId)) room.readyForNext.push(playerId);
  if (room.readyForNext.length < 2) return;
  requireTwo(room);
  if (room.trip + 1 >= TRIPS.length) {
    room.phase = 'FINISH';
    room.readyForNext = [];
    return;
  }
  beginTrip(room, room.trip + 1, room.players.find((p) => p.id !== room.driverId)!.id, ctx);
}

export function toLobby(room: Room, playerId: string): void {
  requirePhase(room, 'ARRIVED', 'FINISH');
  requireHost(room, playerId);
  resetToLobby(room);
}

export function setHeld(room: Room, playerId: string, held: Room['held'][string]): void {
  if (room.phase !== 'DRIVE') return;
  requirePlayer(room, playerId);
  room.held[playerId] = held;
}

/** Steering from the Driver, pedals from the Co-pilot; everything else ignored. */
export function controls(room: Room) {
  const driver = room.held[room.driverId ?? ''] ?? NOTHING;
  const copilot = room.held[room.players.find((p) => p.id !== room.driverId)?.id ?? ''] ?? NOTHING;
  return { left: driver.left, right: driver.right, gas: copilot.gas, brake: copilot.brake };
}

export const simTime = (room: Room) => room.steps / HZ;

function say(room: Room, text: string, good: boolean) {
  room.feed = [...room.feed, { id: room.nextId++, text, good }].slice(-4);
}

function finish(room: Room, outcome: 'arrived' | 'broke-down' | 'out-of-gas') {
  room.phase = 'ARRIVED';
  room.results.push({ trip: room.trip, outcome, ms: Math.round(simTime(room) * 1000), hp: Math.round(room.van.hp), wrongTurns: room.wrongTurns, driverId: room.driverId! });
  room.readyForNext = [];
}

/** One 1/30 s step. Returns true when clients need a full new state. */
export function step(room: Room, ctx: Ctx): boolean {
  if (room.phase !== 'DRIVE' || ctx.now < room.startsAt) return false;
  room.steps += 1;
  const t = simTime(room);
  const trip = TRIPS[room.trip]!;
  const van = room.van;
  const c = controls(room);
  const feedBefore = room.nextId;

  // Cows wander back and forth across the road.
  for (const o of room.obstacles) {
    if (o.kind !== 'cow' || o.hit) continue;
    o.x += o.vx * dt;
    const center = roadCenter(room.curve, o.d);
    if (Math.abs(o.x - center) > ROAD_HALF - 0.5) o.vx = -o.vx;
  }

  const stalled = t < room.stalledUntil;
  const road = onRoad(room.curve, room.junctions, van.d, van.x);
  const inMud = room.obstacles.some((o) => o.kind === 'mud' && Math.abs(o.d - van.d) < 3 && Math.abs(o.x - van.x) < 1.6);
  const top = !road ? DRIVE.offroadSpeed : inMud ? DRIVE.mudSpeed : DRIVE.maxSpeed;

  if (stalled) van.speed = 0;
  else {
    if (c.gas && van.fuel > 0) van.speed = Math.min(top, van.speed + DRIVE.accel * dt);
    else if (c.brake) van.speed = Math.max(0, van.speed - DRIVE.brake * dt);
    else van.speed = Math.max(0, van.speed - DRIVE.coast * dt);
    if (van.speed > top) van.speed = Math.max(top, van.speed - DRIVE.brake * dt);
    // You can only steer while rolling.
    const steer = (c.right ? 1 : 0) - (c.left ? 1 : 0);
    van.x += steer * DRIVE.steer * Math.min(1, van.speed / 5) * dt;
  }
  van.d += van.speed * dt;
  van.fuel = Math.max(0, van.fuel - DRIVE.fuelPerUnit * van.speed * dt);
  if (!road && van.speed > 1) van.hp = Math.max(0, van.hp - DRIVE.offroadDamagePerS * dt);

  // Hitting things.
  for (const o of room.obstacles) {
    if (o.hit || o.kind === 'mud' || Math.abs(o.d - van.d) > VAN.halfL + 0.4 || Math.abs(o.x - van.x) > VAN.halfW + 0.4) continue;
    o.hit = true;
    if (o.kind === 'fuel') {
      van.fuel = Math.min(100, van.fuel + DRIVE.fuelCan);
      say(room, `⛽ Fuel! +${DRIVE.fuelCan}`, true);
    } else if (o.kind === 'cow') {
      van.hp -= 12;
      van.speed = Math.min(van.speed, 2);
      say(room, '🐄 MOOOO! (sorry, cow)', false);
    } else if (o.kind === 'pothole') {
      van.hp -= 6;
      van.speed *= 0.6;
      say(room, '🕳️ Ka-thunk! Pothole.', false);
    } else if (o.kind === 'rock') {
      van.hp -= 15;
      van.speed *= 0.3;
      say(room, '🪨 CRUNCH. That was a rock.', false);
    }
  }

  // Forks: at the split point, which branch are you on?
  for (const j of room.junctions) {
    if (j.passed || van.d < j.d) continue;
    j.passed = true;
    const side = van.x < roadCenter(room.curve, j.d) ? 'left' : 'right';
    if (side === j.correct) say(room, `🗺️ Right way: ${j.correct === 'left' ? j.names[0] : j.names[1]}!`, true);
    else {
      room.wrongTurns += 1;
      room.stalledUntil = t + DRIVE.wrongTurnStallS;
      van.d = Math.max(0, van.d - DRIVE.wrongTurnBackUp);
      van.x = roadCenter(room.curve, van.d);
      j.passed = false;
      say(room, '🔁 Wrong way! Recalculating… U-turn.', false);
    }
  }

  if (van.hp <= 0) {
    van.hp = 0;
    say(room, '💥 The van broke down.', false);
    finish(room, 'broke-down');
    return true;
  }
  if (van.fuel <= 0 && van.speed < 0.05) {
    say(room, '⛽ Out of gas…', false);
    finish(room, 'out-of-gas');
    return true;
  }
  if (van.d >= trip.length) {
    say(room, `${trip.emoji} We made it!`, true);
    finish(room, 'arrived');
    return true;
  }
  return room.nextId !== feedBefore;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function frame(room: Room): Frame {
  const v = room.van;
  return {
    t: r2(simTime(room)),
    d: r2(v.d),
    x: r2(v.x),
    speed: r2(v.speed),
    hp: Math.round(v.hp),
    fuel: Math.round(v.fuel * 10) / 10,
    stalled: r2(Math.max(0, room.stalledUntil - simTime(room))),
    cows: room.obstacles.filter((o) => o.kind === 'cow' && Math.abs(o.d - v.d) < 60).map((o) => [o.id, r2(o.x)]),
  };
}

