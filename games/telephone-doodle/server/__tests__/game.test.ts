import { describe, expect, it } from 'vitest';
import type { Drawing, Room } from '../../shared';
import { DrawingSchema } from '../../shared';
import * as game from '../game';
import { toPublicState } from '../view';

function seededRng(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    return s / 2 ** 32;
  };
}

const ctxAt = (now: number, rng = seededRng()) => ({ now, rng });
const doodle = (n = 2): Drawing => ({
  strokes: Array.from({ length: n }, (_, i) => ({ c: 1, w: 2, p: [i * 10, 0, i * 10 + 5, 50] })),
});

function twoPlayerRoom(overrides: Partial<Room['settings']> = {}) {
  const ctx = ctxAt(1000);
  const room = game.newRoom('ABCD', ctx);
  game.addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  game.addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.updateSettings(room, 'pa', { chaosOn: false, ...overrides });
  return { room, ctx };
}

function toSteps(room: Room, ctx = ctxAt(2000)) {
  game.submitPrompt(room, 'pa', 'SECRET-A a cat stealing a taco', false, ctx);
  game.submitPrompt(room, 'pb', 'SECRET-B a shark at the dentist', false, ctx);
}

/** Plays every draw/guess step with simple content. */
function playSteps(room: Room, ctx = ctxAt(3000)) {
  for (let s = 0; s < room.settings.steps; s++) {
    for (const p of ['pa', 'pb']) {
      if (game.stepKind(s) === 'drawing') game.submitDrawing(room, p, doodle(), ctx);
      else game.submitGuess(room, p, `guess-${p}-${s}`, ctx);
    }
  }
}

describe('lobby', () => {
  it('rejects a third player and non-host settings', () => {
    const { room } = twoPlayerRoom();
    expect(() => game.addPlayer(room, { id: 'pc', token: 'token-cccccccccc', name: 'C' })).toThrow(
      expect.objectContaining({ code: 'ROOM_FULL' }),
    );
    expect(() => game.updateSettings(room, 'pb', { rounds: 1 })).toThrow(expect.objectContaining({ code: 'NOT_HOST' }));
  });
});

describe('chains', () => {
  it('starts one chain per player, and owners draw while partners guess', () => {
    const { room, ctx } = twoPlayerRoom({ steps: 4 });
    game.startGame(room, 'pa', ctx);
    expect(room.phase).toBe('PROMPT');
    toSteps(room);
    expect(room.phase).toBe('STEP');
    const [c0, c1] = game.currentChains(room);
    // step 0 (draw): each owner draws their own prompt
    expect(game.chainFor(room, 'pa', 0)).toBe(c0);
    expect(game.chainFor(room, 'pb', 0)).toBe(c1);
    // step 1 (guess): each guesses the partner's chain
    expect(game.chainFor(room, 'pa', 1)).toBe(c1);
    expect(game.chainFor(room, 'pb', 1)).toBe(c0);
  });

  it('runs PROMPT → STEP × n → REVEAL → next round → RECAP → LOBBY', () => {
    const { room, ctx } = twoPlayerRoom({ rounds: 2, steps: 4 });
    game.startGame(room, 'pa', ctx);
    for (let round = 1; round <= 2; round++) {
      expect(room.round).toBe(round);
      toSteps(room);
      playSteps(room);
      expect(room.phase).toBe('REVEAL');
      expect(() => game.readyForNext(room, 'pa', ctx)).toThrow(expect.objectContaining({ code: 'WRONG_PHASE' }));
      // 5 entries per chain, prompt already showing: 4 + 1 (switch chain) + 4 clicks
      for (let i = 0; i < 9; i++) game.revealNext(room, i % 2 ? 'pa' : 'pb');
      expect(game.revealDone(room)).toBe(true);
      expect(() => game.revealNext(room, 'pa')).toThrow(expect.objectContaining({ code: 'WRONG_PHASE' }));
      game.readyForNext(room, 'pa', ctx);
      game.readyForNext(room, 'pb', ctx);
    }
    expect(room.phase).toBe('RECAP');
    expect(room.chains).toHaveLength(4);
    expect(room.chains.every((c) => c.entries.length === 5)).toBe(true);
    game.rematch(room, 'pa');
    expect(room.phase).toBe('LOBBY');
  });

  it('rejects drawing during a guess step, guessing during a draw step, and double submits', () => {
    const { room, ctx } = twoPlayerRoom();
    game.startGame(room, 'pa', ctx);
    toSteps(room);
    expect(() => game.submitGuess(room, 'pa', 'nope', ctx)).toThrow(expect.objectContaining({ code: 'WRONG_PHASE' }));
    game.submitDrawing(room, 'pa', doodle(), ctx);
    expect(() => game.submitDrawing(room, 'pa', doodle(), ctx)).toThrow(
      expect.objectContaining({ code: 'ALREADY_SUBMITTED' }),
    );
    game.submitDrawing(room, 'pb', doodle(), ctx);
    expect(() => game.submitDrawing(room, 'pa', doodle(), ctx)).toThrow(expect.objectContaining({ code: 'WRONG_PHASE' }));
  });

  it('allows two re-rolls of the dealt prompt', () => {
    const { room, ctx } = twoPlayerRoom();
    game.startGame(room, 'pa', ctx);
    game.rerollPrompt(room, 'pa', ctx);
    game.rerollPrompt(room, 'pa', ctx);
    expect(() => game.rerollPrompt(room, 'pa', ctx)).toThrow(expect.objectContaining({ code: 'NO_REROLLS' }));
  });
});

