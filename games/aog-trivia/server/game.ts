// AOG Superfan trivia — the game rules.
// No sockets, no timers, no Date.now(): callers pass `now` and `rng` in, so
// everything here is deterministic and unit-testable. Functions validate
// first, then mutate the room in place, and throw GameError on bad intents.
//
// Both players answer every question at the same time. Speed is measured on each
// player's own device (from when the question appeared), so network lag doesn't
// decide who was faster.

import {
  CLUE_TIME_BONUS_SEC,
  FINALE_SIZE,
  LIMITS,
  TIMING,
  pointsFor,
  type CategoryId,
  type ErrorCode,
  type Player,
  type QuestionDef,
  type Room,
  type Settings,
  type SettingsPatch,
  type Text,
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
  questions: 15,
  timeSec: 20,
  categories: ['sgp', 'players', 'aog', 'rivals', 'intl', 'drama', 'game'],
  sgpFinale: true,
};

/** How much faster than the server's own clock a device may claim it answered (covers network lag). */
export const MAX_LAG_MS = 3000;

export const TRUE_FALSE: Text[] = [
  { vi: 'Đúng', en: 'True' },
  { vi: 'Sai', en: 'False' },
];

const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
export const questionById = (id: string): QuestionDef => byId.get(id)!;
export const optionsOf = (q: QuestionDef): Text[] => (q.type === 'tf' ? TRUE_FALSE : (q.options ?? []));

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function cleanText(s: string): string {
  return s
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Seconds a question stays open: clue questions get extra time. */
export function timeLimit(q: QuestionDef, settings: Settings): number {
  return settings.timeSec + (q.type === 'clues' ? CLUE_TIME_BONUS_SEC : 0);
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
    startedAt: 0,
    deadline: null,
    plan: [],
    finaleSize: 0,
    turns: [],
    scores: {},
    streaks: {},
    flagged: [],
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
  room.plan = [];
  room.finaleSize = 0;
  room.turns = [];
  room.scores = {};
  room.streaks = {};
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

/** How many questions the current settings can draw from. */
export function poolSize(categories: CategoryId[]): number {
  return QUESTIONS.filter((q) => categories.includes(q.category)).length;
}

/**
 * Picks the questions for a game: easy → hard, then (optionally) an SGP-only finale.
 * Avoids questions already used in this room until the pool runs dry.
 */
export function buildPlan(room: Room, rng: () => number): { plan: string[]; finaleSize: number } {
  const { questions, categories, sgpFinale } = room.settings;
  const eligible = QUESTIONS.filter((q) => categories.includes(q.category));
  let fresh = eligible.filter((q) => !room.usedQuestionIds.includes(q.id));
  if (fresh.length < Math.min(questions, eligible.length)) {
    room.usedQuestionIds = [];
    fresh = eligible;
  }

  let finale: QuestionDef[] = [];
  if (sgpFinale) {
    const sgpPool = shuffle(
      QUESTIONS.filter((q) => q.sgp && !room.usedQuestionIds.includes(q.id)),
      rng,
    );
    finale = sgpPool.slice(0, Math.min(FINALE_SIZE, Math.max(0, questions - 1)));
  }
  const finaleIds = new Set(finale.map((q) => q.id));
  const mainCount = Math.min(questions - finale.length, fresh.filter((q) => !finaleIds.has(q.id)).length);
  // Random order, then ramp up by difficulty so the game starts friendly.
  const main = shuffle(
    fresh.filter((q) => !finaleIds.has(q.id)),
    rng,
  )
    .slice(0, mainCount)
    .map((q) => ({ q, r: rng() }))
    .sort((a, b) => a.q.difficulty - b.q.difficulty || a.r - b.r)
    .map(({ q }) => q);

  return { plan: [...main, ...finale].map((q) => q.id), finaleSize: finale.length };
}

export function startGame(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'LOBBY');
  if (!requirePlayer(room, playerId).isHost) fail('NOT_HOST', 'Only the host can start');
  if (room.players.length !== 2 || room.players.some((p) => !p.connected)) {
    fail('NEED_TWO_PLAYERS', 'You need your partner here first 💞');
  }
  const { plan, finaleSize } = buildPlan(room, ctx.rng);
  if (plan.length < 3) fail('NOT_ENOUGH_QUESTIONS', 'Pick more categories, there are not enough questions');
  room.plan = plan;
  room.finaleSize = finaleSize;
  room.usedQuestionIds.push(...plan);
  room.turns = [];
  room.scores = Object.fromEntries(room.players.map((p) => [p.id, 0]));
  room.streaks = Object.fromEntries(room.players.map((p) => [p.id, 0]));
  enterQuestion(room, 1, ctx);
}

/** Whether question `index` (1-based) is part of the double-points SGP finale. */
export function isFinale(room: Room, index: number): boolean {
  return room.finaleSize > 0 && index > room.plan.length - room.finaleSize;
}

/** Exported for tests. */
export function enterQuestion(room: Room, index: number, ctx: Ctx): void {
  const q = questionById(room.plan[index - 1]!);
  const count = optionsOf(q).length;
  const order = q.type === 'tf' ? [0, 1] : shuffle([...Array(count).keys()], ctx.rng);
  room.turns.push({ index, questionId: q.id, finale: isFinale(room, index), order, answers: {}, points: {} });
  room.phase = 'QUESTION';
  room.index = index;
  room.readyForNext = [];
  room.startedAt = ctx.now;
  room.deadline = ctx.now + timeLimit(q, room.settings) * 1000;
}

// ---------- QUESTION ----------

/** `choice` is the position on screen; `elapsedMs` is measured on the player's device. */
export function answer(room: Room, playerId: string, choice: number, elapsedMs: number, ctx: Ctx): void {
  requirePhase(room, 'QUESTION');
  requirePlayer(room, playerId);
  const turn = currentTurn(room)!;
  if (turn.answers[playerId]) fail('ALREADY_SUBMITTED', 'You already answered');
  if (choice >= turn.order.length) fail('BAD_INPUT', 'No such option');
  const q = questionById(turn.questionId);
  // Trust the device's timing, but only within a lag window of what the server saw:
  // a claim can't be more than MAX_LAG_MS faster (that would be cheating) or slower than real.
  const serverElapsed = ctx.now - room.startedAt;
  const limitMs = timeLimit(q, room.settings) * 1000;
  const fair = Math.min(Math.max(elapsedMs, serverElapsed - MAX_LAG_MS), serverElapsed + 1500);
  const elapsed = Math.min(Math.max(fair, 0), limitMs);
  turn.answers[playerId] = { choice, elapsedMs: Math.max(0, Math.round(elapsed)) };
  if (room.players.every((p) => turn.answers[p.id])) enterReveal(room);
}

// ---------- REVEAL ----------

function enterReveal(room: Room): void {
  const turn = currentTurn(room)!;
  const q = questionById(turn.questionId);
  for (const p of room.players) {
    const a = turn.answers[p.id] ?? { choice: null, elapsedMs: 0 };
    turn.answers[p.id] = a;
    const correct = a.choice !== null && turn.order[a.choice] === q.answer;
    const pts = pointsFor({
      correct,
      type: q.type,
      elapsedMs: a.elapsedMs,
      limitSec: timeLimit(q, room.settings),
      clueCount: q.clues?.length ?? 0,
      finale: turn.finale,
    });
    turn.points[p.id] = pts;
    room.scores[p.id] = (room.scores[p.id] ?? 0) + pts;
    room.streaks[p.id] = correct ? (room.streaks[p.id] ?? 0) + 1 : 0;
  }
  room.phase = 'REVEAL';
  room.deadline = null;
}

/** 🚩 Toggles "this question looks wrong" for a question already revealed. */
export function flag(room: Room, playerId: string, index: number): string {
  requirePhase(room, 'REVEAL', 'RECAP');
  requirePlayer(room, playerId);
  const turn = room.turns.find((t) => t.index === index);
  if (!turn || (room.phase === 'REVEAL' && index > room.index)) fail('WRONG_PHASE', 'Nothing to flag yet');
  const id = turn!.questionId;
  room.flagged = room.flagged.includes(id) ? room.flagged.filter((x) => x !== id) : [...room.flagged, id];
  return id;
}

export function readyForNext(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'REVEAL');
  requirePlayer(room, playerId);
  if (!room.readyForNext.includes(playerId)) room.readyForNext.push(playerId);
  if (!room.players.every((p) => room.readyForNext.includes(p.id))) return;
  if (room.index >= room.plan.length) {
    room.phase = 'RECAP';
    room.deadline = null;
    room.readyForNext = [];
  } else enterQuestion(room, room.index + 1, ctx);
}

export function rematch(room: Room, playerId: string): void {
  requirePhase(room, 'RECAP');
  requirePlayer(room, playerId);
  resetToLobby(room);
}

// ---------- timers ----------

/** When the server should next wake up for this room: a clue appearing, or the deadline. */
export function wakeAt(room: Room, now: number): number | null {
  if (room.phase !== 'QUESTION' || room.deadline === null) return null;
  const q = questionById(currentTurn(room)!.questionId);
  const end = room.deadline + TIMING.graceMs;
  if (q.type !== 'clues' || !q.clues) return end;
  const limit = timeLimit(q, room.settings);
  const next = q.clues
    .map((_, i) => room.startedAt + Math.round((i * limit) / q.clues!.length) * 1000)
    .find((t) => t > now);
  return next !== undefined && next < end ? next : end;
}

/** Called when `wakeAt` passes. Returns true if anything changed (always rebroadcast for clues). */
export function tick(room: Room, ctx: Ctx): boolean {
  if (room.phase !== 'QUESTION' || room.deadline === null) return false;
  if (ctx.now >= room.deadline + TIMING.graceMs) {
    enterReveal(room);
    return true;
  }
  return questionById(currentTurn(room)!.questionId).type === 'clues';
}
