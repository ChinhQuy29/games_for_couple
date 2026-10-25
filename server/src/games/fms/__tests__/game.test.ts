import { describe, expect, it } from 'vitest';
import type { Room } from '@gfc/shared';
import * as game from '../game';
import { STARTERS } from '../content/starters';
import { AFK_ENDINGS } from '../content/afk';
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
  const a = game.addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  const b = game.addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.updateSettings(room, a.id, overrides);
  return { room, a, b, ctx };
}

function playToReveal(room: Room, ctx = ctxAt(2000)) {
  game.submitStarter(room, 'pa', 'The duck was furious because', false, ctx);
  game.submitStarter(room, 'pb', 'My secret talent is', false, ctx);
  game.submitEnding(room, 'pa', 'it owed me money');
  game.submitEnding(room, 'pb', 'eating spaghetti upside down');
}

describe('lobby', () => {
  it('first player is host, third player is rejected', () => {
    const { room } = twoPlayerRoom();
    expect(room.players[0]!.isHost).toBe(true);
    expect(room.players[1]!.isHost).toBe(false);
    expect(() => game.addPlayer(room, { id: 'pc', token: 'token-cccccccccc', name: 'Cat' })).toThrow(
      expect.objectContaining({ code: 'ROOM_FULL' }),
    );
  });

  it('only the host can change settings or start', () => {
    const { room, ctx } = twoPlayerRoom();
    expect(() => game.updateSettings(room, 'pb', { rounds: 3 })).toThrow(expect.objectContaining({ code: 'NOT_HOST' }));
    expect(() => game.startGame(room, 'pb', ctx)).toThrow(expect.objectContaining({ code: 'NOT_HOST' }));
  });

  it('needs two connected players to start', () => {
    const { room, ctx } = twoPlayerRoom();
    room.players[1]!.connected = false;
    expect(() => game.startGame(room, 'pa', ctx)).toThrow(expect.objectContaining({ code: 'NEED_TWO_PLAYERS' }));
  });

  it('when the host leaves, the partner becomes host and the game resets', () => {
    const { room, ctx } = twoPlayerRoom();
    game.startGame(room, 'pa', ctx);
    game.removePlayer(room, 'pa');
    expect(room.players[0]!.isHost).toBe(true);
    expect(room.phase).toBe('LOBBY');
  });
});

describe('round flow', () => {
  it('goes START → FINISH → REVEAL → next round → RECAP → LOBBY', () => {
    const { room, ctx } = twoPlayerRoom({ rounds: 3 });
    game.startGame(room, 'pa', ctx);
    for (let round = 1; round <= 3; round++) {
      expect(room.phase).toBe('START');
      expect(room.round).toBe(round);
      playToReveal(room);
      expect(room.phase).toBe('REVEAL');
      expect(() => game.readyForNext(room, 'pa', ctx)).toThrow(expect.objectContaining({ code: 'WRONG_PHASE' }));
      game.revealNext(room, 'pa');
      game.revealNext(room, 'pb');
      game.readyForNext(room, 'pa', ctx);
      expect(room.phase).toBe('REVEAL');
      game.readyForNext(room, 'pb', ctx);
    }
    expect(room.phase).toBe('RECAP');
    expect(room.sentences).toHaveLength(6);
    game.rematch(room, 'pb');
    expect(room.phase).toBe('LOBBY');
    expect(room.sentences).toHaveLength(0);
  });

  it('swaps starters: each player finishes the other one', () => {
    const { room, ctx } = twoPlayerRoom();
    game.startGame(room, 'pa', ctx);
    playToReveal(room);
    const [s0, s1] = game.currentSentences(room);
    expect(s0).toMatchObject({ starterAuthorId: 'pa', finisherId: 'pb', starter: 'The duck was furious because…' });
    expect(s1).toMatchObject({ starterAuthorId: 'pb', finisherId: 'pa', ending: 'it owed me money' });
  });

  it('only the starter author reveals, in order', () => {
    const { room, ctx } = twoPlayerRoom();
    game.startGame(room, 'pa', ctx);
    playToReveal(room);
    expect(() => game.revealNext(room, 'pb')).toThrow(expect.objectContaining({ code: 'NOT_YOUR_TURN' }));
    game.revealNext(room, 'pa');
    expect(() => game.revealNext(room, 'pa')).toThrow(expect.objectContaining({ code: 'NOT_YOUR_TURN' }));
  });

  it('lets the partner reveal if the author is disconnected', () => {
    const { room, ctx } = twoPlayerRoom();
    game.startGame(room, 'pa', ctx);
    playToReveal(room);
    room.players[0]!.connected = false;
    game.revealNext(room, 'pb');
    expect(room.revealIndex).toBe(1);
  });

  it('rejects wrong-phase actions and double submits', () => {
    const { room, ctx } = twoPlayerRoom();
    expect(() => game.submitEnding(room, 'pa', 'x')).toThrow(expect.objectContaining({ code: 'WRONG_PHASE' }));
    game.startGame(room, 'pa', ctx);
    game.submitStarter(room, 'pa', 'Hello there friend', false, ctx);
    expect(() => game.submitStarter(room, 'pa', 'again again', false, ctx)).toThrow(
      expect.objectContaining({ code: 'ALREADY_SUBMITTED' }),
    );
    expect(() => game.submitStarter(room, 'pb', '  a ', false, ctx)).toThrow(expect.objectContaining({ code: 'TOO_SHORT' }));
  });
});

