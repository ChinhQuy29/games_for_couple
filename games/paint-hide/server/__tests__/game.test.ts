import { describe, expect, it } from 'vitest';
import { addPlayer, seededRng } from '@gfc/kit/server';
import { CLICKS, CREATURE_SCALE, ROUNDS, SCENE, TIMING, buildScene, hits, toLocal, type Room } from '../../shared';
import * as game from '../game';
import { toPublicState } from '../index';

const ctxAt = (now: number, seed = 1) => ({ now, rng: seededRng(seed) });
const PNG = 'data:image/png;base64,iVBORw0KGgo=';

function play() {
  const room = game.newRoom('ABCD', ctxAt(0));
  addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.startGame(room, 'pa', ctxAt(1000));
  const hider = room.hiderId!;
  const seeker = hider === 'pa' ? 'pb' : 'pa';
  return { room, hider, seeker };
}

const hideAt = (room: Room, hider: string, x = 600, y = 400, rot = 0, flip = false, now = 5000) => game.hide(room, hider, { x, y, rot, flip }, PNG, ctxAt(now));

describe('the creature', () => {
  it('the body centre hits, far away misses, and rotation and flipping move the tail', () => {
    const p = { x: 600, y: 400, rot: 0, flip: false };
    expect(hits(p, 600, 400)).toBe(true);
    expect(hits(p, 600, 100)).toBe(false);
    const tail = [600 - 106 * CREATURE_SCALE, 400 + 34 * CREATURE_SCALE] as const;
    expect(hits(p, ...tail)).toBe(true);
    expect(hits({ ...p, flip: true }, ...tail)).toBe(false);
    expect(hits({ ...p, flip: true }, 600 + 106 * CREATURE_SCALE, 400 + 34 * CREATURE_SCALE)).toBe(true);
    const [lx, ly] = toLocal({ ...p, rot: 90 }, 600, 400 + 75 * CREATURE_SCALE);
    expect(lx).toBeCloseTo(75, 3);
    expect(ly).toBeCloseTo(0, 3);
  });

  it('the scene is the same for the same seed and different for another', () => {
    expect(buildScene(42, SCENE.w, SCENE.h)).toEqual(buildScene(42, SCENE.w, SCENE.h));
    expect(buildScene(42, SCENE.w, SCENE.h)).not.toEqual(buildScene(43, SCENE.w, SCENE.h));
    expect(buildScene(7, SCENE.w, SCENE.h).shapes.length).toBeGreaterThan(200);
  });
});

describe('a round', () => {
  it('only the hider hides; the seeker sees nothing until seeking starts', () => {
    const { room, hider, seeker } = play();
    expect(() => hideAt(room, seeker)).toThrow(/seeking/);
    expect(toPublicState(room, seeker, 0).placement).toBeNull();
    hideAt(room, hider);
    expect(room.phase).toBe('SEEK');
    expect(toPublicState(room, seeker, 0).placement).toEqual({ x: 600, y: 400, rot: 0, flip: false });
    expect(toPublicState(room, seeker, 0).paint).toBe(PNG);
  });

  it('a hit reveals and scores for the seeker, faster is better', () => {
    const { room, hider, seeker } = play();
    hideAt(room, hider);
    expect(() => game.click(room, hider, 600, 400, ctxAt(6000))).toThrow(/hiding/);
    expect(game.click(room, seeker, 100, 100, ctxAt(6000))).toBe(false);
    expect(game.click(room, seeker, 600, 400, ctxAt(7000))).toBe(true);
    expect(room.phase).toBe('REVEAL');
    expect(room.results[0]).toMatchObject({ found: true, secs: 2, pointsTo: seeker });
    expect(room.scores[seeker]).toBe(100 + 23 * 4);
  });

  it('three misses or the timer: the hider gets the points', () => {
    const a = play();
    hideAt(a.room, a.hider);
    for (let i = 0; i < CLICKS; i++) game.click(a.room, a.seeker, 50 + i * 10, 50, ctxAt(6000));
    expect(a.room.results[0]).toMatchObject({ found: false, pointsTo: a.hider, points: 150 });
    const b = play();
    hideAt(b.room, b.hider);
    expect(game.wakeAt(b.room)).toBe(5000 + TIMING.seekMs);
    game.tick(b.room, ctxAt(5000 + TIMING.seekMs));
    expect(b.room.phase).toBe('REVEAL');
    expect(b.room.found).toBe(false);
  });

  it('a hider who never submits gets hidden unpainted after the grace period', () => {
    const { room } = play();
    game.tick(room, ctxAt(1000 + TIMING.hideMs + TIMING.graceMs));
    expect(room.phase).toBe('SEEK');
    expect(room.placement).not.toBeNull();
    expect(room.paint).toBeNull();
  });

  it('roles swap every round, and the game ends after the last one', () => {
    const { room } = play();
    const hiders: string[] = [];
    for (let r = 0; r < ROUNDS; r++) {
      hiders.push(room.hiderId!);
      hideAt(room, room.hiderId!);
      game.tick(room, ctxAt(5000 + TIMING.seekMs));
      game.readyForNext(room, 'pa', ctxAt(40_000));
      game.readyForNext(room, 'pb', ctxAt(40_000));
    }
    expect(hiders[0]).not.toBe(hiders[1]);
    expect(hiders[1]).not.toBe(hiders[2]);
    expect(room.phase).toBe('FINISH');
    expect(Object.values(room.scores).reduce((a, b) => a + b, 0)).toBe(ROUNDS * 150);
    expect(JSON.stringify(toPublicState(room, 'pa', 0))).not.toContain('token-');
  });
});
