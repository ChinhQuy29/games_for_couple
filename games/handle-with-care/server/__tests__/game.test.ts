import { describe, expect, it } from 'vitest';
import { addPlayer } from '@gfc/kit/server';
import { COUNTDOWN_MS, HOUSES, ITEMS, LH, LW, PHYS, center, find, type Room } from '../../shared';
import * as game from '../game';
import { toPublicState } from '../index';

const ctxAt = (now: number) => ({ now, rng: Math.random });
const NONE = { left: false, right: false, jump: false, grab: false, throw: false };

function play(house = 0) {
  const room = game.newRoom('ABCD', ctxAt(0));
  addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.startGame(room, 'pa', ctxAt(0));
  while (room.house < house) {
    room.phase = 'DONE';
    room.results.push({ house: room.house, earned: 0, possible: 0, delivered: 0, broken: 0 });
    game.readyForNext(room, 'pa', ctxAt(0));
    game.readyForNext(room, 'pb', ctxAt(0));
  }
  return room;
}

const tick = (room: Room, n = 1, held: Partial<Record<'pa' | 'pb', Partial<typeof NONE>>> = {}) => {
  for (let i = 0; i < n && room.phase === 'MOVE'; i++) {
    for (const id of ['pa', 'pb'] as const) game.setHeld(room, id, { ...NONE, ...held[id] });
    game.step(room, ctxAt(COUNTDOWN_MS + room.steps * 33 + 1000));
  }
};
/** Press and release a button. */
const press = (room: Room, who: 'pa' | 'pb', button: 'grab' | 'throw') => {
  tick(room, 1, { [who]: { [button]: true } });
  tick(room, 1);
};
const stand = (room: Room, slot: number, x: number, floor: number) => {
  const b = room.bodies[slot]!;
  b.x = x;
  b.y = floor - PHYS.h;
  b.vx = b.vy = 0;
};
const item = (room: Room, kind: string) => room.items.find((i) => i.kind === kind)!;

