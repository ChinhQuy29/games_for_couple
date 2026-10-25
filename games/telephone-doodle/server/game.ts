// Telephone Doodle — the game rules.
// No sockets, no timers, no Date.now(): callers pass `now` and `rng` in, so
// everything here is deterministic and unit-testable. Functions validate
// first, then mutate the room in place, and throw GameError on bad intents.
//
// Two chains run side by side each round, one started by each player, so both
// are always busy. In a chain, its owner draws and the partner guesses, taking
// turns: prompt → draw → guess → draw → guess …

import {
  CHAOS_IDS,
  LIMITS,
  REACTIONS,
  TIMING,
  type Chain,
  type ChaosId,
  type Drawing,
  type ErrorCode,
  type Player,
  type Reaction,
  type Room,
  type Settings,
  type SettingsPatch,
} from '../shared';
import { PROMPTS } from './content/prompts';

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

export const DEFAULT_SETTINGS: Settings = { rounds: 2, steps: 4, drawSec: 60, guessSec: 30, chaosOn: true };

const CHAOS_CHANCE = 0.6;
export const AFK_GUESS = '¯\\_(ツ)_/¯ no idea';

const pick = <T>(arr: readonly T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)]!;

export function cleanText(s: string): string {
  return s
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- room setup ----------

export function newRoom(code: string, ctx: Ctx): Room {
  return {
    code,
    createdAt: ctx.now,
    lastActivityAt: ctx.now,
    players: [],
    settings: { ...DEFAULT_SETTINGS },
    phase: 'LOBBY',
    round: 0,
    step: 0,
    deadline: null,
    chains: [],
    pending: {},
    revealChain: 0,
    revealCount: 0,
    readyForNext: [],
    usedPromptIds: [],
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
  room.step = 0;
  room.deadline = null;
  room.chains = [];
  room.pending = {};
  room.revealChain = 0;
  room.revealCount = 0;
  room.readyForNext = [];
}

function requirePlayer(room: Room, playerId: string): Player {
  return room.players.find((p) => p.id === playerId) ?? fail('NOT_IN_ROOM', 'You are not in this room');
}

function requirePhase(room: Room, ...phases: Room['phase'][]): void {
  if (!phases.includes(room.phase)) fail('WRONG_PHASE', 'Not right now!');
}

const playerIndex = (room: Room, playerId: string) => room.players.findIndex((p) => p.id === playerId);

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
  room.chains = [];
  enterPrompt(room, 1, ctx);
}

// ---------- PROMPT phase ----------

export function drawPrompt(room: Room, rng: () => number): string {
  let fresh = PROMPTS.filter((p) => !room.usedPromptIds.includes(p.id));
  if (fresh.length === 0) {
    room.usedPromptIds = [];
    fresh = PROMPTS;
  }
  const p = pick(fresh, rng);
  room.usedPromptIds.push(p.id);
  return p.text;
}

function enterPrompt(room: Room, round: number, ctx: Ctx): void {
  room.phase = 'PROMPT';
  room.round = round;
  room.step = 0;
  room.readyForNext = [];
  room.pending = {};
  for (const p of room.players) {
    room.pending[p.id] = { text: null, fromDeck: false, dealt: drawPrompt(room, ctx.rng), rerollsLeft: LIMITS.rerolls };
  }
  room.deadline = ctx.now + TIMING.promptSec * 1000;
}

export function rerollPrompt(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'PROMPT');
  requirePlayer(room, playerId);
  const mine = room.pending[playerId]!;
  if (mine.text !== null) fail('ALREADY_SUBMITTED', 'You already locked in your prompt');
  if (mine.rerollsLeft <= 0) fail('NO_REROLLS', 'No re-rolls left. Commit to the chaos');
  mine.rerollsLeft -= 1;
  mine.dealt = drawPrompt(room, ctx.rng);
}

