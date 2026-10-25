// Codenames Duet — the rules. Pure functions: time and randomness come in through ctx.
//
// 25 words. Each of you holds a key: 9 agents and 3 assassins, overlapping as in the real
// game (15 agents in total). Take turns: one gives a one-word clue and a number, the other
// guesses using the clue giver's key. A bystander ends the turn; an assassin ends the game.

import { firstSeat, cleanText, fail, requireHost, requirePhase, requirePlayer, requireTwo, shuffle, type Ctx } from '@gfc/kit/server';
import { AGENTS_TOTAL, KEY_LAYOUT, LANGUAGES, type Lang, type Mark, type Room, type Turns } from '../shared';

export function newRoom(code: string, ctx: Ctx): Room {
  return {
    code,
    createdAt: ctx.now,
    lastActivityAt: ctx.now,
    players: [],
    phase: 'LOBBY',
    lang: 'en',
    turns: 9,
    words: [],
    keys: [[], []],
    found: [],
    bystanderFor: [[], []],
    giver: 0,
    startGiver: 0,
    clue: null,
    turnsLeft: 9,
    log: [],
    outcome: null,
    record: { wins: 0, games: 0 },
    readyForNext: [],
  };
}

export function resetToLobby(room: Room): void {
  room.phase = 'LOBBY';
  room.clue = null;
  room.readyForNext = [];
}

export function updateSettings(room: Room, playerId: string, patch: { lang?: Lang; turns?: Turns }): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  if (patch.lang) room.lang = patch.lang;
  if (patch.turns) room.turns = patch.turns;
}

/** Two keys with the Duet overlaps, shuffled over 25 positions. */
export function dealKeys(rng: () => number): [Mark[], Mark[]] {
  const pairs = shuffle(
    KEY_LAYOUT.flatMap(([a, b, n]) => Array.from({ length: n }, () => [a, b] as [Mark, Mark])),
    rng,
  );
  return [pairs.map((p) => p[0]), pairs.map((p) => p[1])];
}

function deal(room: Room, ctx: Ctx, giver: 0 | 1) {
  room.phase = 'PLAY';
  room.words = shuffle([...LANGUAGES[room.lang].words], ctx.rng).slice(0, 25);
  room.keys = dealKeys(ctx.rng);
  room.found = Array.from({ length: 25 }, () => false);
  room.bystanderFor = [Array.from({ length: 25 }, () => false), Array.from({ length: 25 }, () => false)];
  room.giver = giver;
  room.startGiver = giver;
  room.clue = null;
  room.turnsLeft = room.turns;
  room.log = [];
  room.outcome = null;
  room.readyForNext = [];
}

export function startGame(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  requireTwo(room);
  deal(room, ctx, firstSeat(room, ctx.rng));
}

export function playAgain(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'OVER');
  requirePlayer(room, playerId);
  if (!room.readyForNext.includes(playerId)) room.readyForNext.push(playerId);
  if (room.readyForNext.length < 2) return;
  requireTwo(room);
  deal(room, ctx, (1 - room.startGiver) as 0 | 1);
}

export function toLobby(room: Room, playerId: string): void {
  requirePhase(room, 'OVER');
  requireHost(room, playerId);
  resetToLobby(room);
}

const seatOf = (room: Room, playerId: string) => room.players.findIndex((p) => p.id === playerId) as 0 | 1;

/** Agents on this seat's key that nobody has found yet. */
export const agentsLeftFor = (room: Room, seat: 0 | 1) => room.keys[seat].filter((m, i) => m === 'agent' && !room.found[i]).length;
export const agentsLeft = (room: Room) => AGENTS_TOTAL - room.found.filter(Boolean).length;

const norm = (s: string) => s.normalize('NFC').toLowerCase().replace(/\s+/g, ' ').trim();

export function giveClue(room: Room, playerId: string, word: string, count: number): void {
  requirePhase(room, 'PLAY');
  requirePlayer(room, playerId);
  if (seatOf(room, playerId) !== room.giver) fail('NOT_GIVER', "It's your partner's turn to give a clue");
  if (room.clue) fail('ALREADY', 'You already gave a clue: let them guess!');
  const clean = cleanText(word).slice(0, 30);
  if (!clean) fail('EMPTY', 'Type a clue word');
  if (clean.split(' ').length > 2) fail('ONE_WORD', 'One word only! 🤫');
  if (room.words.some((w) => norm(w) === norm(clean))) fail('ON_BOARD', "You can't use a word that's on the board 😏");
  room.clue = { word: clean, count, by: room.giver, got: [] };
}

function endTurn(room: Room, ended: 'bystander' | 'stopped') {
  const clue = room.clue!;
  room.log.push({ word: clue.word, count: clue.count, by: clue.by, got: clue.got, ended });
  room.turnsLeft -= 1;
  room.clue = null;
  if (room.turnsLeft <= 0) return over(room, false, 'out-of-time');
  // Alternate, unless the other side has no agents left to give clues for.
  const other = (1 - room.giver) as 0 | 1;
  if (agentsLeftFor(room, other) > 0 || agentsLeftFor(room, room.giver) === 0) room.giver = other;
}

function over(room: Room, won: boolean, why: NonNullable<Room['outcome']>['why'], extra: Partial<NonNullable<Room['outcome']>> = {}) {
  room.phase = 'OVER';
  room.outcome = { won, why, ...extra };
  room.record = { wins: room.record.wins + (won ? 1 : 0), games: room.record.games + 1 };
  room.readyForNext = [];
}

/** The guesser touches a card, read with the clue giver's key. */
export function guess(room: Room, playerId: string, card: number): Mark {
  requirePhase(room, 'PLAY');
  requirePlayer(room, playerId);
  const clue = room.clue ?? fail('NO_CLUE', 'Wait for the clue first');
  if (seatOf(room, playerId) === clue.by) fail('NOT_GUESSER', 'You gave the clue: your partner guesses!');
  if (room.found[card]) fail('FOUND', 'That agent is already found');
  if (room.bystanderFor[clue.by][card]) fail('BYSTANDER', "That's already a known bystander for this clue giver");
  const mark = room.keys[clue.by][card]!;
  if (mark === 'agent') {
    room.found[card] = true;
    clue.got.push(room.words[card]!);
    if (agentsLeft(room) === 0) {
      room.log.push({ word: clue.word, count: clue.count, by: clue.by, got: clue.got, ended: 'won' });
      room.clue = null;
      over(room, true, 'all-found');
    }
  } else if (mark === 'bystander') {
    room.bystanderFor[clue.by][card] = true;
    endTurn(room, 'bystander');
  } else {
    room.log.push({ word: clue.word, count: clue.count, by: clue.by, got: clue.got, ended: 'assassin' });
    room.clue = null;
    over(room, false, 'assassin', { assassinBy: clue.by, card });
  }
  return mark;
}

/** The guesser decides to stop (after at least one guess). */
export function stop(room: Room, playerId: string): void {
  requirePhase(room, 'PLAY');
  requirePlayer(room, playerId);
  const clue = room.clue ?? fail('NO_CLUE', 'Wait for the clue first');
  if (seatOf(room, playerId) === clue.by) fail('NOT_GUESSER', 'Your partner decides when to stop');
  if (clue.got.length === 0) fail('GUESS_FIRST', 'Make at least one guess first');
  endTurn(room, 'stopped');
}
