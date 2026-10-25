import { describe, expect, it } from 'vitest';
import { addPlayer } from '@gfc/kit/server';
import {
  CHAIN_LENGTH,
  CHECKPOINTS,
  COUNTDOWN_MS,
  LEVEL,
  LH,
  LW,
  MOVERS,
  NO_INPUT,
  PHYS,
  SUMMIT,
  applyChain,
  center,
  moverAt,
  newBody,
  stepBody,
  tile,
  type Input,
  type Room,
  type World,
  generateTower,
  getTower,
  tileOf,
} from '../../shared';
import * as game from '../game';
import { toPublicState } from '../index';

const ctxAt = (now: number) => ({ now, rng: Math.random });

function climb() {
  const room = game.newRoom('ABCD', ctxAt(0));
  addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.startGame(room, 'pa', ctxAt(0));
  return room;
}

/** Steps the simulation n times after the countdown. */
function run(room: Room, n: number, inputs: Partial<Record<'pa' | 'pb', Partial<Input>>> = {}) {
  for (const id of ['pa', 'pb'] as const) game.setInput(room, id, { ...NO_INPUT, ...inputs[id] });
  for (let i = 0; i < n && room.phase === 'CLIMB'; i++) game.step(room, ctxAt(COUNTDOWN_MS + room.steps * 33));
}

const flat: World = { solid: (_x, y) => y >= 10, oneWay: () => false, platforms: [] };

describe('physics', () => {
  it('gravity lands you on the floor; you run and stop at walls', () => {
    const b = newBody(2, 5);
    for (let i = 0; i < 60; i++) stepBody(b, NO_INPUT, flat);
    expect(b.y + PHYS.h).toBeCloseTo(10, 3);
    expect(b.onGround).toBe(true);
    const walled: World = { ...flat, solid: (x, y) => y >= 10 || x >= 6 };
    for (let i = 0; i < 60; i++) stepBody(b, { ...NO_INPUT, right: true }, walled);
    expect(b.x + PHYS.w).toBeCloseTo(6, 3);
  });

  it('a jump clears 3 tiles but not 4', () => {
    const b = newBody(2, 10 - PHYS.h);
    let top = b.y;
    stepBody(b, { ...NO_INPUT, jump: true }, flat);
    for (let i = 0; i < 40; i++) {
      stepBody(b, { ...NO_INPUT, jump: true }, flat);
      top = Math.min(top, b.y);
    }
    const rise = 10 - PHYS.h - top;
    expect(rise).toBeGreaterThan(3.1);
    expect(rise).toBeLessThan(4);
  });

  it('one-way platforms: jump up through, land on top', () => {
    const world: World = { solid: (_x, y) => y >= 10, oneWay: (_x, y) => y === 7, platforms: [] };
    const b = newBody(2, 10 - PHYS.h);
    stepBody(b, { ...NO_INPUT, jump: true }, world);
    for (let i = 0; i < 50; i++) stepBody(b, { ...NO_INPUT, jump: true }, world);
    expect(b.y + PHYS.h).toBeCloseTo(7, 3);
  });

  it('the chain never stretches past its length, and an anchor holds', () => {
    const a = newBody(2, 10 - PHYS.h);
    const b = newBody(3, 10 - PHYS.h);
    for (let i = 0; i < 60; i++) {
      stepBody(a, { ...NO_INPUT, grab: true }, flat);
      stepBody(b, { ...NO_INPUT, right: true }, flat);
      applyChain(a, b, CHAIN_LENGTH, flat);
    }
    const [ax] = center(a);
    const [bx] = center(b);
    expect(bx - ax).toBeCloseTo(CHAIN_LENGTH, 2);
    expect(a.x).toBeCloseTo(2, 3); // the anchor didn't budge
    expect(a.stamina).toBeLessThan(PHYS.staminaMax);
  });

  it('without an anchor, one runner drags the other', () => {
    const a = newBody(2, 10 - PHYS.h);
    const b = newBody(3, 10 - PHYS.h);
    for (let i = 0; i < 60; i++) {
      stepBody(a, NO_INPUT, flat);
      stepBody(b, { ...NO_INPUT, right: true }, flat);
      applyChain(a, b, CHAIN_LENGTH, flat);
    }
    expect(a.x).toBeGreaterThan(4);
  });
});