export function submitPrompt(room: Room, playerId: string, text: string, fromDeck: boolean, ctx: Ctx): void {
  requirePhase(room, 'PROMPT');
  requirePlayer(room, playerId);
  const mine = room.pending[playerId]!;
  if (mine.text !== null) fail('ALREADY_SUBMITTED', 'You already locked in your prompt');
  const cleaned = cleanText(text).slice(0, LIMITS.promptMax);
  if (cleaned.length < LIMITS.promptMin) fail('TOO_SHORT', 'Give us a bit more to draw!');
  mine.text = cleaned;
  mine.fromDeck = fromDeck && cleaned === mine.dealt;
  if (room.players.every((p) => room.pending[p.id]?.text != null)) startChains(room, ctx);
}

function pickChaos(room: Room, ctx: Ctx, avoid: ChaosId | null): ChaosId | null {
  if (!room.settings.chaosOn || ctx.rng() >= CHAOS_CHANCE) return null;
  return pick(
    CHAOS_IDS.filter((c) => c !== avoid),
    ctx.rng,
  );
}

function startChains(room: Room, ctx: Ctx): void {
  room.players.forEach((owner, i) => {
    const pending = room.pending[owner.id]!;
    const chaosByStep: Record<number, ChaosId | null> = {};
    let last: ChaosId | null = null;
    for (let s = 0; s < room.settings.steps; s += 2) {
      last = pickChaos(room, ctx, last);
      chaosByStep[s] = last;
    }
    const chain: Chain = {
      id: `r${room.round}c${i}`,
      round: room.round,
      owner: i,
      entries: [{ kind: 'prompt', text: pending.text!, by: owner.id, fromDeck: pending.fromDeck }],
      chaosByStep,
      reactions: Object.fromEntries(REACTIONS.map((r) => [r, 0])) as Record<Reaction, number>,
    };
    room.chains.push(chain);
  });
  enterStep(room, 0, ctx);
}

// ---------- STEP phase (draw / guess) ----------

export const stepKind = (step: number): 'drawing' | 'guess' => (step % 2 === 0 ? 'drawing' : 'guess');

export function currentChains(room: Room): Chain[] {
  return room.chains.filter((c) => c.round === room.round).sort((a, b) => a.owner - b.owner);
}

/** The chain this player works on during `step`: owners draw, partners guess. */
export function chainFor(room: Room, playerId: string, step = room.step): Chain | undefined {
  const idx = playerIndex(room, playerId);
  return currentChains(room).find((c) => (c.owner + step) % 2 === idx);
}

function enterStep(room: Room, step: number, ctx: Ctx): void {
  room.phase = 'STEP';
  room.step = step;
  const sec = stepKind(step) === 'drawing' ? room.settings.drawSec : room.settings.guessSec;
  room.deadline = sec ? ctx.now + sec * 1000 : null;
}

const submittedStep = (chain: Chain, step: number) => chain.entries.length > step + 1;

/** Applies the chaos rules the server can enforce; the rest (blind, mirror, shaky) are client-side. */
export function applyChaos(drawing: Drawing, chaos: ChaosId | null): Drawing {
  let strokes = drawing.strokes;
  if (chaos === 'one-stroke') strokes = strokes.slice(0, 1);
  if (chaos === 'five-strokes') strokes = strokes.slice(0, 5);
  if (chaos === 'one-color') strokes = strokes.map((s) => ({ ...s, c: 0 }));
  if (chaos === 'tiny') strokes = strokes.map((s) => ({ ...s, w: 0 }));
  return { strokes };
}

function afterSubmit(room: Room, ctx: Ctx): void {
  if (!currentChains(room).every((c) => submittedStep(c, room.step))) return;
  if (room.step + 1 >= room.settings.steps) enterReveal(room);
  else enterStep(room, room.step + 1, ctx);
}

export function submitDrawing(room: Room, playerId: string, drawing: Drawing, ctx: Ctx): void {
  requirePhase(room, 'STEP');
  requirePlayer(room, playerId);
  if (stepKind(room.step) !== 'drawing') fail('WRONG_PHASE', "It's guessing time, not drawing time");
  const chain = chainFor(room, playerId)!;
  if (submittedStep(chain, room.step)) fail('ALREADY_SUBMITTED', 'Already sent!');
  const chaos = chain.chaosByStep[room.step] ?? null;
  chain.entries.push({ kind: 'drawing', drawing: applyChaos(drawing, chaos), by: playerId, afk: false, chaos });
  afterSubmit(room, ctx);
}

