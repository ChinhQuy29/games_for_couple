// Escape Room for Two — the rules. Pure functions: time and randomness come in through ctx.
//
// Three rooms, four puzzles each, solved in order. Each puzzle has an "actor" seat that
// holds the controls; the other seat holds the clue. Mistakes cost time on the score.

import { firstSeat, fail, pick, requireHost, requirePhase, requirePlayer, requireTwo, shuffle, type Ctx } from '@gfc/kit/server';
import { COLORS, MISTAKE_PENALTY_MS, OBJECTS, ROOMS, SYMBOLS, WALL, type Act, type Dir, type Puzzle, type PuzzleKind, type Room } from '../shared';

export function newRoom(code: string, ctx: Ctx): Room {
  return {
    code,
    createdAt: ctx.now,
    lastActivityAt: ctx.now,
    players: [],
    phase: 'LOBBY',
    room: 0,
    puzzles: [],
    firstActor: 0,
    mistakes: 0,
    startedAt: 0,
    flash: null,
    results: [],
    readyForNext: [],
  };
}

export function resetToLobby(room: Room): void {
  room.phase = 'LOBBY';
  room.puzzles = [];
  room.flash = null;
  room.readyForNext = [];
}

// ---------- generators ----------

const ints = (n: number, max: number, rng: () => number) => Array.from({ length: n }, () => Math.floor(rng() * max));

export function makeMaze(size: number, rng: () => number): Pick<Extract<Puzzle, { kind: 'maze' }>, 'walls' | 'start' | 'exit'> {
  const walls = Array.from({ length: size * size }, () => 15);
  const seen = new Set<number>([0]);
  const stack = [0];
  const steps: [Dir, number, number, Dir][] = [
    ['up', 0, -1, 'down'],
    ['right', 1, 0, 'left'],
    ['down', 0, 1, 'up'],
    ['left', -1, 0, 'right'],
  ];
  while (stack.length) {
    const cur = stack[stack.length - 1]!;
    const cx = cur % size;
    const cy = Math.floor(cur / size);
    const options = steps.filter(([, dx, dy]) => {
      const nx = cx + dx;
      const ny = cy + dy;
      return nx >= 0 && ny >= 0 && nx < size && ny < size && !seen.has(ny * size + nx);
    });
    if (!options.length) {
      stack.pop();
      continue;
    }
    const [dir, dx, dy, back] = pick(options, rng);
    const next = (cy + dy) * size + cx + dx;
    walls[cur]! &= ~WALL[dir];
    walls[next]! &= ~WALL[back];
    seen.add(next);
    stack.push(next);
  }
  // Start in one corner, exit in the opposite one.
  const corners: [number, number][] = [
    [0, 0],
    [size - 1, 0],
    [0, size - 1],
    [size - 1, size - 1],
  ];
  const s = Math.floor(rng() * 4);
  return { walls, start: corners[s]!, exit: corners[3 - s]! };
}

export function makePuzzle(kind: PuzzleKind, actor: 0 | 1, roomIndex: number, rng: () => number): Puzzle {
  const def = ROOMS[roomIndex]!;
  switch (kind) {
    case 'dial': {
      const answer = shuffle(SYMBOLS.map((_, i) => i), rng).slice(0, 4);
      let dials = ints(4, SYMBOLS.length, rng);
      while (dials.every((d, i) => d === answer[i])) dials = ints(4, SYMBOLS.length, rng);
      return { kind, actor, solved: false, answer, dials };
    }
    case 'code': {
      const objs = shuffle([...OBJECTS], rng).slice(0, 6);
      const counts = objs.map(() => 1 + Math.floor(rng() * 9));
      const order = objs.slice(0, 4);
      const answer = order.map((_, i) => String(counts[i])).join('');
      // Scatter every object on a shelf grid so they don't overlap.
      const cells = shuffle(
        Array.from({ length: 64 }, (_, i) => i),
        rng,
      );
      let c = 0;
      const shelf = objs.flatMap((obj, i) =>
        Array.from({ length: counts[i]! }, () => {
          const cell = cells[c++]!;
          return { obj, x: (cell % 8) * 12.5 + 2 + rng() * 6, y: Math.floor(cell / 8) * 12.5 + 1 + rng() * 5, r: Math.round((rng() * 2 - 1) * 25) };
        }),
      );
      return { kind, actor, solved: false, order, shelf, answer };
    }
    case 'colors':
      return { kind, actor, solved: false, answer: Array.from({ length: def.colorLen }, () => pick(COLORS, rng)), progress: 0 };
    case 'levers': {
      const n = 6;
      const [up, down] = shuffle([...SYMBOLS], rng);
      let answer = Array.from({ length: n }, () => rng() < 0.5);
      if (answer.every((a) => !a)) answer = answer.map((_, i) => i % 2 === 0);
      return { kind, actor, solved: false, answer, legend: { up: up!, down: down! }, state: Array.from({ length: n }, () => false) };
    }
    case 'maze': {
      const { walls, start, exit } = makeMaze(def.maze, rng);
      return { kind, actor, solved: false, size: def.maze, walls, start, exit, pos: [...start], trail: [[...start]] };
    }
  }
}

