import { describe, expect, it } from 'vitest';
import { addPlayer, seededRng } from '@gfc/kit/server';
import { LEVELS, RECIPES, TIMING, ingredientsFor, isPlate, plateMatches, type Item, type Room } from '../../shared';
import * as game from '../game';
import { toPublicState } from '../index';

const ctxAt = (now: number, seed = 1) => ({ now, rng: seededRng(seed) });
const T0 = TIMING.countdownMs; // the shift opens here

function shift(level: Room['level'] = 1) {
  const room = game.newRoom('ABCD', ctxAt(0));
  addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.setLevel(room, 'pa', level);
  game.startGame(room, 'pa', ctxAt(0));
  const { prep, cook } = room.sides!;
  return { room, prep, cook };
}

const item = (ing: Item['ing'], chopped = false, cooked = false): Item => ({ id: 0, ing, chopped, cooked, burnt: false });

/** Click the same station n times at time t. */
const clickN = (room: Room, me: string, st: string, n: number, t = T0 + 10) => {
  for (let i = 0; i < n; i++) game.click(room, me, st, ctxAt(t));
};

describe('recipes', () => {
  it('a plate matches a recipe in any order, and nothing extra', () => {
    expect(plateMatches([item('tomato', true), item('lettuce', true)], 'salad')).toBe(true);
    expect(plateMatches([item('tomato', true), item('lettuce')], 'salad')).toBe(false);
    expect(plateMatches([item('tomato', true), item('lettuce', true), item('bun')], 'salad')).toBe(false);
    expect(plateMatches([item('meat', false, true), item('bun'), item('lettuce', true)], 'burger')).toBe(true);
  });

  it('every level has crates for every ingredient its recipes need', () => {
    for (const lv of [1, 2, 3] as const) {
      const ings = ingredientsFor(lv);
      for (const r of LEVELS[lv].recipes) for (const p of RECIPES[r].parts) expect(ings).toContain(p.split('+')[0]);
    }
    expect(ingredientsFor(1)).not.toContain('fish');
  });
});