export function submitGuess(room: Room, playerId: string, text: string, ctx: Ctx): void {
  requirePhase(room, 'STEP');
  requirePlayer(room, playerId);
  if (stepKind(room.step) !== 'guess') fail('WRONG_PHASE', "It's drawing time, not guessing time");
  const chain = chainFor(room, playerId)!;
  if (submittedStep(chain, room.step)) fail('ALREADY_SUBMITTED', 'Already sent!');
  const cleaned = cleanText(text).slice(0, LIMITS.guessMax);
  if (cleaned.length < LIMITS.guessMin) fail('TOO_SHORT', 'Guess something! Anything!');
  chain.entries.push({ kind: 'guess', text: cleaned, by: playerId, afk: false });
  afterSubmit(room, ctx);
}

// ---------- REVEAL ----------

function enterReveal(room: Room): void {
  room.phase = 'REVEAL';
  room.deadline = null;
  room.revealChain = 0;
  room.revealCount = 1; // the prompt shows straight away
}

/** Shows the next entry of the chain being revealed, then moves on to the next chain. */
export function revealNext(room: Room, playerId: string): void {
  requirePhase(room, 'REVEAL');
  requirePlayer(room, playerId);
  const chains = currentChains(room);
  const chain = chains[room.revealChain]!;
  if (room.revealCount < chain.entries.length) room.revealCount += 1;
  else if (room.revealChain < chains.length - 1) {
    room.revealChain += 1;
    room.revealCount = 1;
  } else fail('WRONG_PHASE', 'Everything is revealed already');
}

export function revealDone(room: Room): boolean {
  const chains = currentChains(room);
  return room.revealChain === chains.length - 1 && room.revealCount >= chains[room.revealChain]!.entries.length;
}

/** Whether a chain can be seen (and reacted to) right now. */
export function chainVisible(room: Room, chain: Chain): boolean {
  if (room.phase === 'RECAP' || chain.round < room.round) return true;
  return room.phase === 'REVEAL' && chain.owner <= room.revealChain;
}

export function react(room: Room, playerId: string, chainId: string, emoji: Reaction): void {
  requirePhase(room, 'REVEAL', 'RECAP');
  requirePlayer(room, playerId);
  const chain = room.chains.find((c) => c.id === chainId);
  if (!chain || !chainVisible(room, chain)) fail('WRONG_PHASE', 'That one is not revealed yet');
  chain!.reactions[emoji] += 1;
}

export function readyForNext(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'REVEAL');
  requirePlayer(room, playerId);
  if (!revealDone(room)) fail('WRONG_PHASE', 'Reveal everything first!');
  if (!room.readyForNext.includes(playerId)) room.readyForNext.push(playerId);
  if (room.players.every((p) => room.readyForNext.includes(p.id))) {
    if (room.round >= room.settings.rounds) {
      room.phase = 'RECAP';
      room.deadline = null;
      room.readyForNext = [];
    } else enterPrompt(room, room.round + 1, ctx);
  }
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
  if (room.phase === 'PROMPT') {
    for (const p of room.players) {
      const mine = room.pending[p.id]!;
      if (mine.text === null) {
        mine.text = mine.dealt;
        mine.fromDeck = true;
      }
    }
    startChains(room, ctx);
    return true;
  }
  if (room.phase === 'STEP') {
    const kind = stepKind(room.step);
    for (const chain of currentChains(room)) {
      if (submittedStep(chain, room.step)) continue;
      const by = room.players[(chain.owner + room.step) % 2]!.id;
      if (kind === 'drawing') {
        chain.entries.push({ kind: 'drawing', drawing: { strokes: [] }, by, afk: true, chaos: chain.chaosByStep[room.step] ?? null });
      } else chain.entries.push({ kind: 'guess', text: AFK_GUESS, by, afk: true });
    }
    afterSubmit(room, ctx);
    return true;
  }
  return false;
}
