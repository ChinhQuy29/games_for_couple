import { describe, expect, it } from 'vitest';
import type { Room } from '../../shared';
import { CATEGORIES, FINALE_SIZE, pointsFor, rankFor } from '../../shared';
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
  game.updateSettings(room, 'pa', overrides);
  return { room, ctx };
}

/** Screen position of the right answer for the current question. */
function correctPos(room: Room): number {
  const turn = game.currentTurn(room)!;
  return turn.order.indexOf(game.questionById(turn.questionId).answer);
}

describe('question bank', () => {
  it('every question is complete, bilingual and sourced', () => {
    const ids = new Set<string>();
    const cats = new Set(CATEGORIES.map((c) => c.id));
    for (const q of QUESTIONS) {
      expect(ids.has(q.id), q.id).toBe(false);
      ids.add(q.id);
      expect(cats.has(q.category), q.id).toBe(true);
      expect(q.q.vi && q.q.en && q.explain.vi && q.explain.en, q.id).toBeTruthy();
      expect(q.source, q.id).toMatch(/^https:\/\//);
      const options = game.optionsOf(q);
      expect(options.length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.answer, q.id).toBeLessThan(options.length);
      for (const o of options) expect(o.vi && o.en, q.id).toBeTruthy();
      if (q.type === 'clues') expect(q.clues?.length, q.id).toBeGreaterThanOrEqual(2);
    }
  });

  it('has enough SGP questions for a finale and something in every category', () => {
    expect(QUESTIONS.filter((q) => q.sgp).length).toBeGreaterThanOrEqual(FINALE_SIZE * 3);
    for (const c of CATEGORIES) expect(QUESTIONS.some((q) => q.category === c.id), c.id).toBe(true);
  });
});

describe('planning a game', () => {
  it('picks unique questions, easy first, with an SGP finale at the end', () => {
    const { room, ctx } = twoPlayerRoom({ questions: 15 });
    game.startGame(room, 'pa', ctx);
    expect(room.plan).toHaveLength(15);
    expect(new Set(room.plan).size).toBe(15);
    expect(room.finaleSize).toBe(FINALE_SIZE);
    const finale = room.plan.slice(-FINALE_SIZE).map(game.questionById);
    expect(finale.every((q) => q.sgp)).toBe(true);
    const main = room.plan.slice(0, -FINALE_SIZE).map((id) => game.questionById(id).difficulty);
    expect([...main].sort()).toEqual(main);
    expect(game.isFinale(room, 12)).toBe(false);
    expect(game.isFinale(room, 13)).toBe(true);
  });

  it('respects categories and can turn the finale off', () => {
    const { room, ctx } = twoPlayerRoom({ categories: ['intl'], sgpFinale: false, questions: 10 });
    game.startGame(room, 'pa', ctx);
    expect(room.plan.every((id) => game.questionById(id).category === 'intl')).toBe(true);
    expect(room.finaleSize).toBe(0);
  });

  it('refuses to start with too few questions', () => {
    const { room, ctx } = twoPlayerRoom({ categories: ['game'], sgpFinale: false });
    if (game.poolSize(['game']) < 3) {
      expect(() => game.startGame(room, 'pa', ctx)).toThrow(expect.objectContaining({ code: 'NOT_ENOUGH_QUESTIONS' }));
    } else {
      game.startGame(room, 'pa', ctx);
      expect(room.plan.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('avoids repeats across a rematch', () => {
    const { room, ctx } = twoPlayerRoom({ questions: 10 });
    game.startGame(room, 'pa', ctx);
    const first = new Set(room.plan);
    room.phase = 'RECAP';
    game.rematch(room, 'pa');
    game.startGame(room, 'pa', ctxAt(2000, seededRng(7)));
    const overlap = room.plan.filter((id) => first.has(id));
    expect(overlap.length).toBe(0);
  });
});

describe('answering', () => {
  it('reveals once both answer, scoring the right one and resetting a wrong streak', () => {
    const { room, ctx } = twoPlayerRoom({ sgpFinale: false });
    game.startGame(room, 'pa', ctx);
    const right = correctPos(room);
    const wrong = (right + 1) % game.currentTurn(room)!.order.length;
    game.answer(room, 'pa', right, 2000, ctxAt(4000));
    expect(room.phase).toBe('QUESTION');
    game.answer(room, 'pb', wrong, 1000, ctxAt(4500));
    expect(room.phase).toBe('REVEAL');
    expect(room.scores.pa).toBeGreaterThan(0);
    expect(room.scores.pb).toBe(0);
    expect(room.streaks).toEqual({ pa: 1, pb: 0 });
    expect(() => game.answer(room, 'pa', 0, 0, ctx)).toThrow(expect.objectContaining({ code: 'WRONG_PHASE' }));
  });

  it('trusts device timing only within a lag window of the server clock', () => {
    const { room } = twoPlayerRoom({ sgpFinale: false });
    game.startGame(room, 'pa', ctxAt(1000));
    // Arrives 10s after the start but claims 0ms: can't be more than MAX_LAG_MS faster.
    game.answer(room, 'pa', 0, 0, ctxAt(11_000));
    expect(game.currentTurn(room)!.answers.pa!.elapsedMs).toBe(10_000 - game.MAX_LAG_MS);
    // An honest claim a little under the server time (network lag) is kept as-is.
    game.answer(room, 'pb', 0, 9_200, ctxAt(11_000));
    expect(game.currentTurn(room)!.answers.pb!.elapsedMs).toBe(9_200);
  });

  it('times out with no answer as wrong, and plays through to RECAP', () => {
    const { room } = twoPlayerRoom({ questions: 10, sgpFinale: false });
    game.startGame(room, 'pa', ctxAt(0));
    let now = 0;
    for (let i = 1; i <= room.plan.length; i++) {
      game.answer(room, 'pa', correctPos(room), 1000, ctxAt(now + 1000));
      now = room.deadline! + 2000;
      expect(game.tick(room, ctxAt(now))).toBe(true);
      expect(room.phase).toBe('REVEAL');
      expect(game.currentTurn(room)!.answers.pb).toEqual({ choice: null, elapsedMs: 0 });
      game.readyForNext(room, 'pa', ctxAt(now));
      game.readyForNext(room, 'pb', ctxAt(now));
    }
    expect(room.phase).toBe('RECAP');
    expect(room.scores.pb).toBe(0);
    expect(room.streaks.pa).toBe(room.plan.length);
  });
});

describe('scoring', () => {
  it('gives up to double points for speed and doubles the finale', () => {
    const base = { correct: true, type: 'mc' as const, limitSec: 20, clueCount: 0, finale: false };
    expect(pointsFor({ ...base, elapsedMs: 0 })).toBe(200);
    expect(pointsFor({ ...base, elapsedMs: 20_000 })).toBe(100);
    expect(pointsFor({ ...base, elapsedMs: 10_000 })).toBe(150);
    expect(pointsFor({ ...base, elapsedMs: 0, finale: true })).toBe(400);
    expect(pointsFor({ ...base, elapsedMs: 0, correct: false })).toBe(0);
  });

  it('pays clue questions by how many clues were showing', () => {
    const base = { correct: true, type: 'clues' as const, limitSec: 30, clueCount: 3, finale: false };
    expect(pointsFor({ ...base, elapsedMs: 5_000 })).toBe(300);
    expect(pointsFor({ ...base, elapsedMs: 15_000 })).toBe(200);
    expect(pointsFor({ ...base, elapsedMs: 25_000 })).toBe(100);
  });

  it('maps accuracy to Liên Quân ranks', () => {
    expect(rankFor(0, 10).name.en).toBe('Bronze');
    expect(rankFor(5, 10).name.vi).toBe('Bạch Kim');
    expect(rankFor(10, 10).name.vi).toBe('Thách Đấu');
  });
});

describe('clues and timers', () => {
  it('reveals clues over time and wakes the server for each new clue', () => {
    const { room } = twoPlayerRoom({ sgpFinale: false, timeSec: 15 });
    game.startGame(room, 'pa', ctxAt(0));
    room.turns = [];
    room.plan[0] = 'clue-bang';
    game.enterQuestion(room, 1, ctxAt(0));
    const limitMs = (15 + 15) * 1000; // clue questions get +15s
    expect(room.deadline).toBe(limitMs);
    expect(toPublicState(room, 'pa', 1000).current!.question.clues).toHaveLength(1);
    expect(toPublicState(room, 'pa', 11_000).current!.question.clues).toHaveLength(2);
    expect(toPublicState(room, 'pa', 21_000).current!.question.clues).toHaveLength(3);
    expect(game.wakeAt(room, 500)).toBe(10_000);
    expect(game.wakeAt(room, 10_500)).toBe(20_000);
    expect(game.wakeAt(room, 20_500)).toBe(limitMs + 2000);
    expect(game.tick(room, ctxAt(10_000))).toBe(true); // rebroadcast for the new clue, still open
    expect(room.phase).toBe('QUESTION');
    // Answering on the 2nd clue pays 200.
    game.answer(room, 'pa', correctPos(room), 12_000, ctxAt(12_000));
    game.answer(room, 'pb', correctPos(room), 25_000, ctxAt(25_000));
    expect(game.currentTurn(room)!.points).toEqual({ pa: 200, pb: 100 });
  });
});

describe('view redaction', () => {
  it('hides the answer, explanation and partner answer while the question is open', () => {
    const { room, ctx } = twoPlayerRoom({ sgpFinale: false });
    game.startGame(room, 'pa', ctx);
    game.answer(room, 'pa', 1, 1000, ctxAt(3000));
    const forB = toPublicState(room, 'pb', 3000);
    expect(forB.current!.question.correct).toBeNull();
    expect(forB.current!.question.explain).toBeNull();
    expect(forB.current!.answers.pa).toBeNull();
    expect(forB.current!.done).toEqual(['pa']);
    const q = game.questionById(game.currentTurn(room)!.questionId);
    expect(JSON.stringify(forB).includes(q.explain.en)).toBe(false);
    expect(JSON.stringify(forB).includes('token-')).toBe(false);
  });

  it('shows everything after the reveal, in shuffled display order', () => {
    const { room, ctx } = twoPlayerRoom({ sgpFinale: false });
    game.startGame(room, 'pa', ctx);
    game.answer(room, 'pa', 0, 1000, ctxAt(3000));
    game.answer(room, 'pb', 1, 1000, ctxAt(3000));
    const s = toPublicState(room, 'pb', 4000).current!;
    const q = game.questionById(game.currentTurn(room)!.questionId);
    expect(s.question.options[s.question.correct!]).toEqual(game.optionsOf(q)[q.answer]);
    expect(s.answers.pa!.choice).toBe(0);
    expect(s.points).not.toBeNull();
  });
});

describe('flags', () => {
  it('toggles a 🚩 on a revealed question', () => {
    const { room, ctx } = twoPlayerRoom({ sgpFinale: false });
    game.startGame(room, 'pa', ctx);
    expect(() => game.flag(room, 'pa', 1)).toThrow(expect.objectContaining({ code: 'WRONG_PHASE' }));
    game.answer(room, 'pa', 0, 1000, ctxAt(3000));
    game.answer(room, 'pb', 0, 1000, ctxAt(3000));
    const id = game.flag(room, 'pb', 1);
    expect(room.flagged).toEqual([id]);
    expect(toPublicState(room, 'pa', 4000).current!.flagged).toBe(true);
    game.flag(room, 'pa', 1);
    expect(room.flagged).toEqual([]);
  });
});
