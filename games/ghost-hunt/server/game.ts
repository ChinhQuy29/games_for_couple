// Ghost Hunt — the rules. Pure functions: time and randomness come in through ctx.
//
// The Explorer walks a dark house with a flashlight and tools. The Navigator sees the
// floor plan, the cameras and the instruments, but never the ghost. Together they find
// three pieces of evidence, name the ghost in the journal, and leave by the front door.
// The server simulates the ghost at 5 ticks per second.

import { firstPlayer, fail, pick, requireHost, requirePhase, requirePlayer, requireTwo, shuffle, type Ctx } from '@gfc/kit/server';
import {
  CAMERAS,
  DIRS,
  EVIDENCE_IDS,
  GHOSTS,
  GHOST_IDS,
  ROOMS,
  START,
  TIMING,
  doorsOf,
  nextStep,
  roomAt,
  roomById,
  roomTiles,
  tileAt,
  walkable,
  type Dir,
  type Evidence,
  type GhostType,
  type Journal,
  type Room,
  type RoomId,
} from '../shared';

const SPIRIT_BOX_LINES = ['…here…', '…behind you…', '…get out…', '…cold…', '…mine…', '…kill…', '…child…', '…close…'];
const GHOST_EVENTS = ['🚪 A door slams somewhere', '💡 The lights flicker', '🧸 Something falls over', '👣 Footsteps upstairs… wait, there is no upstairs', '🎶 A music box plays for a second', '😮‍💨 You hear breathing'];
const GHOST_ROOMS: RoomId[] = ['nursery', 'bedroom', 'bathroom', 'study', 'kitchen', 'dining'];

const emptyJournal = (): Journal => ({ marks: Object.fromEntries(EVIDENCE_IDS.map((e) => [e, null])) as Journal['marks'], guess: null });

export function newRoom(code: string, ctx: Ctx): Room {
  return {
    code,
    createdAt: ctx.now,
    lastActivityAt: ctx.now,
    players: [],
    phase: 'LOBBY',
    explorerId: null,
    ghost: 'spirit',
    ghostRoom: 'nursery',
    ghostPos: [2, 2],
    me: { pos: [...START], facing: 'up', hidden: false, uv: false, lastMoveAt: 0 },
    sanity: 100,
    hunt: 'calm',
    huntUntil: 0,
    nextHuntCheckAt: 0,
    cameras: [],
    book: null,
    prints: [],
    readings: { room: null, emf: 1, temp: 18 },
    roomTemps: Object.fromEntries(ROOMS.map((r) => [r.id, 18])) as Record<RoomId, number>,
    spiritboxReadyAt: 0,
    feed: [],
    journal: emptyJournal(),
    startedAt: 0,
    endsAt: 0,
    tickN: 0,
    nextTickAt: 0,
    nextId: 1,
    results: [],
    readyForNext: [],
  };
}

export function resetToLobby(room: Room): void {
  room.phase = 'LOBBY';
  room.explorerId = null;
  room.readyForNext = [];
  room.feed = [];
}

export const hasEvidence = (room: Room, e: Evidence) => (GHOSTS[room.ghost].evidence as readonly Evidence[]).includes(e);
const has = hasEvidence;

function say(room: Room, text: string, ctx: Ctx) {
  room.feed.push({ id: room.nextId++, at: ctx.now, text });
  room.feed = room.feed.slice(-6);
}

