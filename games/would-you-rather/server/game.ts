// Would You Rather: Unhinged — the game rules.
// No sockets, no timers, no Date.now(): callers pass `now` and `rng` in, so
// everything here is deterministic and unit-testable. Functions validate
// first, then mutate the room in place, and throw GameError on bad intents.
//
// Each question: both pick A or B and predict the partner's pick (ANSWER).
// If the picks differ, both get to type a defense (DEBATE). Then RESULT shows
// everything. Every Nth question can be written by a player (WRITE).

import {
  LIMITS,
  REACTIONS,
  TIMING,
  type Choice,
  type ErrorCode,
  type Player,
  type Question,
  type Reaction,
  type Room,
  type Settings,
  type SettingsPatch,
  type Turn,
} from '../shared';
import { QUESTIONS } from './content/questions';

export interface Ctx {
  now: number;
  rng: () => number;
}

export class GameError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const fail = (code: ErrorCode, message: string): never => {
  throw new GameError(code, message);
};

export const DEFAULT_SETTINGS: Settings = {
  questions: 10,
  answerSec: 30,
  customEvery: 5,
  categories: ['us', 'gross', 'powers', 'food', 'absurd', 'life'],
};

const pick = <T>(arr: readonly T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)]!;

export function cleanText(s: string): string {
  return s
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Drops a leading "Would you rather" and a trailing "?" people tend to type. */
export function cleanOption(s: string): string {
  return cleanText(s)
    .replace(/^would you rather\s*/i, '')
    .replace(/[?.!]+$/, '')
    .trim();
}

// ---------- room setup ----------

export function newRoom(code: string, ctx: Ctx): Room {
  return {
    code,
    createdAt: ctx.now,
    lastActivityAt: ctx.now,
    players: [],
    settings: { ...DEFAULT_SETTINGS, categories: [...DEFAULT_SETTINGS.categories] },
    phase: 'LOBBY',
    index: 0,
    deadline: null,
    turns: [],
    writerId: null,
    readyForNext: [],
    usedQuestionIds: [],
  };
}

export function addPlayer(room: Room, p: { id: string; token: string; name: string }): Player {
  if (room.players.length >= 2) fail('ROOM_FULL', 'This room is taken 💔');
  if (room.phase !== 'LOBBY') fail('GAME_IN_PROGRESS', 'A game is already going in this room');
  const name = cleanText(p.name).slice(0, LIMITS.nameMax);
  if (name.length < LIMITS.nameMin) fail('TOO_SHORT', 'Pick a name first');
  const player: Player = { ...p, name, connected: true, isHost: room.players.length === 0 };
  room.players.push(player);
  return player;
}

export function removePlayer(room: Room, playerId: string): void {
  const idx = room.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return;
  room.players.splice(idx, 1);
  if (room.players[0]) room.players[0].isHost = true;
  if (room.phase !== 'LOBBY') resetToLobby(room);
}

function resetToLobby(room: Room): void {
  room.phase = 'LOBBY';
  room.index = 0;
  room.deadline = null;
  room.turns = [];
  room.writerId = null;
  room.readyForNext = [];
}

function requirePlayer(room: Room, playerId: string): Player {
  return room.players.find((p) => p.id === playerId) ?? fail('NOT_IN_ROOM', 'You are not in this room');
}

function requirePhase(room: Room, ...phases: Room['phase'][]): void {
  if (!phases.includes(room.phase)) fail('WRONG_PHASE', 'Not right now!');
}

export const currentTurn = (room: Room): Turn | undefined => room.turns.find((t) => t.index === room.index);

// ---------- lobby ----------

export function updateSettings(room: Room, playerId: string, patch: SettingsPatch): void {
  requirePhase(room, 'LOBBY');
  if (!requirePlayer(room, playerId).isHost) fail('NOT_HOST', 'Only the host can change settings');
  room.settings = { ...room.settings, ...patch } as Settings;
}

export function startGame(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'LOBBY');
  if (!requirePlayer(room, playerId).isHost) fail('NOT_HOST', 'Only the host can start');
  if (room.players.length !== 2 || room.players.some((p) => !p.connected)) {
    fail('NEED_TWO_PLAYERS', 'You need your partner here first 💞');
  }
  room.turns = [];
  nextQuestion(room, 1, ctx);
}

// ---------- questions ----------

export function drawQuestion(room: Room, rng: () => number): Question {
  const eligible = QUESTIONS.filter((q) => room.settings.categories.includes(q.category));
  let fresh = eligible.filter((q) => !room.usedQuestionIds.includes(q.id));
  if (fresh.length === 0) {
    const ids = new Set(eligible.map((q) => q.id));
    room.usedQuestionIds = room.usedQuestionIds.filter((id) => !ids.has(id));
    fresh = eligible;
  }
  const card = pick(fresh, rng);
  room.usedQuestionIds.push(card.id);
  // Shuffle sides so the same card doesn't always put the same option on the left.
  const flip = rng() < 0.5;
  return { id: card.id, a: flip ? card.b : card.a, b: flip ? card.a : card.b, authorId: null };
}

/** Whether question `index` is a write-your-own one, and who writes it (host first, then alternating). */
export function writerFor(room: Room, index: number): string | null {
  const every = room.settings.customEvery;
  if (!every || index % every !== 0) return null;
  return room.players[(index / every - 1) % 2]?.id ?? null;
}