describe('a shift', () => {
  it('starts after the countdown with sides assigned and an order soon after', () => {
    const { room, prep, cook } = shift();
    expect(prep).not.toBe(cook);
    expect(() => game.click(room, prep, 'crate:lettuce', ctxAt(T0 - 1))).toThrow(/Wait/);
    expect(room.orders).toHaveLength(0);
    expect(game.wakeAt(room)).toBe(T0 + TIMING.firstOrderMs);
    game.tick(room, ctxAt(T0 + TIMING.firstOrderMs));
    expect(room.orders).toHaveLength(1);
  });

  it('each side only uses its own stations, and both use the pass', () => {
    const { room, prep, cook } = shift();
    expect(() => game.click(room, cook, 'crate:lettuce', ctxAt(T0 + 10))).toThrow(/partner's side/);
    expect(() => game.click(room, prep, 'stove:1', ctxAt(T0 + 10))).toThrow(/partner's side/);
    game.click(room, prep, 'crate:bun', ctxAt(T0 + 10));
    game.click(room, prep, 'pass:1', ctxAt(T0 + 10));
    game.click(room, cook, 'pass:1', ctxAt(T0 + 10));
    expect((room.hands[cook] as Item).ing).toBe('bun');
  });

  it('chopping takes several clicks; only choppable things can be chopped', () => {
    const { room, prep } = shift();
    game.click(room, prep, 'crate:bun', ctxAt(T0 + 10));
    expect(() => game.click(room, prep, 'board:1', ctxAt(T0 + 10))).toThrow(/can't chop/);
    game.click(room, prep, 'crate:bun', ctxAt(T0 + 10)); // put it back
    expect(room.hands[prep]).toBeNull();
    game.click(room, prep, 'crate:lettuce', ctxAt(T0 + 10));
    game.click(room, prep, 'board:1', ctxAt(T0 + 10)); // put down
    clickN(room, prep, 'board:1', TIMING.chopClicks - 1);
    expect((room.stations.find((s) => s.id === 'board:1')!.content as Item).chopped).toBe(false);
    game.click(room, prep, 'board:1', ctxAt(T0 + 10));
    expect((room.stations.find((s) => s.id === 'board:1')!.content as Item).chopped).toBe(true);
    game.click(room, prep, 'board:1', ctxAt(T0 + 10)); // pick up
    expect((room.hands[prep] as Item).chopped).toBe(true);
  });

  it('cooking: still cooking, then done, then burnt', () => {
    const { room, cook } = shift();
    room.hands[cook] = item('meat');
    game.click(room, cook, 'stove:1', ctxAt(T0 + 1000));
    expect(() => game.click(room, cook, 'stove:1', ctxAt(T0 + 1000 + TIMING.cookMs - 1))).toThrow(/Still cooking/);
    game.click(room, cook, 'stove:1', ctxAt(T0 + 1000 + TIMING.cookMs));
    expect(room.hands[cook]).toMatchObject({ ing: 'meat', cooked: true, burnt: false });

    room.hands[cook] = item('rice');
    game.click(room, cook, 'stove:2', ctxAt(T0 + 20_000));
    // Nobody comes back: the server wakes up when it's done and again when it burns.
    expect(game.wakeAt(room)).toBeLessThanOrEqual(T0 + 20_000 + TIMING.cookMs);
    game.tick(room, ctxAt(T0 + 20_000 + TIMING.cookMs + TIMING.burnMs));
    expect(room.burnt).toBe(1);
    game.click(room, cook, 'trash:cook', ctxAt(T0 + 40_000)); // drop the cooked meat
    game.click(room, cook, 'stove:2', ctxAt(T0 + 40_000));
    expect(room.hands[cook]).toMatchObject({ ing: 'rice', burnt: true });
  });

  it('a full salad: chop, pass, plate, serve for coins plus a tip', () => {
    const { room, prep, cook } = shift();
    room.orders = [{ id: 99, recipe: 'salad', placedAt: T0, expiresAt: T0 + LEVELS[1].patienceMs }];
    room.nextOrderAt = T0 + 999_999;
    for (const [ing, board, pass] of [['lettuce', 'board:1', 'pass:1'], ['tomato', 'board:2', 'pass:2']] as const) {
      game.click(room, prep, `crate:${ing}`, ctxAt(T0 + 10));
      game.click(room, prep, board, ctxAt(T0 + 10));
      clickN(room, prep, board, TIMING.chopClicks);
      game.click(room, prep, board, ctxAt(T0 + 10));
      game.click(room, prep, pass, ctxAt(T0 + 10));
    }
    game.click(room, cook, 'plates', ctxAt(T0 + 10));
    game.click(room, cook, 'counter:1', ctxAt(T0 + 10)); // plate down
    game.click(room, cook, 'pass:1', ctxAt(T0 + 10));
    game.click(room, cook, 'counter:1', ctxAt(T0 + 10)); // lettuce onto the plate
    game.click(room, cook, 'counter:1', ctxAt(T0 + 10)); // pick the plate up
    game.click(room, cook, 'pass:2', ctxAt(T0 + 10)); // scoop the tomato straight onto it
    expect(isPlate(room.hands[cook]) && room.hands[cook].items).toHaveLength(2);
    const gain = game.click(room, cook, 'serve', ctxAt(T0 + 10));
    expect(gain).toBe('+30'); // 2 parts × 10 + a full tip of 10
    expect(room.coins).toBe(30);
    expect(room.served).toBe(1);
    expect(room.orders).toHaveLength(0);
    expect(room.hands[cook]).toBeNull();
  });

  it('a dish nobody ordered is refused; trash empties a plate', () => {
    const { room, cook } = shift();
    room.orders = [{ id: 99, recipe: 'burger', placedAt: T0, expiresAt: T0 + 60_000 }];
    room.hands[cook] = { id: 5, plate: true, items: [item('lettuce', true), item('tomato', true)] };
    expect(() => game.click(room, cook, 'serve', ctxAt(T0 + 10))).toThrow(/Nobody ordered/);
    game.click(room, cook, 'trash:cook', ctxAt(T0 + 10));
    expect(room.hands[cook]).toMatchObject({ plate: true, items: [] });
  });

  it('orders expire for a penalty (never below 0), and the shift ends with stars', () => {
    const { room } = shift();
    room.coins = 5;
    room.orders = [{ id: 99, recipe: 'soup', placedAt: T0, expiresAt: T0 + 100 }];
    room.nextOrderAt = T0 + 999_999;
    game.tick(room, ctxAt(T0 + 100));
    expect(room.orders).toHaveLength(0);
    expect(room.expired).toBe(1);
    expect(room.coins).toBe(0);
    room.coins = LEVELS[1].stars[1];
    game.tick(room, ctxAt(room.endsAt));
    expect(room.phase).toBe('SUMMARY');
    expect(room.results[0]).toMatchObject({ stars: 2, expired: 1 });
  });

  it('next shift swaps sides; everyone sees the kitchen and their own side', () => {
    const { room, prep, cook } = shift();
    game.tick(room, ctxAt(room.endsAt));
    game.readyForNext(room, prep, ctxAt(room.endsAt + 1));
    expect(room.phase).toBe('SUMMARY');
    game.readyForNext(room, cook, ctxAt(room.endsAt + 1));
    expect(room.phase).toBe('SHIFT');
    expect(room.sides).toEqual({ prep: cook, cook: prep });
    const view = toPublicState(room, prep, 0);
    expect(view.mySide).toBe('cook');
    expect(JSON.stringify(view)).not.toContain('token-');
  });
});