/** Sets up a new house with a new ghost. `ghost`/`ghostRoom` can be forced for tests. */
export function beginGame(room: Room, explorerId: string, ctx: Ctx, force?: { ghost?: GhostType; ghostRoom?: RoomId }): void {
  room.phase = 'HUNT';
  room.explorerId = explorerId;
  room.ghost = force?.ghost ?? pick(GHOST_IDS, ctx.rng);
  room.ghostRoom = force?.ghostRoom ?? pick(GHOST_ROOMS, ctx.rng);
  room.ghostPos = pick(roomTiles(room.ghostRoom), ctx.rng);
  room.me = { pos: [...START], facing: 'up', hidden: false, uv: false, lastMoveAt: 0 };
  room.sanity = 100;
  room.hunt = 'calm';
  room.huntUntil = 0;
  room.nextHuntCheckAt = ctx.now + TIMING.huntCheckEveryMs;
  room.cameras = [];
  room.book = null;
  room.prints = has(room, 'prints') ? shuffle(doorsOf(room.ghostRoom), ctx.rng).slice(0, 2) : [];
  room.roomTemps = Object.fromEntries(
    ROOMS.map((r) => [r.id, r.id === room.ghostRoom ? (has(room, 'freezing') ? -3 : 7) : 15 + Math.floor(ctx.rng() * 5)]),
  ) as Record<RoomId, number>;
  room.readings = { room: roomAt(...START), emf: 1, temp: room.roomTemps.living };
  room.spiritboxReadyAt = 0;
  room.feed = [];
  room.journal = emptyJournal();
  room.startedAt = ctx.now;
  room.endsAt = ctx.now + TIMING.gameMs;
  room.tickN = 0;
  room.nextTickAt = ctx.now + TIMING.tickMs;
  room.readyForNext = [];
  say(room, '🏚️ You step inside. The door creaks shut behind you.', ctx);
}

export function startGame(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  requireTwo(room);
  room.results = [];
  beginGame(room, firstPlayer(room, ctx.rng).id, ctx);
}

export function readyForNext(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'RESULT');
  requirePlayer(room, playerId);
  if (!room.readyForNext.includes(playerId)) room.readyForNext.push(playerId);
  if (room.readyForNext.length < 2) return;
  requireTwo(room);
  const next = room.players.find((p) => p.id !== room.explorerId)!;
  beginGame(room, next.id, ctx);
}

export function toLobby(room: Room, playerId: string): void {
  requirePhase(room, 'RESULT');
  requireHost(room, playerId);
  resetToLobby(room);
}

function finish(room: Room, outcome: 'escaped' | 'wrong' | 'caught' | 'timeout', ctx: Ctx) {
  room.phase = 'RESULT';
  room.hunt = 'calm';
  room.results.push({
    n: room.results.length + 1,
    explorerId: room.explorerId!,
    ghost: room.ghost,
    ghostRoom: room.ghostRoom,
    guess: room.journal.guess,
    outcome,
    ms: ctx.now - room.startedAt,
  });
  room.readyForNext = [];
}

function requireExplorer(room: Room, playerId: string) {
  requirePhase(room, 'HUNT');
  requirePlayer(room, playerId);
  if (room.explorerId !== playerId) fail('NOT_EXPLORER', "You're the Navigator: guide them with the map 🗺️");
}

/** One step. Turning toward a wall still turns you. Too-fast steps are ignored, not errors. */
export function move(room: Room, playerId: string, dir: Dir, ctx: Ctx): void {
  requireExplorer(room, playerId);
  const me = room.me;
  if (me.hidden) return;
  me.facing = dir;
  if (ctx.now - me.lastMoveAt < TIMING.moveMs) return;
  const [dx, dy] = DIRS[dir];
  const nx = me.pos[0] + dx;
  const ny = me.pos[1] + dy;
  if (!walkable(nx, ny)) return;
  me.lastMoveAt = ctx.now;
  if (tileAt(nx, ny) === 'E') {
    if (room.hunt !== 'calm') fail('LOCKED', "The door won't open! 😱");
    if (!room.journal.guess) fail('NO_GUESS', 'Write your guess in the journal before you leave 📓');
    me.pos = [nx, ny];
    finish(room, room.journal.guess === room.ghost ? 'escaped' : 'wrong', ctx);
    return;
  }
  me.pos = [nx, ny];
  checkCaught(room, ctx);
}

