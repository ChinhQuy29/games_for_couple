// Finish My Sentence — the game rules.
// No sockets, no timers, no Date.now(): callers pass `now` and `rng` in, so
// everything here is deterministic and unit-testable. Functions validate
// first, then mutate the room in place, and throw GameError on bad intents.

import {
  LIMITS,
  REACTIONS,
  TIMING,
  type ErrorCode,
  type Player,
  type Rating,
  type Reaction,
  type Room,
  type Sentence,
  type Settings,
  type SettingsPatch,
} from '../shared';
import { AFK_ENDINGS } from './content/afk';
import { MODIFIERS } from './content/modifiers';
import { STARTERS } from './content/starters';

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
  rounds: 5,
  mode: 'peek',
  timerSec: 60,
  modifiersOn: true,
  categories: ['us', 'ldr', 'absurd', 'food', 'life', 'hypothetical', 'confessions'],
};

const MODIFIER_CHANCE = 0.7;

// ---------- text helpers ----------

export function cleanText(s: string): string {
  return s
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Make sure a starter trails off with an ellipsis so it reads like a half sentence. */
export function normalizeStarter(s: string): string {
  const t = cleanText(s).replace(/\.{3,}$/, '…');
  return /[…:,—-]$/.test(t) ? t : `${t.replace(/[.!?]+$/, '')}…`;
}

function starterWords(starter: string): string[] {
  return starter
    .replace(/[…]+$/, '')
    .split(/\s+/)
    .filter(Boolean);
}

export function peekText(starter: string): string {
  return `… ${starterWords(starter).slice(-2).join(' ')}`;
}

export function wordCount(starter: string): number {
  return starterWords(starter).length;
}

const pick = <T>(arr: readonly T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)]!;

// ---------- room setup ----------

export function newRoom(code: string, ctx: Ctx): Room {
  return {
    code,
    createdAt: ctx.now,
    lastActivityAt: ctx.now,
    players: [],
    settings: { ...DEFAULT_SETTINGS, categories: [...DEFAULT_SETTINGS.categories] },
    phase: 'LOBBY',
    round: 0,
    deadline: null,
    sentences: [],
    pending: {},
    readyForNext: [],
    revealIndex: 0,
    usedStarterIds: [],
    lastModifierId: null,
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
  room.round = 0;
  room.deadline = null;
  room.sentences = [];
  room.pending = {};
  room.readyForNext = [];
  room.revealIndex = 0;
}

function requirePlayer(room: Room, playerId: string): Player {
  return room.players.find((p) => p.id === playerId) ?? fail('NOT_IN_ROOM', 'You are not in this room');
}

function requirePhase(room: Room, ...phases: Room['phase'][]): void {
  if (!phases.includes(room.phase)) fail('WRONG_PHASE', 'Not right now!');
}

function partnerOf(room: Room, playerId: string): Player | undefined {
  return room.players.find((p) => p.id !== playerId);
}

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
  room.sentences = [];
  enterStart(room, 1, ctx);
}

// ---------- START phase ----------

function deadlineFor(room: Room, ctx: Ctx): number | null {
  return room.settings.timerSec ? ctx.now + room.settings.timerSec * 1000 : null;
}

function enterStart(room: Room, round: number, ctx: Ctx): void {
  room.phase = 'START';
  room.round = round;
  room.readyForNext = [];
  room.revealIndex = 0;
  room.pending = {};
  for (const p of room.players) {
    room.pending[p.id] = { text: null, fromDeck: false, rerollsLeft: LIMITS.rerolls, dealt: null, dealtId: null };
  }
  room.deadline = deadlineFor(room, ctx);
}

export function drawStarter(room: Room, rng: () => number): { id: string; text: string } {
  const eligible = STARTERS.filter((s) => room.settings.categories.includes(s.category));
  let fresh = eligible.filter((s) => !room.usedStarterIds.includes(s.id));
  if (fresh.length === 0) {
    const eligibleIds = new Set(eligible.map((s) => s.id));
    room.usedStarterIds = room.usedStarterIds.filter((id) => !eligibleIds.has(id));
    fresh = eligible;
  }
  const s = pick(fresh, rng);
  room.usedStarterIds.push(s.id);
  return { id: s.id, text: s.text };
}

export function dealStarter(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'START');
  requirePlayer(room, playerId);
  const mine = room.pending[playerId]!;
  if (mine.text !== null) fail('ALREADY_SUBMITTED', 'You already sent your starter');
  if (mine.dealt !== null) {
    if (mine.rerollsLeft <= 0) fail('NO_REROLLS', 'No re-rolls left — commit to the chaos');
    mine.rerollsLeft -= 1;
  }
  const s = drawStarter(room, ctx.rng);
  mine.dealt = s.text;
  mine.dealtId = s.id;
}

export function submitStarter(room: Room, playerId: string, text: string, fromDeck: boolean, ctx: Ctx): void {
  requirePhase(room, 'START');
  requirePlayer(room, playerId);
  const mine = room.pending[playerId]!;
  if (mine.text !== null) fail('ALREADY_SUBMITTED', 'You already sent your starter');
  const cleaned = cleanText(text);
  if (cleaned.length < LIMITS.starterMin) fail('TOO_SHORT', 'Write a bit more than that!');
  mine.text = normalizeStarter(cleaned.slice(0, LIMITS.starterMax));
  mine.fromDeck = fromDeck && cleaned === mine.dealt;
  if (room.players.every((p) => room.pending[p.id]?.text != null)) enterFinish(room, ctx);
}

// ---------- FINISH phase ----------

