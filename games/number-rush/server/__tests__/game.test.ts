import { describe, expect, it } from 'vitest';
import { addPlayer, seededRng } from '@gfc/kit/server';
import { TIMING, WORLD, type Room } from '../../shared';
import * as game from '../game';
import { toPublicState } from '../index';

const ctxAt = (now: number, seed = 1) => ({ now, rng: seededRng(seed) });

function started(settings: Partial<Room['settings']> = {}) {
  const room = game.newRoom('ABCD', ctxAt(0));
  addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.updateSettings(room, 'pa', settings);
  game.startGame(room, 'pa', ctxAt(0));
  return room;
}

const GO = TIMING.countdownMs;

describe('board', () => {
  it('places every number once, inside the world, without two on the same spot', () => {
    for (const count of [30, 50, 100]) {
      for (const style of ['calm', 'chaos'] as const) {
        const board = game.buildBoard(count, style, seededRng(count));
        expect(board.map((c) => c.n).sort((a, b) => a - b)).toEqual(Array.from({ length: count }, (_, i) => i + 1));
        for (const c of board) {
          expect(c.x).toBeGreaterThan(0);
          expect(c.x).toBeLessThan(WORLD.w);
          expect(c.y).toBeGreaterThan(0);
          expect(c.y).toBeLessThan(WORLD.h);
        }
        // No two numbers closer than a small font: they're in different grid cells.
        for (let i = 0; i < board.length; i++)
          for (let j = i + 1; j < board.length; j++) {
            const a = board[i]!;
            const b = board[j]!;
            expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(30);
          }
      }
    }
  });

  it('builds ascending, descending and random sequences', () => {
    expect(game.buildSequence(5, 'asc', seededRng())).toEqual([1, 2, 3, 4, 5]);
    expect(game.buildSequence(5, 'desc', seededRng())).toEqual([5, 4, 3, 2, 1]);
    const r = game.buildSequence(30, 'random', seededRng(3));
    expect([...r].sort((a, b) => a - b)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    expect(r).not.toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });
});

describe('playing', () => {
  it('ignores clicks during the countdown', () => {
    const room = started();
    expect(() => game.pickNumber(room, 'pa', 1, 0, ctxAt(GO - 1))).toThrow(expect.objectContaining({ code: 'TOO_EARLY' }));
  });

  it('a wrong number locks you out briefly; an already-found one is harmless', () => {
    const room = started({ count: 30 });
    expect(game.pickNumber(room, 'pa', 5, 100, ctxAt(GO + 100))).toBe('wrong');
    expect(() => game.pickNumber(room, 'pa', 1, 200, ctxAt(GO + 200))).toThrow(expect.objectContaining({ code: 'LOCKED' }));
    game.pickNumber(room, 'pb', 1, 300, ctxAt(GO + 300));
    game.tick(room, ctxAt(GO + 300 + TIMING.photoFinishMs));
    expect(room.scores.pb).toBe(1);
    expect(game.pickNumber(room, 'pb', 1, 10, ctxAt(GO + 2000))).toBe('late');
    expect(room.lockedUntil.pb ?? 0).toBeLessThan(GO + 2000);
  });

  it('when both click the right number, the faster device-timed reaction wins', () => {
    const room = started({ count: 30 });
    // Alex's click reaches the server first, but Bao reacted faster on his own device.
    game.pickNumber(room, 'pa', 1, 900, ctxAt(GO + 1000));
    expect(room.pending?.claims).toHaveLength(1);
    game.pickNumber(room, 'pb', 1, 700, ctxAt(GO + 1100));
    expect(room.pending).toBeNull(); // both claimed: resolved at once
    expect(room.finds[0]).toMatchObject({ n: 1, by: 'pb' });
    expect(game.currentTarget(room)).toBe(2);
  });

  it('a lone claim wins after the photo-finish window', () => {
    const room = started({ count: 30 });
    game.pickNumber(room, 'pa', 1, 500, ctxAt(GO + 500));
    expect(game.wakeAt(room)).toBe(GO + 500 + TIMING.photoFinishMs);
    expect(game.tick(room, ctxAt(GO + 600))).toBe(false);
    expect(game.tick(room, ctxAt(GO + 500 + TIMING.photoFinishMs))).toBe(true);
    expect(room.scores).toEqual({ pa: 1, pb: 0 });
  });

  it("doesn't trust an impossibly fast claim", () => {
    const room = started({ count: 30 });
    game.pickNumber(room, 'pa', 1, 0, ctxAt(GO + 10_000));
    expect(room.pending!.claims[0]!.ms).toBe(10_000 - TIMING.maxLagMs);
  });

  it('follows the chosen order to the end, then RECAP and rematch', () => {
    const room = started({ count: 30, order: 'desc' });
    let now = GO;
    for (let i = 0; i < 30; i++) {
      const target = game.currentTarget(room)!;
      expect(target).toBe(30 - i);
      now += 100;
      game.pickNumber(room, i % 2 ? 'pa' : 'pb', target, 50, ctxAt(now));
      now += TIMING.photoFinishMs;
      game.tick(room, ctxAt(now));
    }
    expect(room.phase).toBe('RECAP');
    expect(room.scores.pa! + room.scores.pb!).toBe(30);
    game.rematch(room, 'pa');
    expect(room.phase).toBe('LOBBY');
  });
});

describe('view', () => {
  it('shares the board and target, only my own lock, and never tokens', () => {
    const room = started({ count: 30 });
    game.pickNumber(room, 'pa', 9, 100, ctxAt(GO + 100));
    const forA = toPublicState(room, 'pa', 0);
    const forB = toPublicState(room, 'pb', 0);
    expect(forA.target).toBe(1);
    expect(forA.board).toHaveLength(30);
    expect(forA.myLockUntil).toBeGreaterThan(0);
    expect(forB.myLockUntil).toBe(0);
    expect(JSON.stringify(forA).includes('token-')).toBe(false);
  });
});