describe('chaos rules', () => {
  it('enforces the rules the server can check', () => {
    const d = doodle(8);
    expect(game.applyChaos(d, 'one-stroke').strokes).toHaveLength(1);
    expect(game.applyChaos(d, 'five-strokes').strokes).toHaveLength(5);
    expect(game.applyChaos(d, 'one-color').strokes.every((s) => s.c === 0)).toBe(true);
    expect(game.applyChaos(d, 'tiny').strokes.every((s) => s.w === 0)).toBe(true);
    expect(game.applyChaos(d, 'blind').strokes).toHaveLength(8);
  });

  it('only assigns chaos to drawing steps when turned on', () => {
    const { room, ctx } = twoPlayerRoom({ chaosOn: true, steps: 6 });
    game.startGame(room, 'pa', ctx);
    toSteps(room);
    for (const c of game.currentChains(room)) expect(Object.keys(c.chaosByStep).map(Number)).toEqual([0, 2, 4]);
  });

  it('validates drawings: grid bounds, x/y pairs, stroke limits', () => {
    expect(DrawingSchema.safeParse(doodle()).success).toBe(true);
    expect(DrawingSchema.safeParse({ strokes: [{ c: 0, w: 0, p: [0, 1001] }] }).success).toBe(false);
    expect(DrawingSchema.safeParse({ strokes: [{ c: 0, w: 0, p: [1, 2, 3] }] }).success).toBe(false);
    expect(DrawingSchema.safeParse({ strokes: [{ c: 99, w: 0, p: [1, 2] }] }).success).toBe(false);
    expect(DrawingSchema.safeParse(doodle(301)).success).toBe(false);
  });
});

describe('timers', () => {
  it('fills prompts from the deal, blank drawings and shrug guesses when time runs out', () => {
    const { room } = twoPlayerRoom({ drawSec: 45, guessSec: 20, steps: 2 });
    game.startGame(room, 'pa', ctxAt(0));
    expect(game.timeout(room, ctxAt(46_000))).toBe(false); // prompt phase is 45s + 3s grace
    game.timeout(room, ctxAt(49_000));
    expect(room.phase).toBe('STEP');
    expect(game.currentChains(room)[0]!.entries[0]).toMatchObject({ kind: 'prompt', fromDeck: true });

    game.submitDrawing(room, 'pa', doodle(), ctxAt(50_000));
    const fired = room.deadline! + 3000;
    game.timeout(room, ctxAt(fired));
    const blank = game.currentChains(room)[1]!.entries[1]!;
    expect(blank).toMatchObject({ kind: 'drawing', afk: true, by: 'pb' });
    expect(room.deadline).toBe(fired + 20_000); // the guess timer starts when the guess step begins

    game.timeout(room, ctxAt(room.deadline! + 3000));
    expect(room.phase).toBe('REVEAL');
    expect(game.currentChains(room)[0]!.entries[2]).toMatchObject({ kind: 'guess', text: game.AFK_GUESS, afk: true });
  });
});

