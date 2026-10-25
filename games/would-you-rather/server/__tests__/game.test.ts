import { describe, expect, it } from 'vitest';
import type { Room } from '../../shared';
import { computeStats } from '../../shared';
import * as game from '../game';
import { QUESTIONS } from '../content/questions';
import { toPublicState } from '../view';

function seededRng(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    return s / 2 ** 32;
  };
}

const ctxAt = (now: number, rng = seededRng()) => ({ now, rng });

function twoPlayerRoom(overrides: Partial<Room['settings']> = {}) {
  const ctx = ctxAt(1000);
  const room = game.newRoom('ABCD', ctx);
  game.addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  game.addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.updateSettings(room, 'pa', { customEvery: null, ...overrides });
  return { room, ctx };
}

/** Answers the current question; same picks → straight to RESULT, different → DEBATE. */
function both(room: Room, a: 'a' | 'b', b: 'a' | 'b', ctx = ctxAt(2000)) {
  game.answer(room, 'pa', a, b, ctx);
  game.answer(room, 'pb', b, a, ctx);
}

function next(room: Room, ctx = ctxAt(3000)) {
  game.readyForNext(room, 'pa', ctx);
  game.readyForNext(room, 'pb', ctx);
}

describe('lobby', () => {
  it('rejects a third player, non-host settings and starting alone', () => {
    const { room, ctx } = twoPlayerRoom();
    expect(() => game.addPlayer(room, { id: 'pc', token: 'token-cccccccccc', name: 'C' })).toThrow(
      expect.objectContaining({ code: 'ROOM_FULL' }),
    );
    expect(() => game.updateSettings(room, 'pb', { questions: 15 })).toThrow(expect.objectContaining({ code: 'NOT_HOST' }));
    room.players[1]!.connected = false;
    expect(() => game.startGame(room, 'pa', ctx)).toThrow(expect.objectContaining({ code: 'NEED_TWO_PLAYERS' }));
  });
});

describe('question flow', () => {
  it('a match goes straight to RESULT; a mismatch goes through DEBATE', () => {
    const { room, ctx } = twoPlayerRoom();
    game.startGame(room, 'pa', ctx);
    expect(room.phase).toBe('ANSWER');
    both(room, 'a', 'a');
    expect(room.phase).toBe('RESULT');
    next(room);
    both(room, 'a', 'b');
    expect(room.phase).toBe('DEBATE');
    game.defend(room, 'pa', 'Obviously A, look at it');
    expect(() => game.defend(room, 'pa', 'again')).toThrow(expect.objectContaining({ code: 'ALREADY_SUBMITTED' }));
    game.defend(room, 'pb', ''); // skip
    expect(room.phase).toBe('RESULT');
    expect(game.currentTurn(room)!.defenses).toEqual({ pa: 'Obviously A, look at it', pb: '' });
  });

  it('plays every question then RECAP, and rematch goes back to LOBBY', () => {
    const { room, ctx } = twoPlayerRoom({ questions: 10 });
    game.startGame(room, 'pa', ctx);
    for (let i = 1; i <= 10; i++) {
      expect(room.index).toBe(i);
      both(room, 'b', 'b');
      next(room);
    }
    expect(room.phase).toBe('RECAP');
    expect(room.turns).toHaveLength(10);
    expect(new Set(room.turns.map((t) => t.question.id)).size).toBe(10);
    game.rematch(room, 'pb');
    expect(room.phase).toBe('LOBBY');
  });

  it('rejects answering twice and answering outside ANSWER', () => {
    const { room, ctx } = twoPlayerRoom();
    expect(() => game.answer(room, 'pa', 'a', 'a', ctx)).toThrow(expect.objectContaining({ code: 'WRONG_PHASE' }));
    game.startGame(room, 'pa', ctx);
    game.answer(room, 'pa', 'a', 'a', ctx);
    expect(() => game.answer(room, 'pa', 'b', 'b', ctx)).toThrow(expect.objectContaining({ code: 'ALREADY_SUBMITTED' }));
  });

  it('only uses enabled categories', () => {
    const { room, ctx } = twoPlayerRoom({ categories: ['food'] });
    game.startGame(room, 'pa', ctx);
    const foodIds = new Set(QUESTIONS.filter((q) => q.category === 'food').map((q) => q.id));
    expect(foodIds.has(game.currentTurn(room)!.question.id)).toBe(true);
  });
});

describe('write-your-own questions', () => {
  it('every Nth question is written by the host first, then the partner', () => {
    const { room } = twoPlayerRoom({ customEvery: 3 });
    expect([1, 2, 3, 4, 5, 6, 9].map((i) => game.writerFor(room, i))).toEqual([null, null, 'pa', null, null, 'pb', 'pa']);
  });

  it('WRITE → ANSWER with the custom question, and only the writer may write', () => {
    const { room, ctx } = twoPlayerRoom({ customEvery: 3 });
    game.startGame(room, 'pa', ctx);
    both(room, 'a', 'a');
    next(room);
    both(room, 'a', 'a');
    next(room);
    expect(room.phase).toBe('WRITE');
    expect(room.writerId).toBe('pa');
    expect(() => game.writeQuestion(room, 'pb', 'nope nope', 'nope nope', ctx)).toThrow(
      expect.objectContaining({ code: 'NOT_YOUR_TURN' }),
    );
    expect(() => game.writeQuestion(room, 'pa', 'ok', 'fine then', ctx)).toThrow(expect.objectContaining({ code: 'TOO_SHORT' }));
    game.writeQuestion(room, 'pa', 'Would you rather eat a cold pizza?', 'skip dinner.', ctx);
    expect(room.phase).toBe('ANSWER');
    expect(game.currentTurn(room)!.question).toMatchObject({ a: 'eat a cold pizza', b: 'skip dinner', authorId: 'pa' });
  });
});

