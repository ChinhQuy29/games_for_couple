import { describe, expect, it } from 'vitest';
import { addPlayer, seededRng } from '@gfc/kit/server';
import { ROOMS, WALL, type Dir, type Puzzle, type Room } from '../../shared';
import * as game from '../game';
import { cardFor, toPublicState } from '../index';

const ctxAt = (now: number, seed = 1) => ({ now, rng: seededRng(seed) });

function start(seed = 1) {
  const room = game.newRoom('ABCD', ctxAt(0));
  addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.startGame(room, 'pa', ctxAt(1000, seed));
  return room;
}

const actorId = (room: Room, p: Puzzle) => room.players[p.actor]!.id;
const other = (room: Room, p: Puzzle) => room.players[1 - p.actor]!.id;

/** Solve a maze by BFS through open walls, returning the moves. */
function mazePath(p: Extract<Puzzle, { kind: 'maze' }>): Dir[] {
  const key = (x: number, y: number) => y * p.size + x;
  const prev = new Map<number, [number, Dir]>();
  const q: [number, number][] = [p.pos];
  const seen = new Set([key(...p.pos)]);
  const steps: [Dir, number, number][] = [['up', 0, -1], ['right', 1, 0], ['down', 0, 1], ['left', -1, 0]];
  while (q.length) {
    const [x, y] = q.shift()!;
    if (x === p.exit[0] && y === p.exit[1]) break;
    for (const [d, dx, dy] of steps) {
      if (p.walls[key(x, y)]! & WALL[d]) continue;
      const n = key(x + dx, y + dy);
      if (seen.has(n)) continue;
      seen.add(n);
      prev.set(n, [key(x, y), d]);
      q.push([x + dx, y + dy]);
    }
  }
  const path: Dir[] = [];
  let cur = key(...p.exit);
  while (cur !== key(...p.pos)) {
    const [from, d] = prev.get(cur)!;
    path.unshift(d);
    cur = from;
  }
  return path;
}

/** Solves the current puzzle the way the two players would. */
function solveCurrent(room: Room, now = 5000) {
  const p = room.puzzles[game.currentIndex(room)]!;
  const me = actorId(room, p);
  const c = ctxAt(now);
  switch (p.kind) {
    case 'dial':
      p.answer.forEach((target, i) => {
        while (p.dials[i] !== target) game.act(room, me, { op: 'spin', dial: i, dir: 1 }, c);
      });
      return game.act(room, me, { op: 'tryDial' }, c);
    case 'code':
      return game.act(room, me, { op: 'code', code: p.answer }, c);
    case 'colors': {
      let r: ReturnType<typeof game.act> = 'ok';
      for (const color of p.answer) r = game.act(room, me, { op: 'color', color }, c);
      return r;
    }
    case 'levers':
      p.answer.forEach((up, i) => {
        if (p.state[i] !== up) game.act(room, me, { op: 'lever', lever: i }, c);
      });
      return game.act(room, me, { op: 'tryLevers' }, c);
    case 'maze': {
      let r: ReturnType<typeof game.act> = 'ok';
      for (const dir of mazePath(p)) r = game.act(room, me, { op: 'move', dir }, c);
      return r;
    }
  }
}

describe('generators', () => {
  it('mazes are perfect: every cell reachable, walls agree on both sides', () => {
    for (let seed = 1; seed < 20; seed++) {
      const m = game.makePuzzle('maze', 0, 2, seededRng(seed)) as Extract<Puzzle, { kind: 'maze' }>;
      expect(mazePath(m).length).toBeGreaterThan(0);
      for (let y = 0; y < m.size; y++)
        for (let x = 0; x + 1 < m.size; x++) expect(Boolean(m.walls[y * m.size + x]! & WALL.right)).toBe(Boolean(m.walls[y * m.size + x + 1]! & WALL.left));
    }
  });

  it('the counting shelf holds exactly the counts the code needs', () => {
    for (let seed = 1; seed < 20; seed++) {
      const p = game.makePuzzle('code', 0, 0, seededRng(seed)) as Extract<Puzzle, { kind: 'code' }>;
      const counted = p.order.map((o) => p.shelf.filter((s) => s.obj === o).length).join('');
      expect(counted).toBe(p.answer);
    }
  });

  it('dials never start solved; lever answers are never all down', () => {
    for (let seed = 1; seed < 30; seed++) {
      const d = game.makePuzzle('dial', 0, 0, seededRng(seed)) as Extract<Puzzle, { kind: 'dial' }>;
      expect(d.dials).not.toEqual(d.answer);
      const l = game.makePuzzle('levers', 0, 0, seededRng(seed)) as Extract<Puzzle, { kind: 'levers' }>;
      expect(l.answer.some(Boolean)).toBe(true);
    }
  });
});