describe('view redaction', () => {
  it('during a guess step, the guesser sees only the drawing, never the prompt', () => {
    const { room, ctx } = twoPlayerRoom({ steps: 4 });
    game.startGame(room, 'pa', ctx);
    toSteps(room);
    game.submitDrawing(room, 'pa', doodle(), ctx);
    game.submitDrawing(room, 'pb', doodle(), ctx);
    const forB = toPublicState(room, 'pb', 0);
    expect(forB.myTask).toMatchObject({ kind: 'guess', text: null });
    expect(forB.myTask?.drawing?.strokes).toHaveLength(2);
    expect(JSON.stringify(forB).includes('SECRET-A')).toBe(false);
    expect(JSON.stringify(forB).includes('SECRET-B')).toBe(false); // own prompt isn't echoed either
  });

  it('during a draw step, the drawer sees only the previous guess', () => {
    const { room, ctx } = twoPlayerRoom({ steps: 4 });
    game.startGame(room, 'pa', ctx);
    toSteps(room);
    game.submitDrawing(room, 'pa', doodle(), ctx);
    game.submitDrawing(room, 'pb', doodle(), ctx);
    game.submitGuess(room, 'pa', 'GUESS-BY-A', ctx);
    game.submitGuess(room, 'pb', 'GUESS-BY-B', ctx);
    // step 2: A draws chain 0 again, from B's guess of A's drawing
    const forA = toPublicState(room, 'pa', 0);
    expect(forA.myTask).toMatchObject({ kind: 'drawing', text: 'GUESS-BY-B' });
    expect(JSON.stringify(forA).includes('GUESS-BY-A')).toBe(false);
    expect(JSON.stringify(forA).includes('SECRET-A')).toBe(false);
  });

  it('unlocks chains one entry at a time during REVEAL, and hides chaos plans and tokens', () => {
    const { room, ctx } = twoPlayerRoom({ steps: 2, chaosOn: true });
    game.startGame(room, 'pa', ctx);
    toSteps(room);
    playSteps(room);
    let s = toPublicState(room, 'pb', 0);
    expect(s.chains.map((c) => c.entries.length)).toEqual([1, 0]);
    expect(s.chains.map((c) => c.total)).toEqual([3, 3]);
    expect(JSON.stringify(s).includes('SECRET-B')).toBe(false);
    expect(JSON.stringify(s).includes('chaosByStep')).toBe(false);
    expect(JSON.stringify(s).includes('token-')).toBe(false);
    game.revealNext(room, 'pa');
    game.revealNext(room, 'pa');
    game.revealNext(room, 'pa');
    s = toPublicState(room, 'pb', 0);
    expect(s.chains.map((c) => c.entries.length)).toEqual([3, 1]);
  });

  it('keeps earlier rounds viewable while the next round is played', () => {
    const { room, ctx } = twoPlayerRoom({ steps: 2, rounds: 2 });
    game.startGame(room, 'pa', ctx);
    toSteps(room);
    playSteps(room);
    for (let i = 0; i < 5; i++) game.revealNext(room, 'pa');
    game.readyForNext(room, 'pa', ctx);
    game.readyForNext(room, 'pb', ctx);
    const s = toPublicState(room, 'pa', 0);
    expect(s.phase).toBe('PROMPT');
    expect(s.chains).toHaveLength(2);
    expect(s.chains.every((c) => c.round === 1 && c.entries.length === 3)).toBe(true);
  });
});