describe('timers', () => {
  it('auto-picks for whoever runs out of time, and skips missing defenses', () => {
    const { room } = twoPlayerRoom({ answerSec: 15 });
    game.startGame(room, 'pa', ctxAt(0));
    game.answer(room, 'pa', 'a', 'a', ctxAt(1000));
    expect(game.timeout(room, ctxAt(16_000))).toBe(false); // grace period
    expect(game.timeout(room, ctxAt(18_500))).toBe(true);
    const turn = game.currentTurn(room)!;
    expect(turn.autoPicked).toEqual(['pb']);
    expect(turn.picks.pb).toMatch(/^[ab]$/);
    if (room.phase === 'DEBATE') {
      game.timeout(room, ctxAt(room.deadline! + 3000));
      expect(turn.defenses).toEqual({ pa: '', pb: '' });
    }
    expect(room.phase).toBe('RESULT');
  });

  it('falls back to a deck question if the writer runs out of time', () => {
    const { room } = twoPlayerRoom({ customEvery: 3 });
    game.startGame(room, 'pa', ctxAt(0));
    both(room, 'a', 'a');
    next(room);
    both(room, 'a', 'a');
    next(room, ctxAt(5000));
    expect(room.phase).toBe('WRITE');
    game.timeout(room, ctxAt(room.deadline! + 3000));
    expect(room.phase).toBe('ANSWER');
    expect(game.currentTurn(room)!.question.authorId).toBeNull();
  });
});

describe('view redaction', () => {
  it("hides the partner's pick and prediction while answering", () => {
    const { room, ctx } = twoPlayerRoom();
    game.startGame(room, 'pa', ctx);
    game.answer(room, 'pa', 'b', 'a', ctx);
    const forB = toPublicState(room, 'pb', 0).current!;
    expect(forB.picks).toEqual({ pa: null, pb: null });
    expect(forB.predictions.pa).toBeNull();
    expect(forB.done).toEqual(['pa']);
    const forA = toPublicState(room, 'pa', 0).current!;
    expect(forA.picks.pa).toBe('b');
  });

  it('shows both picks in a debate but hides predictions and the partner defense', () => {
    const { room, ctx } = twoPlayerRoom();
    game.startGame(room, 'pa', ctx);
    both(room, 'a', 'b');
    game.defend(room, 'pa', 'SECRET-DEFENSE');
    const forB = toPublicState(room, 'pb', 0);
    expect(forB.current!.picks).toEqual({ pa: 'a', pb: 'b' });
    expect(forB.current!.predictions.pa).toBeNull();
    expect(JSON.stringify(forB).includes('SECRET-DEFENSE')).toBe(false);
    game.defend(room, 'pb', 'mine');
    expect(JSON.stringify(toPublicState(room, 'pb', 0)).includes('SECRET-DEFENSE')).toBe(true);
  });

  it('never includes tokens, and keeps finished questions in history', () => {
    const { room, ctx } = twoPlayerRoom();
    game.startGame(room, 'pa', ctx);
    both(room, 'a', 'a');
    next(room);
    const s = toPublicState(room, 'pa', 0);
    expect(JSON.stringify(s).includes('token-')).toBe(false);
    expect(s.history).toHaveLength(1);
    expect(s.history[0]!.picks).toEqual({ pa: 'a', pb: 'a' });
  });
});

describe('stats', () => {
  it('computes match rate, verdict, and prediction scores (ignoring auto-picks)', () => {
    const turns = [
      { picks: { pa: 'a', pb: 'a' }, predictions: { pa: 'a', pb: 'b' }, autoPicked: [] },
      { picks: { pa: 'a', pb: 'b' }, predictions: { pa: 'b', pb: 'a' }, autoPicked: [] },
      { picks: { pa: 'b', pb: 'b' }, predictions: { pa: 'a', pb: 'a' }, autoPicked: ['pb'] },
      { picks: { pa: 'b', pb: 'b' }, predictions: { pa: 'b', pb: 'b' }, autoPicked: [] },
    ] as const;
    const s = computeStats(
      turns.map((t) => ({ ...t, picks: { ...t.picks }, predictions: { ...t.predictions }, autoPicked: [...t.autoPicked] })),
      ['pa', 'pb'],
    );
    expect(s.matches).toBe(3);
    expect(s.total).toBe(4);
    expect(s.verdict.text).toBe('Two peas in a pod');
    expect(s.byPlayer.pa).toEqual({ readsRight: 3, readsTotal: 3 });
    expect(s.byPlayer.pb).toEqual({ readsRight: 2, readsTotal: 3 });
  });
});