function pickModifier(room: Room, ctx: Ctx, exclude: string | null) {
  if (!room.settings.modifiersOn || ctx.rng() >= MODIFIER_CHANCE) return null;
  const options = MODIFIERS.filter(
    (m) =>
      m.id !== room.lastModifierId &&
      m.id !== exclude &&
      !(m.needsVisibleWords && room.settings.mode === 'blind'),
  );
  const m = pick(options, ctx.rng);
  room.lastModifierId = m.id;
  return m;
}

function enterFinish(room: Room, ctx: Ctx): void {
  room.phase = 'FINISH';
  let previousModifier: string | null = null;
  // Host's starter first so the host reveals first.
  room.players.forEach((author, i) => {
    const finisher = partnerOf(room, author.id)!;
    const pending = room.pending[author.id]!;
    const modifier = pickModifier(room, ctx, previousModifier);
    previousModifier = modifier?.id ?? null;
    const sentence: Sentence = {
      id: `r${room.round}s${i}`,
      round: room.round,
      starterAuthorId: author.id,
      finisherId: finisher.id,
      starter: pending.text!,
      starterFromDeck: pending.fromDeck,
      ending: null,
      endingWasAfk: false,
      modifier: modifier ? { id: modifier.id, emoji: modifier.emoji, text: modifier.text } : null,
      modifierPassed: null,
      revealed: false,
      ratings: {},
      reactions: Object.fromEntries(REACTIONS.map((r) => [r, 0])) as Record<Reaction, number>,
    };
    room.sentences.push(sentence);
  });
  room.deadline = deadlineFor(room, ctx);
}

export function currentSentences(room: Room): Sentence[] {
  return room.sentences.filter((s) => s.round === room.round);
}

function setEnding(s: Sentence, ending: string, afk: boolean): void {
  s.ending = ending;
  s.endingWasAfk = afk;
  const def = s.modifier ? MODIFIERS.find((m) => m.id === s.modifier!.id) : undefined;
  s.modifierPassed = def?.check && !afk ? def.check(ending) : null;
}

export function submitEnding(room: Room, playerId: string, text: string): void {
  requirePhase(room, 'FINISH');
  requirePlayer(room, playerId);
  const s = currentSentences(room).find((x) => x.finisherId === playerId)!;
  if (s.ending !== null) fail('ALREADY_SUBMITTED', 'You already sent your ending');
  const cleaned = cleanText(text).slice(0, LIMITS.endingMax);
  if (cleaned.length < LIMITS.endingMin) fail('TOO_SHORT', 'Write something! Anything!');
  setEnding(s, cleaned, false);
  if (currentSentences(room).every((x) => x.ending !== null)) enterReveal(room);
}

// ---------- REVEAL phase ----------

function enterReveal(room: Room): void {
  room.phase = 'REVEAL';
  room.revealIndex = 0;
  room.deadline = null;
}

export function revealNext(room: Room, playerId: string): void {
  requirePhase(room, 'REVEAL');
  requirePlayer(room, playerId);
  const s = currentSentences(room)[room.revealIndex] ?? fail('WRONG_PHASE', 'Everything is revealed already');
  const author = room.players.find((p) => p.id === s.starterAuthorId);
  // If the author dropped off, let the partner do it so nobody gets stuck.
  if (s.starterAuthorId !== playerId && author?.connected) {
    fail('NOT_YOUR_TURN', `It's ${author.name}'s turn to reveal`);
  }
  s.revealed = true;
  room.revealIndex += 1;
}

function requireRevealed(room: Room, sentenceId: string): Sentence {
  const s = room.sentences.find((x) => x.id === sentenceId);
  if (!s || !s.revealed) fail('WRONG_PHASE', 'That one is not revealed yet');
  return s!;
}

export function react(room: Room, playerId: string, sentenceId: string, emoji: Reaction): void {
  requirePhase(room, 'REVEAL', 'RECAP');
  requirePlayer(room, playerId);
  requireRevealed(room, sentenceId).reactions[emoji] += 1;
}

export function rate(room: Room, playerId: string, sentenceId: string, value: Rating): void {
  requirePhase(room, 'REVEAL', 'RECAP');
  requirePlayer(room, playerId);
  requireRevealed(room, sentenceId).ratings[playerId] = value;
}

export function readyForNext(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'REVEAL');
  requirePlayer(room, playerId);
  if (room.revealIndex < currentSentences(room).length) fail('WRONG_PHASE', 'Reveal everything first!');
  if (!room.readyForNext.includes(playerId)) room.readyForNext.push(playerId);
  if (room.players.every((p) => room.readyForNext.includes(p.id))) {
    if (room.round >= room.settings.rounds) {
      room.phase = 'RECAP';
      room.deadline = null;
      room.readyForNext = [];
    } else {
      enterStart(room, room.round + 1, ctx);
    }
  }
}

// ---------- RECAP ----------

export function rematch(room: Room, playerId: string): void {
  requirePhase(room, 'RECAP');
  requirePlayer(room, playerId);
  resetToLobby(room);
}

// ---------- timers ----------

/** Called by the timer once `deadline + grace` passes. Fills in fallbacks and advances. */
export function timeout(room: Room, ctx: Ctx): boolean {
  if (room.deadline === null || ctx.now < room.deadline + TIMING.graceMs) return false;
  if (room.phase === 'START') {
    for (const p of room.players) {
      const mine = room.pending[p.id]!;
      if (mine.text !== null) continue;
      const text = mine.dealt ?? drawStarter(room, ctx.rng).text;
      mine.text = normalizeStarter(text);
      mine.fromDeck = true;
    }
    enterFinish(room, ctx);
    return true;
  }
  if (room.phase === 'FINISH') {
    for (const s of currentSentences(room)) {
      if (s.ending === null) setEnding(s, pick(AFK_ENDINGS, ctx.rng), true);
    }
    enterReveal(room);
    return true;
  }
  return false;
}