export function useTool(room: Room, playerId: string, tool: 'uv' | 'spiritbox' | 'book' | 'camera' | 'hide', ctx: Ctx): string | void {
  requireExplorer(room, playerId);
  const me = room.me;
  const here = roomAt(...me.pos);
  switch (tool) {
    case 'uv':
      me.uv = !me.uv;
      return;
    case 'hide': {
      if (me.hidden) {
        me.hidden = false;
        return;
      }
      if (tileAt(...me.pos) !== 'c') fail('NO_CLOSET', 'Stand in a closet to hide 🚪');
      me.hidden = true;
      return;
    }
    case 'spiritbox': {
      if (ctx.now < room.spiritboxReadyAt) fail('COOLDOWN', 'The spirit box is still crackling…');
      room.spiritboxReadyAt = ctx.now + TIMING.spiritboxCooldownMs;
      room.sanity = Math.max(0, room.sanity - 1);
      if (here === room.ghostRoom && has(room, 'spiritbox') && ctx.rng() < 0.45) {
        const line = pick(SPIRIT_BOX_LINES, ctx.rng);
        say(room, `📻 The spirit box answers: "${line}"`, ctx);
        return line;
      }
      say(room, '📻 …static…', ctx);
      return;
    }
    case 'book': {
      if (!here) fail('NOT_HERE', 'Put it down inside a room, not in a doorway');
      room.book = {
        pos: [...me.pos],
        room: here!,
        writeAt: here === room.ghostRoom && has(room, 'writing') ? ctx.now + 8000 + Math.floor(ctx.rng() * 12_000) : null,
        written: false,
      };
      say(room, '📓 Book placed.', ctx);
      return;
    }
    case 'camera': {
      if (!here) fail('NOT_HERE', 'Put it down inside a room, not in a doorway');
      if (room.cameras.some((c) => c.room === here)) fail('ALREADY', 'There is already a camera in this room');
      if (room.cameras.length >= CAMERAS) room.cameras.shift(); // move the oldest one
      room.cameras.push({ pos: [...me.pos], room: here! });
      say(room, `📹 Camera set up in the ${roomById(here!).name}.`, ctx);
      return;
    }
  }
}

export function updateJournal(room: Room, playerId: string, patch: { mark?: { evidence: Evidence; value: 'yes' | 'no' | null }; guess?: GhostType | null }): void {
  requirePhase(room, 'HUNT');
  requirePlayer(room, playerId);
  if (patch.mark) room.journal.marks[patch.mark.evidence] = patch.mark.value;
  if (patch.guess !== undefined) room.journal.guess = patch.guess;
}

function checkCaught(room: Room, ctx: Ctx) {
  if (room.hunt !== 'hunt' || room.me.hidden) return;
  const [gx, gy] = room.ghostPos;
  const [x, y] = room.me.pos;
  if (gx === x && gy === y) {
    say(room, '👻 GOT YOU.', ctx);
    finish(room, 'caught', ctx);
  }
}

const dist = (a: [number, number], b: [number, number]) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

function wander(room: Room, ctx: Ctx) {
  const leaveChance = room.ghost === 'banshee' ? 0.35 : room.ghost === 'jinn' ? 0.03 : 0.12;
  const [gx, gy] = room.ghostPos;
  const inRoom = roomAt(gx, gy) === room.ghostRoom;
  if (!inRoom && ctx.rng() < 0.7) {
    const [tx, ty] = pick(roomTiles(room.ghostRoom), ctx.rng);
    const step = nextStep(gx, gy, tx, ty);
    if (step) room.ghostPos = step;
    return;
  }
  const options = Object.values(DIRS)
    .map(([dx, dy]) => [gx + dx, gy + dy] as [number, number])
    .filter(([x, y]) => walkable(x, y) && tileAt(x, y) !== 'E' && (!inRoom || roomAt(x, y) === room.ghostRoom || ctx.rng() < leaveChance));
  if (options.length) room.ghostPos = pick(options, ctx.rng);
}

