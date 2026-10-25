// Bomb Squad — the rules. Pure functions with time and randomness passed in.
// Every bomb comes with a new manual edition (rules generated from a seed), a mix of module
// kinds that changes from bomb to bomb, and the Defuser's actions are checked against it.

import { firstPlayer, fail, pick, requireHost, requirePhase, requirePlayer, requireTwo, shuffle, type Ctx } from '@gfc/kit/server';
import {
  BUTTON_COLORS,
  BUTTON_LABELS,
  DIFFICULTIES,
  LED_COLORS,
  MAX_STRIKES,
  MODULE_KINDS,
  SIMON_COLORS,
  TAP_MS,
  WIRE_COLORS,
  buttonAction,
  formatTimer,
  makeEdition,
  mazeFor,
  memoryPress,
  releaseDigit,
  simonMap,
  spellable,
  switchShouldBeUp,
  symbolColumns,
  symbolOrder,
  wireToCut,
  type Bomb,
  type BombAct,
  type BombInfo,
  type Difficulty,
  type Dir,
  type Edition,
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
    lastKinds: [],
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

/** Editions are pure functions of their id; keep the few in use around. */
const editions = new Map<number, Edition>();
export function editionOf(id: number): Edition {
  let ed = editions.get(id);
  if (!ed) {
    ed = makeEdition(id);
    if (editions.size > 200) editions.clear();
    editions.set(id, ed);
  }
  return ed;
}

// ---------- bomb generation ----------

const SERIAL_CHARS = 'ABCDEFGHIJKLMNPQRSTUVWXZ0123456789';

export function makeSerial(rng: () => number): string {
  const body = Array.from({ length: 5 }, () => pick(SERIAL_CHARS.split(''), rng)).join('');
  return body + String(Math.floor(rng() * 10)); // always ends in a digit
}

const randomCell = (rng: () => number): [number, number] => [Math.floor(rng() * 6), Math.floor(rng() * 6)];

function memoryStage(rng: () => number) {
  return { display: 1 + Math.floor(rng() * 4), labels: shuffle([1, 2, 3, 4], rng) };
}

export function makeModule(kind: ModuleKind, ed: Edition, rng: () => number): Module {
  switch (kind) {
    case 'wires': {
      const n = 3 + Math.floor(rng() * 4);
      return { kind, wires: Array.from({ length: n }, () => pick(WIRE_COLORS, rng)), cut: [], solved: false };
    }
    case 'button':
      return { kind, color: pick(BUTTON_COLORS, rng), label: pick(BUTTON_LABELS, rng), holding: null, solved: false };
    case 'symbols': {
      // 4 symbols from one column that no other column also has all of.
      for (let tries = 0; ; tries++) {
        const col = pick(ed.symbols, rng);
        const four = shuffle(col, rng).slice(0, 4);
        if (symbolColumns(ed, four).length === 1 || tries > 500) return { kind, symbols: shuffle(four, rng), pressed: [], solved: false };
      }
    }
    case 'simon': {
      const len = 3 + Math.floor(rng() * 3);
      return { kind, flashes: Array.from({ length: len }, () => pick(SIMON_COLORS, rng)), stage: 1, input: [], solved: false };
    }
    case 'password': {
      for (;;) {
        const word = pick(ed.passwords, rng);
        const columns = [...word].map((ch) => {
          const others = shuffle('abcdefghijklmnopqrstuvwxyz'.replace(ch, '').split(''), rng).slice(0, 5);
          return shuffle([ch, ...others], rng);
        });
        if (spellable(ed, columns).length === 1) return { kind, columns, positions: columns.map(() => Math.floor(rng() * 6)), solved: false };
      }
    }
    case 'morse': {
      const pickd = pick(ed.morse, rng);
      const freqs = ed.morse.map((m) => m.freq).sort();
      let index = Math.floor(rng() * freqs.length);
      if (freqs[index] === pickd.freq) index = (index + 1) % freqs.length;
      return { kind, word: pickd.word, freqs, index, solved: false };
    }
    case 'maze': {
      const maze = Math.floor(rng() * ed.mazes.length);
      const m = ed.mazes[maze]!;
      const markers: [[number, number], [number, number]] = rng() < 0.5 ? [m.markers[0], m.markers[1]] : [m.markers[1], m.markers[0]];
      let pos = randomCell(rng);
      let goal = randomCell(rng);
      while (Math.abs(pos[0] - goal[0]) + Math.abs(pos[1] - goal[1]) < 5) {
        pos = randomCell(rng);
        goal = randomCell(rng);
      }
      return { kind, maze, markers, pos, goal, solved: false };
    }
    case 'memory':
      return { kind, stage: 0, ...memoryStage(rng), history: [], solved: false };
    case 'switches': {
      const leds = Array.from({ length: 5 }, () => pick(LED_COLORS, rng));
      return { kind, leds, up: Array.from({ length: 5 }, () => rng() < 0.5), solved: false };
    }
  }
}

/** Picks module kinds, favouring the ones that weren't on the last bomb. */
export function pickKinds(n: number, last: ModuleKind[], rng: () => number): ModuleKind[] {
  const fresh = shuffle(
    MODULE_KINDS.filter((k) => !last.includes(k)),
    rng,
  );
  const old = shuffle(
    MODULE_KINDS.filter((k) => last.includes(k)),
    rng,
  );
  return shuffle([...fresh, ...old].slice(0, n), rng);
}

export function makeBomb(difficulty: Difficulty, last: ModuleKind[], ctx: Ctx): Bomb {
  const { modules, seconds } = DIFFICULTIES[difficulty];
  const edition = 1000 + Math.floor(ctx.rng() * 9000);
  const ed = editionOf(edition);
  const kinds = pickKinds(modules, last, ctx.rng);
  return {
    edition,
    serial: makeSerial(ctx.rng),
    batteries: Math.floor(ctx.rng() * 5),
    modules: kinds.map((k) => makeModule(k, ed, ctx.rng)),
    strikes: 0,
    startedAt: ctx.now,
    endsAt: ctx.now + seconds * 1000,
  };
}

// ---------- game flow ----------

function arm(room: Room, ctx: Ctx): void {
  room.bomb = makeBomb(room.difficulty, room.lastKinds, ctx);
  room.lastKinds = room.bomb.modules.map((m) => m.kind);
  room.phase = 'ARMED';
  room.readyForNext = [];
}

export function startGame(room: Room, playerId: string, ctx: Ctx): void {
  requirePhase(room, 'LOBBY');
  requireHost(room, playerId);
  requireTwo(room);
  room.defuserId = firstPlayer(room, ctx.rng).id;
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
    kinds: bomb.modules.map((m) => m.kind),
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

const STEP: Record<Dir, [number, number, number]> = { up: [0, -1, 1], right: [1, 0, 2], down: [0, 1, 4], left: [-1, 0, 8] };

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
  const ed = editionOf(bomb.edition);
  const wrong = () => fail('BAD_INPUT', 'Wrong control');

  switch (mod.kind) {
    case 'wires': {
      if (a.op !== 'cut') return wrong();
      if (a.wire >= mod.wires.length || mod.cut.includes(a.wire)) return 'ok';
      mod.cut.push(a.wire);
      return a.wire === wireToCut(ed, mod.wires, info) ? solve(room, mod, ctx) : strike(room, ctx);
    }
    case 'button': {
      if (a.op === 'press') {
        if (!mod.holding) mod.holding = { strip: pick(BUTTON_COLORS, ctx.rng), since: ctx.now };
        return 'ok';
      }
      if (a.op !== 'release') return wrong();
      if (!mod.holding) return 'ok';
      const held = ctx.now - mod.holding.since;
      const strip = mod.holding.strip;
      mod.holding = null;
      const should = buttonAction(ed, mod.color, mod.label, info);
      if (held < TAP_MS) return should === 'tap' ? solve(room, mod, ctx) : strike(room, ctx);
      if (should === 'tap') return strike(room, ctx);
      // Trust what the player saw on the timer if it's within a second or so of the real time.
      const real = bomb.endsAt - ctx.now;
      const near = [real - 1500, real, real + 1500].map(formatTimer);
      const shown = near.includes(a.shown) ? a.shown : formatTimer(real);
      return shown.includes(releaseDigit(ed, strip)) ? solve(room, mod, ctx) : strike(room, ctx);
    }
    case 'symbols': {
      if (a.op !== 'symbol') return wrong();
      if (!mod.symbols.includes(a.symbol) || mod.pressed.includes(a.symbol)) return 'ok';
      const expected = symbolOrder(ed, mod.symbols)[mod.pressed.length];
      if (a.symbol !== expected) return strike(room, ctx);
      mod.pressed.push(a.symbol);
      return mod.pressed.length === 4 ? solve(room, mod, ctx) : 'ok';
    }
    case 'simon': {
      if (a.op !== 'simon') return wrong();
      const want = simonMap(ed, mod.flashes[mod.input.length]!, bomb.strikes, info);
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
      if (a.op !== 'submit') return wrong();
      const word = mod.columns.map((col, i) => col[mod.positions[i]!]).join('');
      return spellable(ed, mod.columns).includes(word) ? solve(room, mod, ctx) : strike(room, ctx);
    }
    case 'morse': {
      if (a.op === 'tune') {
        mod.index = (mod.index + a.dir + mod.freqs.length) % mod.freqs.length;
        return 'ok';
      }
      if (a.op !== 'transmit') return wrong();
      const want = ed.morse.find((m) => m.word === mod.word)!.freq;
      return mod.freqs[mod.index] === want ? solve(room, mod, ctx) : strike(room, ctx);
    }
    case 'maze': {
      if (a.op !== 'move') return wrong();
      const walls = ed.mazes[mazeFor(ed, mod.markers[0], mod.markers[1])]!.walls;
      const [dx, dy, bit] = STEP[a.dir];
      const [x, y] = mod.pos;
      // Walls, including the outer edge, are strikes: you stay where you are.
      if (walls[y * 6 + x]! & bit) return strike(room, ctx);
      mod.pos = [x + dx, y + dy];
      return mod.pos[0] === mod.goal[0] && mod.pos[1] === mod.goal[1] ? solve(room, mod, ctx) : 'ok';
    }
    case 'memory': {
      if (a.op !== 'memory') return wrong();
      const want = memoryPress(ed, mod.stage, mod.display, mod.labels, mod.history);
      if (a.pos !== want) {
        // Back to stage 1 with fresh numbers.
        mod.stage = 0;
        mod.history = [];
        Object.assign(mod, memoryStage(ctx.rng));
        return strike(room, ctx);
      }
      mod.history.push({ pos: a.pos, label: mod.labels[a.pos]! });
      if (mod.stage >= 4) return solve(room, mod, ctx);
      mod.stage += 1;
      Object.assign(mod, memoryStage(ctx.rng));
      return 'ok';
    }
    case 'switches': {
      if (a.op === 'flip') {
        mod.up[a.i] = !mod.up[a.i];
        return 'ok';
      }
      if (a.op !== 'check') return wrong();
      const ok = mod.leds.every((led, i) => mod.up[i] === switchShouldBeUp(ed, led, mod.leds, info));
      return ok ? solve(room, mod, ctx) : strike(room, ctx);
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

