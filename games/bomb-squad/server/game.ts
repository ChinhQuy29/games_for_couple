// Bomb Squad — the rules. Pure functions with time and randomness passed in.
// The Defuser acts on the bomb; every action is checked against the manual's solvers.

import { fail, pick, requireHost, requirePhase, requirePlayer, requireTwo, shuffle, type Ctx } from '@gfc/kit/server';
import {
  ALL_SYMBOLS,
  BUTTON_COLORS,
  BUTTON_LABELS,
  DIFFICULTIES,
  MANUAL,
  MAX_STRIKES,
  SIMON_COLORS,
  TAP_MS,
  WIRE_COLORS,
  buttonAction,
  formatTimer,
  releaseDigit,
  simonMap,
  spellable,
  symbolColumn,
  symbolOrder,
  wireToCut,
  type Bomb,
  type BombAct,
  type BombInfo,
  type Difficulty,
  type Module,
  type ModuleKind,
  type Room,
} from '../shared';

export function newRoom(code: string, ctx: Ctx): Room {
  return {
    code,
    createdAt: ctx.now,
    lastActivityAt: ctx.now,
    players: [],
    phase: 'LOBBY',
    difficulty: 'normal',
    bomb: null,
    defuserId: null,
    results: [],
    readyForNext: [],
  };
}

export function resetToLobby(room: Room): void {
  room.phase = 'LOBBY';
  room.bomb = null;
  room.defuserId = null;
  room.readyForNext = [];
}

export function setDifficulty(room: Room, playerId: string, difficulty: Difficulty): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  room.difficulty = difficulty;
}

// ---------- bomb generation ----------

const SERIAL_CHARS = 'ABCDEFGHIJKLMNPQRSTUVWXZ0123456789';

export function makeSerial(rng: () => number): string {
  const body = Array.from({ length: 5 }, () => pick(SERIAL_CHARS.split(''), rng)).join('');
  return body + String(Math.floor(rng() * 10)); // always ends in a digit
}

export function makeModule(kind: ModuleKind, rng: () => number): Module {
  switch (kind) {
    case 'wires': {
      const n = 3 + Math.floor(rng() * 4);
      return { kind, wires: Array.from({ length: n }, () => pick(WIRE_COLORS, rng)), cut: [], solved: false };
    }
    case 'button':
      return { kind, color: pick(BUTTON_COLORS, rng), label: pick(BUTTON_LABELS, rng), holding: null, solved: false };
    case 'symbols': {
      // Pick 4 symbols from one column such that no other column also has all 4.
      for (;;) {
        const col = pick(MANUAL.symbols.columns, rng);
        const four = shuffle(col, rng).slice(0, 4);
        if (symbolColumn(four).length === 1) return { kind, symbols: shuffle(four, rng), pressed: [], solved: false };
      }
    }
    case 'simon': {
      const len = 3 + Math.floor(rng() * 3);
      return { kind, flashes: Array.from({ length: len }, () => pick(SIMON_COLORS, rng)), stage: 1, input: [], solved: false };
    }
    case 'password': {
      for (;;) {
        const word = pick(MANUAL.password.words, rng);
        const columns = [...word].map((ch) => {
          const others = shuffle('abcdefghijklmnopqrstuvwxyz'.replace(ch, '').split(''), rng).slice(0, 5);
          return shuffle([ch, ...others], rng);
        });
        if (spellable(columns).length === 1) return { kind, columns, positions: columns.map(() => Math.floor(rng() * 6)), solved: false };
      }
    }
  }
}

export function makeBomb(difficulty: Difficulty, ctx: Ctx): Bomb {
  const { modules, seconds } = DIFFICULTIES[difficulty];
  // Always the three basics, then extra modules for harder bombs.
  const kinds: ModuleKind[] = ['wires', 'button', 'symbols', 'simon', 'password'].slice(0, modules) as ModuleKind[];
  return {
    serial: makeSerial(ctx.rng),
    batteries: Math.floor(ctx.rng() * 5),
    modules: shuffle(kinds, ctx.rng).map((k) => makeModule(k, ctx.rng)),
    strikes: 0,
    startedAt: ctx.now,
    endsAt: ctx.now + seconds * 1000,
  };
}

// ---------- game flow ----------

function arm(room: Room, ctx: Ctx): void {
  room.bomb = makeBomb(room.difficulty, ctx);
  room.phase = 'ARMED';
  room.readyForNext = [];
}

export function startGame(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  requireTwo(room);
  // Coin flip for the first Defuser; roles swap every bomb.
  room.defuserId = room.players[ctx.rng() < 0.5 ? 0 : 1]!.id;
  arm(room, ctx);
}

function explode(room: Room, cause: 'strikes' | 'time', ctx: Ctx): void {
  finish(room, 'exploded', cause, ctx);
}

function finish(room: Room, outcome: 'defused' | 'exploded', cause: 'strikes' | 'time' | null, ctx: Ctx): void {
  const bomb = room.bomb!;
  room.results.push({
    n: room.results.length + 1,
    defuserId: room.defuserId!,
    outcome,
    cause,
    timeLeftMs: Math.max(0, bomb.endsAt - ctx.now),
    strikes: bomb.strikes,
    difficulty: room.difficulty,
  });
  room.phase = 'RESULT';
}