function chase(room: Room, ctx: Ctx) {
  const [gx, gy] = room.ghostPos;
  const [x, y] = room.me.pos;
  const step = nextStep(gx, gy, x, y, (tx, ty) => tileAt(tx, ty) === 'E');
  if (step) room.ghostPos = step;
  // A Wraith sometimes glides an extra tile.
  if (room.ghost === 'wraith' && ctx.rng() < 0.25) {
    const again = nextStep(room.ghostPos[0], room.ghostPos[1], x, y);
    if (again) room.ghostPos = again;
  }
}

function emfReading(room: Room, here: RoomId | null, ctx: Ctx): number {
  if (here && here === room.ghostRoom) return has(room, 'emf') && ctx.rng() < 0.35 ? 5 : 2 + Math.floor(ctx.rng() * 3);
  return dist(room.ghostPos, room.me.pos) <= 3 ? 2 + Math.floor(ctx.rng() * 2) : 1;
}

/** One simulation step (every 200ms while hunting). */
function step(room: Room, ctx: Ctx) {
  room.tickN += 1;
  const near = dist(room.ghostPos, room.me.pos) <= 3;

  // Sanity.
  const nearDrain = room.ghost === 'phantom' ? TIMING.nearDrainPerTick * 2 : TIMING.nearDrainPerTick;
  room.sanity = Math.max(0, room.sanity - TIMING.drainPerTick - (near && !room.me.hidden ? nearDrain : 0));

  // Hunts.
  if (room.hunt === 'warning' && ctx.now >= room.huntUntil - TIMING.huntMs) {
    room.hunt = 'hunt';
    say(room, '👻 IT IS HUNTING. Hide or run!', ctx);
  }
  if (room.hunt === 'hunt' && ctx.now >= room.huntUntil) {
    room.hunt = 'calm';
    room.nextHuntCheckAt = ctx.now + TIMING.huntCooldownMs;
    say(room, '😮‍💨 The house goes quiet again.', ctx);
  }
  if (room.hunt === 'calm' && ctx.now >= room.nextHuntCheckAt) {
    room.nextHuntCheckAt = ctx.now + TIMING.huntCheckEveryMs;
    const g = GHOSTS[room.ghost];
    if (room.sanity < g.huntBelow && ctx.rng() < g.huntChance) {
      room.hunt = 'warning';
      room.huntUntil = ctx.now + TIMING.huntWarningMs + TIMING.huntMs;
      say(room, '💡💡💡 The lights are flickering like crazy…', ctx);
    }
  }

  // The ghost moves: every tick while hunting someone who isn't hidden, else every few ticks.
  if (room.hunt === 'hunt' && !room.me.hidden) chase(room, ctx);
  else if (room.tickN % TIMING.wanderEveryTicks === 0) wander(room, ctx);
  checkCaught(room, ctx);
  if (room.phase !== 'HUNT') return;

  // Instruments, once a second.
  if (room.tickN % TIMING.readingEveryTicks === 0) {
    const here = roomAt(...room.me.pos) ?? room.readings.room;
    const base = here ? room.roomTemps[here] : 18;
    room.readings = { room: here, emf: emfReading(room, here, ctx), temp: base + Math.round((ctx.rng() * 2 - 1) * 10) / 10 };
  }

  // Random spooky events, more for a Poltergeist.
  const eventChance = room.ghost === 'poltergeist' ? 0.012 : 0.005;
  if (room.hunt === 'calm' && ctx.rng() < eventChance) say(room, pick(GHOST_EVENTS, ctx.rng), ctx);

  if (room.book?.writeAt && ctx.now >= room.book.writeAt) room.book.written = true;
}

export function wakeAt(room: Room): number | null {
  return room.phase === 'HUNT' ? room.nextTickAt : null;
}

export function tick(room: Room, ctx: Ctx): boolean {
  if (room.phase !== 'HUNT') return false;
  if (ctx.now >= room.endsAt) {
    say(room, '🌅 The sun is up. The ghost wins this one.', ctx);
    finish(room, 'timeout', ctx);
    return true;
  }
  step(room, ctx);
  room.nextTickAt = Math.max(room.nextTickAt + TIMING.tickMs, ctx.now + 50);
  return true;
}
