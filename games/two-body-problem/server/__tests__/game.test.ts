import { describe, expect, it } from 'vitest';
import { addPlayer } from '@gfc/kit/server';
import { COUNTDOWN_MS, GATE_OPEN_S, HZ, LEVELS, LH, LW, PHYS, find, type Room } from '../../shared';
import * as game from '../game';
import { toPublicState } from '../index';

const ctxAt = (now: number) => ({ now, rng: Math.random });

function play(level = 0) {
  const room = game.newRoom('ABCD', ctxAt(0));
  addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.setStartLevel(room, 'pa', level);
  game.startGame(room, 'pa', ctxAt(0));
  const walker = room.walkerId!;
  const jumper = walker === 'pa' ? 'pb' : 'pa';
  return { room, walker, jumper };
}

const tick = (room: Room) => game.step(room, ctxAt(COUNTDOWN_MS + room.steps * 33));
const put = (room: Room, x: number, y: number) => {
  room.body.x = x;
  room.body.y = y + 1 - PHYS.h;
  room.body.vx = room.body.vy = 0;
};

describe('levels', () => {
  it('are 32×18 with a start and a goal; doors have keys and gates have buttons', () => {
    expect(LEVELS).toHaveLength(10);
    for (const l of LEVELS) {
      expect(l.rows).toHaveLength(LH);
      for (const r of l.rows) expect(r).toHaveLength(LW);
      expect(find(l, 'S'), l.name).not.toBeNull();
      expect(find(l, 'G'), l.name).not.toBeNull();
      if (find(l, 'D')) expect(find(l, 'K'), l.name).not.toBeNull();
      if (find(l, 'H')) expect(find(l, 'B'), l.name).not.toBeNull();
      const [sx, sy] = find(l, 'S')!;
      expect('#-'.includes(l.rows[sy + 1]![sx]!), `${l.name}: start on the ground`).toBe(true);
    }
  });

  it('level 1 can be finished with only the two half-controls', () => {
    const { room, walker, jumper } = play(0);
    game.setHeld(room, walker, { left: false, right: true, jump: false });
    for (let i = 0; i < 400 && room.phase === 'PLAY'; i++) {
      const x = room.body.x;
      const jump = (x > 8.6 && x < 10.5) || (x > 17.2 && x < 19);
      game.setHeld(room, jumper, { left: false, right: false, jump });
      tick(room);
    }
    expect(room.phase).toBe('CLEAR');
    expect(room.results[0]).toMatchObject({ level: 0, deaths: 0 });
  });
});

describe('two players, one body', () => {
  it('the Walker owns left/right, the Jumper owns jump', () => {
    const { room, walker, jumper } = play(0);
    game.setHeld(room, walker, { left: false, right: false, jump: true });
    game.setHeld(room, jumper, { left: false, right: true, jump: false });
    expect(game.combinedInput(room)).toEqual({ left: false, right: false, jump: false, grab: false });
    game.setHeld(room, walker, { left: true, right: false, jump: false });
    game.setHeld(room, jumper, { left: false, right: false, jump: true });
    expect(game.combinedInput(room)).toEqual({ left: true, right: false, jump: true, grab: false });
  });

  it('the countdown holds the body; spikes kill and respawn at the start', () => {
    const { room } = play(0);
    game.step(room, ctxAt(COUNTDOWN_MS - 1));
    expect(room.steps).toBe(0);
    put(room, 12, 15.5);
    tick(room);
    expect(room.deaths).toBe(1);
    expect(room.body.x).toBeCloseTo(find(LEVELS[0]!, 'S')![0] + 0.15, 2);
  });

  it('a swap pad trades jobs once per visit', () => {
    const { room, walker, jumper } = play(2);
    const [px, py] = find(LEVELS[2]!, '~')!;
    put(room, px, py);
    tick(room);
    expect(room.walkerId).toBe(jumper);
    tick(room);
    tick(room);
    expect(room.walkerId).toBe(jumper); // still standing on it: no swap back
    put(room, px - 4, py);
    tick(room);
    put(room, px, py);
    tick(room);
    expect(room.walkerId).toBe(walker);
    expect(room.swaps).toBe(2);
  });

  it('the key opens doors', () => {
    const { room } = play(1);
    const [dx, dy] = find(LEVELS[1]!, 'D')!;
    expect(game.worldAt(room).solid(dx, dy)).toBe(true);
    const [kx, ky] = find(LEVELS[1]!, 'K')!;
    put(room, kx, ky);
    tick(room);
    expect(room.hasKey).toBe(true);
    expect(game.worldAt(room).solid(dx, dy)).toBe(false);
  });

  it('the button opens the gate for a few seconds', () => {
    const { room } = play(3);
    const [hx, hy] = find(LEVELS[3]!, 'H')!;
    const [bx, by] = find(LEVELS[3]!, 'B')!;
    put(room, bx, by);
    tick(room);
    expect(game.worldAt(room).solid(hx, hy)).toBe(false);
    expect(game.worldAt(room, game.simTime(room) + GATE_OPEN_S + 0.1).solid(hx, hy)).toBe(true);
  });

  it('clearing a level, then the next one swaps who walks first; the last one finishes', () => {
    const last = LEVELS.length - 1;
    const { room, walker } = play(last - 1);
    const [gx, gy] = find(LEVELS[last - 1]!, 'G')!;
    put(room, gx, gy);
    tick(room);
    expect(room.phase).toBe('CLEAR');
    game.readyForNext(room, 'pa', ctxAt(50_000));
    game.readyForNext(room, 'pb', ctxAt(50_000));
    expect(room.level).toBe(last);
    expect(room.walkerId).not.toBe(walker);
    const [g6x, g6y] = find(LEVELS[last]!, 'G')!;
    put(room, g6x, g6y);
    game.step(room, ctxAt(50_000 + COUNTDOWN_MS + 33));
    game.readyForNext(room, 'pa', ctxAt(90_000));
    game.readyForNext(room, 'pb', ctxAt(90_000));
    expect(room.phase).toBe('FINISH');
    expect(room.results.map((r) => r.level)).toEqual([last - 1, last]);
  });

  it('the view tells me my role and leaks no tokens', () => {
    const { room, walker, jumper } = play(0);
    expect(toPublicState(room, walker, 0).myRole).toBe('walker');
    expect(toPublicState(room, jumper, 0).myRole).toBe('jumper');
    expect(JSON.stringify(toPublicState(room, walker, 0))).not.toContain('token-');
    expect(HZ).toBe(30);
  });
});