function nextQuestion(room: Room, index: number, ctx: Ctx): void {
  room.index = index;
  room.readyForNext = [];
  room.writerId = writerFor(room, index);
  if (room.writerId) {
    room.phase = 'WRITE';
    room.deadline = ctx.now + TIMING.writeSec * 1000;
    return;
  }
  enterAnswer(room, drawQuestion(room, ctx.rng), ctx);
}

function enterAnswer(room: Room, question: Question, ctx: Ctx): void {
  room.turns.push({
    index: room.index,
    question,
    picks: {},
    predictions: {},
    autoPicked: [],
    defenses: {},
    reactions: Object.fromEntries(REACTIONS.map((r) => [r, 0])) as Record<Reaction, number>,
  });
  room.phase = 'ANSWER';
  room.writerId = null;
  room.deadline = room.settings.answerSec ? ctx.now + room.settings.answerSec * 1000 : null;
}

// ---------- WRITE ----------

export function writeQuestion(room: Room, playerId: string, a: string, b: string, ctx: Ctx): void {
  requirePhase(room, 'WRITE');
  requirePlayer(room, playerId);
  if (room.writerId !== playerId) fail('NOT_YOUR_TURN', "It's not your turn to write");
  const optA = cleanOption(a).slice(0, LIMITS.optionMax);
  const optB = cleanOption(b).slice(0, LIMITS.optionMax);
  if (optA.length < LIMITS.optionMin || optB.length < LIMITS.optionMin) fail('TOO_SHORT', 'Both options need a few words!');
  enterAnswer(room, { id: `custom-${room.index}`, a: optA, b: optB, authorId: playerId }, ctx);
}

// ---------- ANSWER ----------

export function answer(room: Room, playerId: string, choice: Choice, prediction: Choice, ctx: Ctx): void {
  requirePhase(room, 'ANSWER');
  requirePlayer(room, playerId);
  const turn = currentTurn(room)!;
  if (turn.picks[playerId]) fail('ALREADY_SUBMITTED', 'You already answered');
  turn.picks[playerId] = choice;
  turn.predictions[playerId] = prediction;
  afterAnswers(room, ctx);
}

function afterAnswers(room: Room, ctx: Ctx): void {
  const turn = currentTurn(room)!;
  if (!room.players.every((p) => turn.picks[p.id])) return;
  const [a, b] = room.players;
  if (turn.picks[a!.id] === turn.picks[b!.id]) enterResult(room);
  else {
    room.phase = 'DEBATE';
    room.deadline = ctx.now + TIMING.debateSec * 1000;
  }
}

// ---------- DEBATE ----------

/** An empty text means "no comment" (the Skip button). */
export function defend(room: Room, playerId: string, text: string): void {
  requirePhase(room, 'DEBATE');
  requirePlayer(room, playerId);
  const turn = currentTurn(room)!;
  if (turn.defenses[playerId] !== undefined) fail('ALREADY_SUBMITTED', 'You already made your case');
  turn.defenses[playerId] = cleanText(text).slice(0, LIMITS.defenseMax);
  if (room.players.every((p) => turn.defenses[p.id] !== undefined)) enterResult(room);
}

// ---------- RESULT ----------

function enterResult(room: Room): void {
  room.phase = 'RESULT';
  room.deadline = null;
}

export function react(room: Room, playerId: string, index: number, emoji: Reaction): void {
  requirePhase(room, 'RESULT', 'RECAP');
  requirePlayer(room, playerId);
  const turn = room.turns.find((t) => t.index === index);
  const visible = turn && (room.phase === 'RECAP' || turn.index <= room.index);
  if (!turn || !visible) fail('WRONG_PHASE', 'Nothing to react to yet');
  turn!.reactions[emoji] += 1;
}

export function readyForNext(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'RESULT');
  requirePlayer(room, playerId);
  if (!room.readyForNext.includes(playerId)) room.readyForNext.push(playerId);
  if (!room.players.every((p) => room.readyForNext.includes(p.id))) return;
  if (room.index >= room.settings.questions) {
    room.phase = 'RECAP';
    room.deadline = null;
    room.readyForNext = [];
  } else nextQuestion(room, room.index + 1, ctx);
}

export function rematch(room: Room, playerId: string): void {
  requirePhase(room, 'RECAP');
  requirePlayer(room, playerId);
  resetToLobby(room);
}

// ---------- timers ----------

/** Called once `deadline + grace` passes: fills in whatever is missing and moves on. */
export function timeout(room: Room, ctx: Ctx): boolean {
  if (room.deadline === null || ctx.now < room.deadline + TIMING.graceMs) return false;
  if (room.phase === 'WRITE') {
    enterAnswer(room, drawQuestion(room, ctx.rng), ctx);
    return true;
  }
  const turn = currentTurn(room);
  if (!turn) return false;
  if (room.phase === 'ANSWER') {
    for (const p of room.players) {
      if (turn.picks[p.id]) continue;
      turn.picks[p.id] = ctx.rng() < 0.5 ? 'a' : 'b';
      turn.predictions[p.id] = ctx.rng() < 0.5 ? 'a' : 'b';
      turn.autoPicked.push(p.id);
    }
    afterAnswers(room, ctx);
    return true;
  }
  if (room.phase === 'DEBATE') {
    for (const p of room.players) turn.defenses[p.id] ??= '';
    enterResult(room);
    return true;
  }
  return false;
}