describe('deck', () => {
  it('allows one deal plus two re-rolls', () => {
    const { room, ctx } = twoPlayerRoom();
    game.startGame(room, 'pa', ctx);
    game.dealStarter(room, 'pa', ctx);
    game.dealStarter(room, 'pa', ctx);
    game.dealStarter(room, 'pa', ctx);
    expect(() => game.dealStarter(room, 'pa', ctx)).toThrow(expect.objectContaining({ code: 'NO_REROLLS' }));
  });

  it('respects categories and does not repeat until exhausted', () => {
    const { room } = twoPlayerRoom({ categories: ['food'] });
    const rng = seededRng(7);
    const foodCount = STARTERS.filter((s) => s.category === 'food').length;
    const seen = new Set<string>();
    for (let i = 0; i < foodCount; i++) {
      const s = game.drawStarter(room, rng);
      expect(s.id.startsWith('food-')).toBe(true);
      expect(seen.has(s.id)).toBe(false);
      seen.add(s.id);
    }
    // Deck exhausted → it reshuffles instead of throwing.
    expect(game.drawStarter(room, rng).id.startsWith('food-')).toBe(true);
  });
});

describe('timers', () => {
  it('fills missing starters from the deck and missing endings with AFK lines', () => {
    const { room } = twoPlayerRoom({ timerSec: 30 });
    game.startGame(room, 'pa', ctxAt(10_000));
    expect(room.deadline).toBe(40_000);
    game.submitStarter(room, 'pa', 'The moon called and said', false, ctxAt(12_000));
    expect(game.timeout(room, ctxAt(41_000))).toBe(false); // still inside the grace period
    expect(game.timeout(room, ctxAt(43_000))).toBe(true);
    expect(room.phase).toBe('FINISH');
    const fromB = game.currentSentences(room).find((s) => s.starterAuthorId === 'pb')!;
    expect(fromB.starterFromDeck).toBe(true);

    game.submitEnding(room, 'pb', 'hi');
    game.timeout(room, ctxAt(room.deadline! + 5000));
    expect(room.phase).toBe('REVEAL');
    const finishedByA = game.currentSentences(room).find((s) => s.finisherId === 'pa')!;
    expect(finishedByA.endingWasAfk).toBe(true);
    expect(AFK_ENDINGS).toContain(finishedByA.ending);
  });

  it('has no deadline when the timer is off', () => {
    const { room, ctx } = twoPlayerRoom({ timerSec: null });
    game.startGame(room, 'pa', ctx);
    expect(room.deadline).toBeNull();
    expect(game.timeout(room, ctxAt(10 ** 12))).toBe(false);
  });
});

describe('text helpers', () => {
  it('normalizes starters to trail off', () => {
    expect(game.normalizeStarter('I love you because')).toBe('I love you because…');
    expect(game.normalizeStarter('I love you because...')).toBe('I love you because…');
    expect(game.normalizeStarter('Why?')).toBe('Why…');
    expect(game.peekText('The duck was furious because…')).toBe('… furious because');
    expect(game.wordCount('The duck was furious because…')).toBe(5);
  });
});

describe('view redaction', () => {
  const secret = 'Our wedding will be ruined by a llama named Steve';

  function finishing(mode: 'classic' | 'peek' | 'blind') {
    const { room, ctx } = twoPlayerRoom({ mode });
    game.startGame(room, 'pa', ctx);
    game.submitStarter(room, 'pa', secret, false, ctx);
    game.submitStarter(room, 'pb', 'Pineapple on pizza is fine when', false, ctx);
    return room;
  }

  it.each(['peek', 'blind'] as const)('never leaks the full starter to the finisher in %s mode', (mode) => {
    const room = finishing(mode);
    const forB = JSON.stringify(toPublicState(room, 'pb', 0));
    expect(forB.includes(secret)).toBe(false);
    expect(forB.includes('wedding')).toBe(false);
  });

  it('shows the last two words in peek and nothing in blind', () => {
    expect(toPublicState(finishing('peek'), 'pb', 0).myTask?.starterVisible).toBe('… named Steve');
    const blind = toPublicState(finishing('blind'), 'pb', 0).myTask!;
    expect(blind.starterVisible).toBe('');
    expect(blind.wordCount).toBe(10);
  });

  it('shows the full starter in classic mode', () => {
    expect(toPublicState(finishing('classic'), 'pb', 0).myTask?.starterVisible).toBe(`${secret}…`);
  });

  it('never shows unrevealed endings to anyone', () => {
    const room = finishing('classic');
    game.submitEnding(room, 'pa', 'SECRET-ENDING-ONE');
    game.submitEnding(room, 'pb', 'SECRET-ENDING-TWO');
    for (const viewer of ['pa', 'pb']) {
      const json = JSON.stringify(toPublicState(room, viewer, 0));
      expect(json.includes('SECRET-ENDING')).toBe(false);
    }
    game.revealNext(room, 'pa');
    const json = JSON.stringify(toPublicState(room, 'pb', 0));
    expect(json.includes('SECRET-ENDING-TWO')).toBe(true); // pa's starter, finished by pb
    expect(json.includes('SECRET-ENDING-ONE')).toBe(false);
  });

  it('never includes tokens', () => {
    const room = finishing('peek');
    const json = JSON.stringify(toPublicState(room, 'pa', 0));
    expect(json.includes('token-')).toBe(false);
  });

  it('hides partner ratings until RECAP', () => {
    const { room, ctx } = twoPlayerRoom({ rounds: 3 });
    game.startGame(room, 'pa', ctx);
    playToReveal(room);
    game.revealNext(room, 'pa');
    const id = game.currentSentences(room)[0]!.id;
    game.rate(room, 'pa', id, 5);
    const forB = toPublicState(room, 'pb', 0).sentences.find((s) => s.id === id)!;
    expect(forB.myRating).toBeNull();
    expect(forB.ratingTotal).toBeNull();
  });
});