describe('the tower', () => {
  it('is the right size with a start, 3 checkpoints and a summit on solid ground', () => {
    expect(LEVEL).toHaveLength(LH);
    for (const row of LEVEL) expect(row).toHaveLength(LW);
    expect(CHECKPOINTS).toHaveLength(4);
    for (const c of CHECKPOINTS) {
      const feet = Math.round(c.y + PHYS.h);
      expect(tile(Math.floor(c.x + 0.3), feet), `${c.name} floor`).toMatch(/[#-]/);
      expect(tile(Math.floor(c.x + 1.3), feet), `${c.name} floor for player 2`).toMatch(/[#-]/);
    }
    expect(tile(SUMMIT.x, SUMMIT.y + 1)).toBe('#');
  });

  it('no solid platform sits right above another platform (no head bonks)', () => {
    for (let y = 1; y < LH - 1; y++) {
      for (let x = 1; x < LW - 1; x++) {
        if (!'#x'.includes(tile(x, y))) continue;
        for (const below of [y + 3, y + 2]) expect(' ^'.includes(tile(x, below)) || tile(x, below) === tile(x, y), `${x},${y}`).toBe(true);
      }
    }
  });

  it('movers glide between their two points', () => {
    for (let i = 0; i < MOVERS.length; i++) {
      const m = MOVERS[i]!;
      expect(moverAt(i, 0)).toMatchObject({ x: m.from[0], y: m.from[1] });
      expect(moverAt(i, m.periodS / 2)).toMatchObject({ x: m.to[0], y: m.to[1] });
    }
  });
});

describe('the climb', () => {
  it('waits for the countdown, then both climbers fall into place', () => {
    const room = climb();
    game.step(room, ctxAt(COUNTDOWN_MS - 1));
    expect(room.steps).toBe(0);
    run(room, 30);
    expect(room.bodies.every((b) => b.onGround)).toBe(true);
  });

  it('crumbling tiles vanish after you stand on them, then come back', () => {
    const room = climb();
    const [x, y] = [5, 56];
    expect(tile(x, y)).toBe('x');
    room.bodies[0]!.x = x;
    room.bodies[0]!.y = y - PHYS.h;
    room.bodies[1]!.x = x + 1;
    room.bodies[1]!.y = y - PHYS.h;
    run(room, 25, { pa: { grab: true } });
    expect(Object.values(room.crumbles).some((c) => c.goneUntil !== null)).toBe(true);
    expect(game.frame(room).gone).toContain(y * LW + x);
  });

  it('falling far below the checkpoint sends you both back and counts a fall', () => {
    const room = climb();
    room.checkpoint = 1;
    for (const b of room.bodies) b.y = CHECKPOINTS[1]!.y + 20;
    run(room, 1);
    expect(room.falls).toBe(1);
    expect(room.bodies[0]!.y).toBeCloseTo(CHECKPOINTS[1]!.y, 3);
  });

  it('spikes count as a fall', () => {
    const room = climb();
    room.bodies[0]!.x = 11;
    room.bodies[0]!.y = 13.05;
    room.bodies[1]!.x = 9; // close by, so the chain doesn't yank them off first
    room.bodies[1]!.y = 14 - PHYS.h;
    run(room, 1);
    expect(room.falls).toBe(1);
  });

  it('reaching a flag sets the checkpoint; the summit ends the climb', () => {
    const room = climb();
    const c = CHECKPOINTS[2]!;
    room.bodies[0]!.x = c.flagX;
    room.bodies[0]!.y = c.flagY + 1 - PHYS.h;
    room.bodies[1]!.x = c.flagX - 1;
    room.bodies[1]!.y = c.flagY + 1 - PHYS.h;
    run(room, 1);
    expect(room.checkpoint).toBe(2);
    room.bodies[0]!.x = SUMMIT.x;
    room.bodies[0]!.y = SUMMIT.y + 1 - PHYS.h;
    room.bodies[1]!.x = SUMMIT.x + 1;
    room.bodies[1]!.y = SUMMIT.y + 1 - PHYS.h;
    run(room, 1);
    expect(room.phase).toBe('SUMMIT');
    expect(room.results[0]).toMatchObject({ n: 1, falls: 0 });
    game.readyForNext(room, 'pa', ctxAt(99_000));
    game.readyForNext(room, 'pb', ctxAt(99_000));
    expect(room.phase).toBe('CLIMB');
    expect(room.checkpoint).toBe(0);
  });

  it('inputs are per player; the view has my slot and no tokens', () => {
    const room = climb();
    run(room, 20);
    const x0 = room.bodies[1]!.x;
    run(room, 15, { pb: { left: true } });
    expect(room.bodies[1]!.x).toBeLessThan(x0);
    const v = toPublicState(room, 'pb', 0);
    expect(v.mySlot).toBe(1);
    expect(JSON.stringify(v)).not.toContain('token-');
  });
});

describe('generated towers', () => {
  const towers = [1, 2, 3].map((id) => getTower(id)).concat(Array.from({ length: 40 }, (_, i) => getTower(4, 1000 + i * 77)));

  it('every step of the route is reachable: up to 3 rows, up to 2 tiles across (lifts ride 6)', () => {
    for (const id of [1, 2, 3]) {
      const t = generateTower(id, 'x', 'grass', [101, 202, 303][id - 1]!, [78, 72, 84][id - 1]!);
      for (let i = 1; i < t.route.length; i++) {
        const a = t.route[i - 1]!;
        const b = t.route[i]!;
        const rise = a.row - b.row;
        expect(rise, `${t.name} step ${i}`).toBeGreaterThanOrEqual(0);
        expect(rise, `${t.name} step ${i}`).toBeLessThanOrEqual(b.kind === 'lift' ? 6 : 3);
        const gap = Math.max(0, b.from - a.to - 1, a.from - b.to - 1);
        expect(gap, `${t.name} step ${i}`).toBeLessThanOrEqual(2);
      }
    }
    for (let seed = 0; seed < 60; seed++) {
      const t = generateTower(4, 'r', 'sand', seed, 72);
      for (let i = 1; i < t.route.length; i++) {
        const a = t.route[i - 1]!;
        const b = t.route[i]!;
        expect(a.row - b.row).toBeLessThanOrEqual(b.kind === 'lift' ? 6 : 3);
        expect(Math.max(0, b.from - a.to - 1, a.from - b.to - 1), `seed ${seed} step ${i}`).toBeLessThanOrEqual(2);
      }
      expect(t.route[t.route.length - 1]!.row, `seed ${seed}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('camps stand on ground, the summit too, and no solid tile hangs 2–3 rows above another', () => {
    for (const t of towers) {
      expect(t.rows).toHaveLength(t.h);
      for (const r of t.rows) expect(r).toHaveLength(LW);
      expect(t.checkpoints.length, t.name).toBeGreaterThanOrEqual(3);
      for (const c of t.checkpoints) {
        const feet = Math.round(c.y + PHYS.h);
        expect(tileOf(t, Math.floor(c.x + 0.3), feet), `${t.name} ${c.name}`).toMatch(/[#-]/);
        expect(tileOf(t, Math.floor(c.x + 1.3), feet), `${t.name} ${c.name}`).toMatch(/[#-]/);
      }
      expect(tileOf(t, t.summit.x, t.summit.y + 1), t.name).toMatch(/[#-]/);
      for (let y = 1; y < t.h - 1; y++)
        for (let x = 1; x < LW - 1; x++) {
          if (!'#x'.includes(tileOf(t, x, y))) continue;
          for (const below of [y + 2, y + 3]) if (below < t.h - 1) expect(' ^'.includes(tileOf(t, x, below)) || tileOf(t, x, below) === tileOf(t, x, y), `${t.name} ${x},${y}`).toBe(true);
        }
    }
  });

  it('the host picks the tower; the random one changes every climb', () => {
    const room = game.newRoom('ABCD', ctxAt(0));
    addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
    addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
    game.setTower(room, 'pa', 4);
    game.startGame(room, 'pa', { now: 0, rng: () => 0.25 });
    const first = room.towerSeed;
    expect(game.towerOf(room).checkpoints[0]!.y).toBeCloseTo(room.bodies[0]!.y, 3);
    room.phase = 'SUMMIT';
    game.readyForNext(room, 'pa', { now: 0, rng: () => 0.75 });
    game.readyForNext(room, 'pb', { now: 0, rng: () => 0.75 });
    expect(room.towerSeed).not.toBe(first);
    expect(() => game.setTower(room, 'pb', 1)).toThrow();
  });
});