describe('playing', () => {
  it('actors alternate within a room; only the actor can use the controls', () => {
    const room = start();
    const actors = room.puzzles.map((p) => p.actor);
    expect(actors[0]).not.toBe(actors[1]);
    expect(actors[1]).not.toBe(actors[2]);
    const p = room.puzzles[0]!;
    expect(() => game.act(room, other(room, p), { op: 'tryDial' }, ctxAt(2000))).toThrow(/partner/);
  });

  it('mistakes count, reset sequences and send the maze walker home', () => {
    const room = start();
    room.puzzles[0] = game.makePuzzle('colors', 0, 1, seededRng(3));
    const p = room.puzzles[0] as Extract<Puzzle, { kind: 'colors' }>;
    game.act(room, 'pa', { op: 'color', color: p.answer[0]! }, ctxAt(2000));
    expect(p.progress).toBe(1);
    const wrong = (['red', 'blue', 'green', 'yellow'] as const).find((c) => c !== p.answer[1])!;
    expect(game.act(room, 'pa', { op: 'color', color: wrong }, ctxAt(2000))).toBe('wrong');
    expect(p.progress).toBe(0);
    expect(room.mistakes).toBe(1);

    room.puzzles[0] = game.makePuzzle('maze', 0, 1, seededRng(4));
    const m = room.puzzles[0] as Extract<Puzzle, { kind: 'maze' }>;
    const blocked = (['up', 'right', 'down', 'left'] as const).find((d) => m.walls[m.pos[1] * m.size + m.pos[0]]! & WALL[d])!;
    game.act(room, 'pa', { op: 'move', dir: mazePath(m)[0]! }, ctxAt(2000));
    const here = m.walls[m.pos[1] * m.size + m.pos[0]]!;
    const bump = (['up', 'right', 'down', 'left'] as const).find((d) => here & WALL[d]) ?? blocked;
    game.act(room, 'pa', { op: 'move', dir: bump }, ctxAt(2000));
    expect(m.pos).toEqual(m.start);
    expect(room.mistakes).toBe(2);
  });

  it('all three rooms can be escaped; roles flip between rooms; then it finishes', () => {
    const room = start(7);
    for (let r = 0; r < ROOMS.length; r++) {
      expect(room.room).toBe(r);
      const first = room.puzzles[0]!.actor;
      for (let i = 0; i < 4; i++) expect(solveCurrent(room, 1000 + (r + 1) * 60_000)).toBe('solved');
      expect(room.phase).toBe('CLEAR');
      game.readyForNext(room, 'pa', ctxAt(0));
      game.readyForNext(room, 'pb', ctxAt(0));
      if (room.phase === 'PLAY') expect(room.puzzles[0]!.actor).not.toBe(first);
    }
    expect(room.phase).toBe('FINISH');
    expect(room.results).toHaveLength(3);
    expect(game.score({ ms: 60_000, mistakes: 2 })).toBe(90_000);
  });
});

describe('redaction', () => {
  it('the actor never gets the answer, the clue holder never gets the controls', () => {
    const room = start(2);
    for (let i = 0; i < 4; i++) {
      const p = room.puzzles[game.currentIndex(room)]!;
      const mine = toPublicState(room, actorId(room, p), 0);
      const theirs = toPublicState(room, other(room, p), 0);
      const a = mine.puzzles[mine.current]!.card!;
      const c = theirs.puzzles[theirs.current]!.card!;
      expect(a.role).toBe('actor');
      expect(c.role).toBe('clue');
      const json = JSON.stringify(a);
      expect(json).not.toContain('answer');
      expect(json).not.toContain('walls');
      expect(json).not.toContain('"exit"');
      expect(json).not.toContain('order');
      expect(json).not.toContain('pattern');
      expect(JSON.stringify(c)).not.toContain('shelf');
      expect(JSON.stringify(mine)).not.toContain('token-');
      solveCurrent(room);
    }
  });

  it('future puzzles stay hidden', () => {
    const room = start();
    const v = toPublicState(room, 'pa', 0);
    expect(v.puzzles.slice(1).every((p) => p.card === null)).toBe(true);
    expect(cardFor(room.puzzles[1]!, 0)).toBeTruthy();
  });
});
