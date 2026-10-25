import { describe, expect, it } from 'vitest';
import { addPlayer, seededRng } from '@gfc/kit/server';
import { WORDS_EN, WORDS_VI, type Room } from '../../shared';
import * as game from '../game';
import { toPublicState } from '../index';

const ctxAt = (now: number, seed = 1) => ({ now, rng: seededRng(seed) });

function play(seed = 1, turns: 7 | 9 | 11 = 9) {
  const room = game.newRoom('ABCD', ctxAt(0));
  addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.updateSettings(room, 'pa', { turns });
  game.startGame(room, 'pa', ctxAt(0, seed));
  return room;
}

const ids = ['pa', 'pb'] as const;
const giverId = (room: Room) => ids[room.giver];
const guesserId = (room: Room) => ids[1 - room.giver]!;
const cardsOf = (room: Room, seat: 0 | 1, mark: string) => room.keys[seat].map((m, i) => (m === mark ? i : -1)).filter((i) => i >= 0);

describe('the key', () => {
  it('has the Duet overlaps: 9 agents and 3 assassins per side, 15 agents total', () => {
    for (let seed = 1; seed < 20; seed++) {
      const [a, b] = game.dealKeys(seededRng(seed));
      expect(a.filter((m) => m === 'agent')).toHaveLength(9);
      expect(b.filter((m) => m === 'agent')).toHaveLength(9);
      expect(a.filter((m) => m === 'assassin')).toHaveLength(3);
      expect(b.filter((m) => m === 'assassin')).toHaveLength(3);
      expect(a.filter((m, i) => m === 'agent' || b[i] === 'agent')).toHaveLength(15);
      expect(a.filter((m, i) => m === 'agent' && b[i] === 'agent')).toHaveLength(3);
    }
  });

  it('word lists are big enough and have no duplicates', () => {
    for (const list of [WORDS_EN, WORDS_VI]) {
      expect(list.length).toBeGreaterThan(120);
      expect(new Set(list).size).toBe(list.length);
    }
  });
});

describe('turns', () => {
  it('only the giver gives a clue, never a board word; only the guesser guesses', () => {
    const room = play();
    expect(() => game.giveClue(room, guesserId(room), 'animal', 2)).toThrow(/partner/);
    expect(() => game.giveClue(room, giverId(room), room.words[0]!.toUpperCase(), 1)).toThrow(/board/);
    expect(() => game.giveClue(room, giverId(room), 'one two three', 1)).toThrow(/One word/);
    game.giveClue(room, giverId(room), 'animal', 2);
    expect(() => game.guess(room, giverId(room), 0)).toThrow(/partner guesses/);
  });

  it('agents keep the turn going; a bystander ends it and passes the clue to the other side', () => {
    const room = play(3);
    const giver = room.giver;
    game.giveClue(room, giverId(room), 'thing', 2);
    const agent = cardsOf(room, giver, 'agent')[0]!;
    expect(game.guess(room, guesserId(room), agent)).toBe('agent');
    expect(room.found[agent]).toBe(true);
    const bystander = cardsOf(room, giver, 'bystander')[0]!;
    expect(game.guess(room, guesserId(room), bystander)).toBe('bystander');
    expect(room.bystanderFor[giver][bystander]).toBe(true);
    expect(room.giver).not.toBe(giver);
    expect(room.turnsLeft).toBe(8);
    expect(room.log[0]).toMatchObject({ word: 'thing', got: [room.words[agent]], ended: 'bystander' });
  });

  it('stopping needs a guess first; the assassin ends everything', () => {
    const room = play(4);
    game.giveClue(room, giverId(room), 'thing', 1);
    expect(() => game.stop(room, guesserId(room))).toThrow(/at least one/);
    const assassin = cardsOf(room, room.giver, 'assassin')[0]!;
    expect(game.guess(room, guesserId(room), assassin)).toBe('assassin');
    expect(room.phase).toBe('OVER');
    expect(room.outcome).toMatchObject({ won: false, why: 'assassin' });
    expect(room.record).toEqual({ wins: 0, games: 1 });
  });

  it('running out of turns loses', () => {
    const room = play(5, 7);
    for (let t = 0; t < 7; t++) {
      game.giveClue(room, giverId(room), 'thing', 1);
      const g = room.giver;
      const agent = cardsOf(room, g, 'agent').find((i) => !room.found[i])!;
      game.guess(room, guesserId(room), agent);
      game.stop(room, guesserId(room));
    }
    expect(room.outcome).toMatchObject({ won: false, why: 'out-of-time' });
  });

  it('finding all 15 agents wins, even with the giver locked once their side is done', () => {
    const room = play(6, 11);
    for (let t = 0; t < 11 && room.phase === 'PLAY'; t++) {
      game.giveClue(room, giverId(room), 'thing', 9);
      const g = room.giver;
      for (const i of cardsOf(room, g, 'agent')) if (!room.found[i] && room.phase === 'PLAY') game.guess(room, guesserId(room), i);
      if (room.phase === 'PLAY') game.stop(room, guesserId(room));
    }
    expect(room.outcome).toMatchObject({ won: true, why: 'all-found' });
    expect(room.record.wins).toBe(1);
    game.playAgain(room, 'pa', ctxAt(0, 9));
    game.playAgain(room, 'pb', ctxAt(0, 9));
    expect(room.phase).toBe('PLAY');
    expect(room.found.some(Boolean)).toBe(false);
  });
});

describe('secrets', () => {
  it('you only see your own key until the game ends', () => {
    const room = play();
    const a = toPublicState(room, 'pa', 0);
    expect(a.cards.map((c) => c.mine)).toEqual(room.keys[0]);
    expect(a.cards.every((c) => c.theirs === null)).toBe(true);
    expect(JSON.stringify(a)).not.toContain('keys');
    expect(JSON.stringify(a)).not.toContain('token-');
    room.phase = 'OVER';
    expect(toPublicState(room, 'pa', 0).cards.map((c) => c.theirs)).toEqual(room.keys[1]);
  });
});