describe('houses', () => {
  it('every house fits, has a start on the ground, a truck, and items resting on something', () => {
    for (const h of HOUSES) {
      expect(h.rows).toHaveLength(LH);
      for (const r of h.rows) expect(r).toHaveLength(LW);
      const [sx, sy] = find(h, 'S')!;
      expect('#-'.includes(h.rows[sy + 1]![sx]!), h.name).toBe(true);
      expect(find(h, 'T'), h.name).not.toBeNull();
      for (const [kind, x, floor] of h.items) {
        const k = ITEMS[kind];
        const under = h.rows[floor]!.slice(Math.floor(x), Math.ceil(x + k.w));
        expect(/[#-]/.test(under), `${h.name}: ${kind}`).toBe(true);
      }
    }
  });
});

describe('carrying', () => {
  it('waits for the countdown, then everything settles without damage', () => {
    const room = play();
    game.step(room, ctxAt(COUNTDOWN_MS - 1));
    expect(room.steps).toBe(0);
    tick(room, 30);
    expect(room.items.every((i) => i.hp === 1)).toBe(true);
    expect(room.bodies.every((b) => b.onGround)).toBe(true);
  });

  it('grab a small thing in reach, carry it overhead, put it down', () => {
    const room = play();
    tick(room, 20);
    const lamp = item(room, 'lamp');
    stand(room, 0, lamp.body.x, 16);
    press(room, 'pa', 'grab');
    expect(room.holding.pa).toBe(lamp.id);
    tick(room, 10, { pa: { right: true } });
    expect(lamp.body.y + lamp.body.h).toBeCloseTo(room.bodies[0]!.y, 1);
    expect(center(lamp.body)[0]).toBeCloseTo(center(room.bodies[0]!)[0], 0);
    press(room, 'pa', 'grab');
    expect(room.holding.pa).toBeNull();
    tick(room, 30);
    expect(lamp.body.onGround).toBe(true);
  });

  it('a big thing needs both of you; one alone cannot lift it', () => {
    const room = play();
    tick(room, 20);
    const tv = item(room, 'tv');
    const y0 = tv.body.y;
    stand(room, 0, tv.body.x - 0.3, 16);
    press(room, 'pa', 'grab');
    expect(tv.holders).toEqual(['pa']);
    tick(room, 5);
    expect(tv.body.y).toBeCloseTo(y0, 2); // still on the floor
    stand(room, 1, tv.body.x + tv.body.w - 0.4, 16);
    press(room, 'pb', 'grab');
    expect(tv.holders).toHaveLength(2);
    tick(room, 5);
    expect(tv.body.y).toBeLessThan(y0 - 0.5); // lifted overhead
    // Walk apart and it drops.
    tick(room, 25, { pa: { left: true }, pb: { right: true } });
    expect(tv.holders).toHaveLength(0);
  });

  it('carrying something big: slower, and no jumping', () => {
    const room = play();
    tick(room, 20);
    const tv = item(room, 'tv');
    stand(room, 0, tv.body.x - 0.3, 16);
    stand(room, 1, tv.body.x + tv.body.w - 0.4, 16);
    press(room, 'pa', 'grab');
    press(room, 'pb', 'grab');
    tick(room, 10, { pa: { jump: true }, pb: { jump: true } });
    expect(room.bodies[0]!.y).toBeCloseTo(16 - PHYS.h, 2);
  });

  it('throwing flies, and a hard landing costs value (fragile things more)', () => {
    const room = play();
    tick(room, 20);
    const vase = item(room, 'vase');
    vase.body.y = 2;
    vase.body.x = 15;
    tick(room, 40);
    expect(vase.hp).toBeLessThan(1);
    const plant = item(room, 'plant');
    stand(room, 1, plant.body.x, 16);
    press(room, 'pb', 'grab');
    const x0 = plant.body.x;
    press(room, 'pb', 'throw');
    tick(room, 20);
    expect(Math.abs(plant.body.x - x0)).toBeGreaterThan(1.5);
  });

  it('things break at 0, and putting something down in the truck delivers it', () => {
    const room = play();
    tick(room, 20);
    const plant = item(room, 'plant');
    plant.body.x = 27;
    plant.body.y = 16 - plant.body.h;
    tick(room, 3);
    expect(plant.state).toBe('delivered');
    expect(room.earned).toBe(ITEMS.plant.value);
    const vase = item(room, 'vase');
    vase.hp = 0.01;
    vase.body.y = 1;
    vase.body.x = 15;
    tick(room, 40);
    expect(vase.state).toBe('broken');
  });

  it('two of you can carry the TV through the doorway and load it', () => {
    const room = play();
    tick(room, 20);
    const tv = item(room, 'tv');
    stand(room, 0, tv.body.x - 0.3, 16);
    stand(room, 1, tv.body.x + tv.body.w - 0.4, 16);
    press(room, 'pa', 'grab');
    press(room, 'pb', 'grab');
    for (let i = 0; i < 300 && center(tv.body)[0] < 28; i++) tick(room, 1, { pa: { right: true }, pb: { right: true } });
    expect(center(tv.body)[0]).toBeGreaterThanOrEqual(28);
    expect(tv.hp).toBeGreaterThan(0.8);
    press(room, 'pa', 'grab');
    press(room, 'pb', 'grab');
    tick(room, 20);
    expect(tv.state).toBe('delivered');
  });

  it('the house ends when the time runs out, and moves on to the next', () => {
    const room = play();
    room.steps = HOUSES[0]!.timeS * 30 - 1;
    tick(room, 2);
    expect(room.phase).toBe('DONE');
    expect(room.results[0]!.possible).toBe(game.possible(room));
    game.readyForNext(room, 'pa', ctxAt(0));
    game.readyForNext(room, 'pb', ctxAt(0));
    expect(room.house).toBe(1);
  });

  it('the view leaks no tokens and tells me my slot', () => {
    const room = play();
    const v = toPublicState(room, 'pb', 0);
    expect(v.mySlot).toBe(1);
    expect(v.items).toHaveLength(HOUSES[0]!.items.length);
    expect(JSON.stringify(v)).not.toContain('token-');
  });
});