function beginRoom(room: Room, index: number, ctx: Ctx) {
  room.phase = 'PLAY';
  room.room = index;
  room.puzzles = ROOMS[index]!.puzzles.map((kind, i) => makePuzzle(kind, ((room.firstActor + i) % 2) as 0 | 1, index, ctx.rng));
  room.mistakes = 0;
  room.startedAt = ctx.now;
  room.flash = null;
  room.readyForNext = [];
}

export function startGame(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  requireTwo(room);
  room.results = [];
  room.firstActor = firstSeat(room, ctx.rng);
  beginRoom(room, 0, ctx);
}

export function readyForNext(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'CLEAR');
  requirePlayer(room, playerId);
  if (!room.readyForNext.includes(playerId)) room.readyForNext.push(playerId);
  if (room.readyForNext.length < 2) return;
  requireTwo(room);
  if (room.room + 1 >= ROOMS.length) {
    room.phase = 'FINISH';
    room.readyForNext = [];
    return;
  }
  room.firstActor = (1 - room.firstActor) as 0 | 1;
  beginRoom(room, room.room + 1, ctx);
}

export function toLobby(room: Room, playerId: string): void {
  requirePhase(room, 'CLEAR', 'FINISH');
  requireHost(room, playerId);
  resetToLobby(room);
}

// ---------- playing ----------

export const currentIndex = (room: Room) => room.puzzles.findIndex((p) => !p.solved);

function flash(room: Room, good: boolean, text: string) {
  room.flash = { id: (room.flash?.id ?? 0) + 1, good, text };
}

function mistake(room: Room, text: string): 'wrong' {
  room.mistakes += 1;
  flash(room, false, text);
  return 'wrong';
}

function solved(room: Room, p: Puzzle, ctx: Ctx): 'solved' {
  p.solved = true;
  flash(room, true, '🔓 Click! It opened.');
  if (room.puzzles.every((x) => x.solved)) {
    room.phase = 'CLEAR';
    room.results.push({ room: room.room, ms: ctx.now - room.startedAt, mistakes: room.mistakes });
    room.readyForNext = [];
  }
  return 'solved';
}

const STEP: Record<Dir, [number, number]> = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };

/** One move on the current puzzle, by the player holding its controls. */
export function act(room: Room, playerId: string, a: Act, ctx: Ctx): 'ok' | 'wrong' | 'solved' {
  requirePhase(room, 'PLAY');
  requirePlayer(room, playerId);
  const p = room.puzzles[currentIndex(room)]!;
  const seat = room.players.findIndex((x) => x.id === playerId);
  if (p.actor !== seat) fail('NOT_YOURS', 'The controls are on your partner’s side. Tell them what you see! 🗣️');

  switch (p.kind) {
    case 'dial':
      if (a.op === 'spin') {
        const n = SYMBOLS.length;
        p.dials[a.dial] = (p.dials[a.dial]! + a.dir + n) % n;
        return 'ok';
      }
      if (a.op !== 'tryDial') break;
      return p.dials.every((d, i) => d === p.answer[i]) ? solved(room, p, ctx) : mistake(room, '🔒 The dial lock won’t budge.');
    case 'code':
      if (a.op !== 'code') break;
      return a.code === p.answer ? solved(room, p, ctx) : mistake(room, `🔒 ${a.code} is wrong.`);
    case 'colors':
      if (a.op !== 'color') break;
      if (a.color === p.answer[p.progress]) {
        p.progress += 1;
        return p.progress >= p.answer.length ? solved(room, p, ctx) : 'ok';
      }
      p.progress = 0;
      return mistake(room, '💥 Wrong color: the sequence reset.');
    case 'levers':
      if (a.op === 'lever') {
        if (a.lever >= p.state.length) fail('BAD_INPUT', 'No such lever');
        p.state[a.lever] = !p.state[a.lever];
        return 'ok';
      }
      if (a.op !== 'tryLevers') break;
      return p.state.every((s, i) => s === p.answer[i]) ? solved(room, p, ctx) : mistake(room, '⚙️ Clunk. Wrong lever pattern.');
    case 'maze': {
      if (a.op !== 'move') break;
      const [x, y] = p.pos;
      if (p.walls[y * p.size + x]! & WALL[a.dir]) {
        p.pos = [...p.start];
        p.trail = [[...p.start]];
        return mistake(room, '🧱 Bonk! A wall. Back to the start.');
      }
      const [dx, dy] = STEP[a.dir];
      p.pos = [x + dx, y + dy];
      p.trail.push([...p.pos]);
      if (p.pos[0] === p.exit[0] && p.pos[1] === p.exit[1]) return solved(room, p, ctx);
      return 'ok';
    }
  }
  return fail('BAD_INPUT', 'That control is for a different puzzle');
}

export const score = (r: { ms: number; mistakes: number }) => r.ms + r.mistakes * MISTAKE_PENALTY_MS;