function strike(room: Room, ctx: Ctx): 'strike' {
  const bomb = room.bomb!;
  bomb.strikes += 1;
  if (bomb.strikes >= MAX_STRIKES) explode(room, 'strikes', ctx);
  return 'strike';
}

function solve(room: Room, mod: Module, ctx: Ctx): 'solved' {
  mod.solved = true;
  if (room.bomb!.modules.every((m) => m.solved)) finish(room, 'defused', null, ctx);
  return 'solved';
}

/** One Defuser interaction. Returns what happened, for feedback. */
export function act(room: Room, playerId: string, a: BombAct, ctx: Ctx): 'ok' | 'strike' | 'solved' {
  requirePhase(room, 'ARMED');
  requirePlayer(room, playerId);
  if (room.defuserId !== playerId) fail('NOT_YOUR_ROLE', "You're the Expert: read the manual and talk! 📖");
  const bomb = room.bomb!;
  if (ctx.now >= bomb.endsAt) {
    explode(room, 'time', ctx);
    return 'strike';
  }
  const mod = bomb.modules[a.module] ?? fail('BAD_INPUT', 'No such module');
  if (mod.solved) return 'ok';
  const info: BombInfo = { serial: bomb.serial, batteries: bomb.batteries };

  switch (mod.kind) {
    case 'wires': {
      if (a.op !== 'cut') fail('BAD_INPUT', 'Wrong control');
      if (a.op !== 'cut' || a.wire >= mod.wires.length || mod.cut.includes(a.wire)) return 'ok';
      mod.cut.push(a.wire);
      return a.wire === wireToCut(mod.wires, info) ? solve(room, mod, ctx) : strike(room, ctx);
    }
    case 'button': {
      if (a.op === 'press') {
        if (!mod.holding) mod.holding = { strip: pick(BUTTON_COLORS, ctx.rng), since: ctx.now };
        return 'ok';
      }
      if (a.op !== 'release') fail('BAD_INPUT', 'Wrong control');
      if (a.op !== 'release' || !mod.holding) return 'ok';
      const held = ctx.now - mod.holding.since;
      const strip = mod.holding.strip;
      mod.holding = null;
      const should = buttonAction(mod.color, mod.label, info);
      if (held < TAP_MS) return should === 'tap' ? solve(room, mod, ctx) : strike(room, ctx);
      if (should === 'tap') return strike(room, ctx);
      // Trust what the player saw on the timer if it's within a second or so of the real time.
      const real = bomb.endsAt - ctx.now;
      const near = [real - 1500, real, real + 1500].map(formatTimer);
      const shown = near.includes(a.shown) ? a.shown : formatTimer(real);
      return shown.includes(releaseDigit(strip)) ? solve(room, mod, ctx) : strike(room, ctx);
    }
    case 'symbols': {
      if (a.op !== 'symbol') fail('BAD_INPUT', 'Wrong control');
      if (a.op !== 'symbol' || !mod.symbols.includes(a.symbol) || mod.pressed.includes(a.symbol)) return 'ok';
      const expected = symbolOrder(mod.symbols)[mod.pressed.length];
      if (a.symbol !== expected) return strike(room, ctx);
      mod.pressed.push(a.symbol);
      return mod.pressed.length === 4 ? solve(room, mod, ctx) : 'ok';
    }
    case 'simon': {
      if (a.op !== 'simon') fail('BAD_INPUT', 'Wrong control');
      if (a.op !== 'simon') return 'ok';
      const want = simonMap(mod.flashes[mod.input.length]!, bomb.strikes, info);
      if (a.color !== want) {
        mod.input = [];
        return strike(room, ctx);
      }
      mod.input.push(a.color);
      if (mod.input.length < mod.stage) return 'ok';
      mod.input = [];
      if (mod.stage >= mod.flashes.length) return solve(room, mod, ctx);
      mod.stage += 1;
      return 'ok';
    }
    case 'password': {
      if (a.op === 'spin') {
        mod.positions[a.column] = (mod.positions[a.column]! + a.dir + 6) % 6;
        return 'ok';
      }
      if (a.op !== 'submit') fail('BAD_INPUT', 'Wrong control');
      const word = mod.columns.map((col, i) => col[mod.positions[i]!]).join('');
      return spellable(mod.columns).includes(word) ? solve(room, mod, ctx) : strike(room, ctx);
    }
  }
}

/** RESULT → both press "next bomb": roles swap and a new bomb is armed. */
export function readyForNext(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'RESULT');
  requirePlayer(room, playerId);
  if (!room.readyForNext.includes(playerId)) room.readyForNext.push(playerId);
  if (room.readyForNext.length < room.players.length) return;
  room.defuserId = room.players.find((p) => p.id !== room.defuserId)?.id ?? room.defuserId;
  arm(room, ctx);
}

export function toLobby(room: Room, playerId: string): void {
  requirePhase(room, 'RESULT');
  requireHost(room, playerId);
  resetToLobby(room);
}

export const wakeAt = (room: Room): number | null => (room.phase === 'ARMED' && room.bomb ? room.bomb.endsAt : null);

export function tick(room: Room, ctx: Ctx): boolean {
  if (room.phase === 'ARMED' && room.bomb && ctx.now >= room.bomb.endsAt) {
    explode(room, 'time', ctx);
    return true;
  }
  return false;
}

export { ALL_SYMBOLS };
