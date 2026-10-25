import { describe, expect, it } from 'vitest';
import { addPlayer, seededRng } from '@gfc/kit/server';
import {
  MODULE_KINDS,
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
  type BombAct,
  type Module,
  type Room,
} from '../../shared';
import * as game from '../game';
import { toPublicState } from '../index';

const ctxAt = (now: number, seed = 1) => ({ now, rng: seededRng(seed) });

function armed(difficulty: Room['difficulty'] = 'normal', seed = 1) {
  const room = game.newRoom('ABCD', ctxAt(0));
  addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
  addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
  game.setDifficulty(room, 'pa', difficulty);
  game.startGame(room, 'pa', ctxAt(0, seed));
  const defuser = room.defuserId!;
  const expert = defuser === 'pa' ? 'pb' : 'pa';
  return { room, defuser, expert, bomb: room.bomb! };
}

/** Puts exactly these modules on the bomb. */
function withKinds(room: Room, kinds: Module['kind'][], seed = 5) {
  const ed = game.editionOf(room.bomb!.edition);
  room.bomb!.modules = kinds.map((k) => game.makeModule(k, ed, seededRng(seed)));
}

/** Plays a module perfectly, the way a Defuser following the manual would. */
function solveModule(room: Room, defuser: string, index: number, now = 1000): string {
  const bomb = room.bomb!;
  const ed = game.editionOf(bomb.edition);
  const info = { serial: bomb.serial, batteries: bomb.batteries };
  const m = bomb.modules[index]!;
  const act = (a: BombAct, t = now) => game.act(room, defuser, a, ctxAt(t));
  let r = 'ok';
  switch (m.kind) {
    case 'wires':
      return act({ op: 'cut', module: index, wire: wireToCut(ed, m.wires, info) });
    case 'button': {
      const should = buttonAction(ed, m.color, m.label, info);
      act({ op: 'press', module: index }, now);
      if (should === 'tap') return act({ op: 'release', module: index, shown: '' }, now + 100);
      const digit = releaseDigit(ed, m.holding!.strip);
      // Find a moment where the timer shows that digit.
      for (let t = now + 1000; t < bomb.endsAt; t += 1000) {
        const shown = formatTimer(bomb.endsAt - t);
        if (shown.includes(digit)) return act({ op: 'release', module: index, shown }, t);
      }
      return 'no-digit';
    }
    case 'symbols':
      for (const s of symbolOrder(ed, m.symbols)) r = act({ op: 'symbol', module: index, symbol: s });
      return r;
    case 'simon':
      while (!m.solved && room.phase === 'ARMED') for (const f of m.flashes.slice(0, m.stage)) r = act({ op: 'simon', module: index, color: simonMap(ed, f, bomb.strikes, info) });
      return r;
    case 'password': {
      const word = spellable(ed, m.columns)[0]!;
      [...word].forEach((ch, i) => {
        while (m.columns[i]![m.positions[i]!] !== ch) act({ op: 'spin', module: index, column: i, dir: 1 });
      });
      return act({ op: 'submit', module: index });
    }
    case 'morse': {
      const want = ed.morse.find((x) => x.word === m.word)!.freq;
      while (m.freqs[m.index] !== want) act({ op: 'tune', module: index, dir: 1 });
      return act({ op: 'transmit', module: index });
    }
    case 'maze': {
      const walls = ed.mazes[mazeFor(ed, m.markers[0], m.markers[1])]!.walls;
      const steps: [BombAct & { op: 'move' }, number, number, number][] = [
        [{ op: 'move', module: index, dir: 'up' }, 0, -1, 1],
        [{ op: 'move', module: index, dir: 'right' }, 1, 0, 2],
        [{ op: 'move', module: index, dir: 'down' }, 0, 1, 4],
        [{ op: 'move', module: index, dir: 'left' }, -1, 0, 8],
      ];
      // BFS from pos to goal.
      const key = (x: number, y: number) => y * 6 + x;
      const prev = new Map<number, [number, number]>();
      const q: [number, number][] = [m.pos];
      prev.set(key(...m.pos), [-1, -1]);
      while (q.length) {
        const [x, y] = q.shift()!;
        steps.forEach(([, dx, dy, bit], si) => {
          if (walls[key(x, y)]! & bit) return;
          const n = key(x + dx, y + dy);
          if (prev.has(n)) return;
          prev.set(n, [key(x, y), si]);
          q.push([x + dx, y + dy]);
        });
      }
      const path: number[] = [];
      for (let c = key(...m.goal); c !== key(...m.pos); c = prev.get(c)![0]) path.unshift(prev.get(c)![1]);
      for (const si of path) r = act(steps[si]![0]);
      return r;
    }
    case 'memory':
      while (!m.solved) r = act({ op: 'memory', module: index, pos: memoryPress(ed, m.stage, m.display, m.labels, m.history) });
      return r;
    case 'switches':
      m.leds.forEach((led, i) => {
        if (m.up[i] !== switchShouldBeUp(ed, led, m.leds, info)) act({ op: 'flip', module: index, i });
      });
      return act({ op: 'check', module: index });
  }
}

describe('manual editions', () => {
  it('are deterministic per id and different across ids', () => {
    expect(makeEdition(1234)).toEqual(makeEdition(1234));
    const a = makeEdition(1234);
    const b = makeEdition(4321);
    expect(a.button.strip).not.toEqual(b.button.strip);
    expect(a.symbols).not.toEqual(b.symbols);
  });

  it('every edition is playable: mazes are identifiable, strips use distinct digits', () => {
    for (let id = 1000; id < 1060; id++) {
      const ed = makeEdition(id);
      expect(new Set(Object.values(ed.button.strip)).size).toBe(4);
      for (let i = 0; i < ed.mazes.length; i++) expect(mazeFor(ed, ed.mazes[i]!.markers[0], ed.mazes[i]!.markers[1])).toBe(i);
      expect(new Set(ed.morse.map((m) => m.freq)).size).toBe(8);
      for (const n of [3, 4, 5, 6] as const)
        for (let k = 0; k < 20; k++) {
          const wires = Array.from({ length: n }, (_, i) => (['red', 'blue', 'yellow', 'white', 'black'] as const)[(k * 7 + i * 3 + id) % 5]!);
          const cut = wireToCut(ed, wires, { serial: 'AB3CD7', batteries: k % 5 });
          expect(cut).toBeGreaterThanOrEqual(0);
          expect(cut).toBeLessThan(n);
        }
    }
  });

  it('generated modules are unambiguous: one symbol column, one spellable password', () => {
    for (let id = 1000; id < 1030; id++) {
      const ed = makeEdition(id);
      for (let s = 1; s < 6; s++) {
        const sym = game.makeModule('symbols', ed, seededRng(s)) as Extract<Module, { kind: 'symbols' }>;
        expect(symbolColumns(ed, sym.symbols)).toHaveLength(1);
        const pw = game.makeModule('password', ed, seededRng(s)) as Extract<Module, { kind: 'password' }>;
        expect(spellable(ed, pw.columns)).toHaveLength(1);
      }
    }
  });
});

describe('bombs', () => {
  it('mix modules up: the next bomb favours kinds the last one did not have', () => {
    const last = ['wires', 'button', 'symbols', 'simon'] as const;
    for (let s = 1; s < 10; s++) {
      const kinds = game.pickKinds(4, [...last], seededRng(s));
      expect(kinds.every((k) => !last.includes(k as (typeof last)[number]))).toBe(true);
    }
    expect(new Set(game.pickKinds(6, [], seededRng(2))).size).toBe(6);
  });

  it('every module kind can be defused; a full hard bomb defuses', () => {
    const { room, defuser } = armed('hard', 3);
    withKinds(room, [...MODULE_KINDS]);
    room.bomb!.endsAt = 10_000_000;
    MODULE_KINDS.forEach((kind, i) => expect(solveModule(room, defuser, i), kind).toBe('solved'));
    expect(room.phase).toBe('RESULT');
    expect(room.results[0]).toMatchObject({ outcome: 'defused', strikes: 0 });
  });

  it('mistakes strike: a wrong wire, a maze wall, a wrong memory press; three strikes explode', () => {
    const { room, defuser } = armed('normal', 4);
    withKinds(room, ['wires', 'maze', 'memory']);
    const bomb = room.bomb!;
    const ed = game.editionOf(bomb.edition);
    const w = bomb.modules[0] as Extract<Module, { kind: 'wires' }>;
    const right = wireToCut(ed, w.wires, bomb);
    expect(game.act(room, defuser, { op: 'cut', module: 0, wire: (right + 1) % w.wires.length }, ctxAt(1000))).toBe('strike');
    const mz = bomb.modules[1] as Extract<Module, { kind: 'maze' }>;
    const walls = ed.mazes[mz.maze]!.walls;
    const blocked = (['up', 'right', 'down', 'left'] as const).find((d, i) => walls[mz.pos[1] * 6 + mz.pos[0]]! & [1, 2, 4, 8][i]!)!;
    const before = [...mz.pos];
    expect(game.act(room, defuser, { op: 'move', module: 1, dir: blocked }, ctxAt(1000))).toBe('strike');
    expect(mz.pos).toEqual(before);
    const mem = bomb.modules[2] as Extract<Module, { kind: 'memory' }>;
    const want = memoryPress(ed, mem.stage, mem.display, mem.labels, mem.history);
    game.act(room, defuser, { op: 'memory', module: 2, pos: (want + 1) % 4 }, ctxAt(1000));
    expect(room.phase).toBe('RESULT');
    expect(room.results[0]).toMatchObject({ outcome: 'exploded', cause: 'strikes' });
  });

  it('a new bomb brings a new edition and swapped roles', () => {
    const { room, defuser, bomb } = armed();
    game.tick(room, ctxAt(bomb.endsAt));
    expect(room.results[0]!.cause).toBe('time');
    game.readyForNext(room, 'pa', ctxAt(500_000, 9));
    game.readyForNext(room, 'pb', ctxAt(500_000, 9));
    expect(room.defuserId).not.toBe(defuser);
    expect(room.bomb!.edition).not.toBe(bomb.edition);
  });

  it('only the Expert gets the manual and only the Defuser gets the bomb', () => {
    const { room, defuser, expert } = armed();
    const d = toPublicState(room, defuser, 0);
    const e = toPublicState(room, expert, 0);
    expect(d.bomb).not.toBeNull();
    expect(d.manual).toBeNull();
    expect(e.bomb).toBeNull();
    expect(e.manual?.id).toBe(room.bomb!.edition);
    expect(e.kinds).toEqual(room.bomb!.modules.map((m) => m.kind));
    expect(JSON.stringify(d)).not.toContain('token-');
  });

  it('only the Defuser can act', () => {
    const { room, expert } = armed();
    expect(() => game.act(room, expert, { op: 'cut', module: 0, wire: 0 }, ctxAt(1000))).toThrow(/Expert/);
  });
});

describe('who goes first', () => {
  it('the lobby choice picks the first Defuser: the host, the guest, or random', () => {
    for (const [first, expected] of [['host', 'pa'], ['guest', 'pb']] as const) {
      const room = game.newRoom('ABCD', ctxAt(0));
      addPlayer(room, { id: 'pa', token: 'token-aaaaaaaaaa', name: 'Alex' });
      addPlayer(room, { id: 'pb', token: 'token-bbbbbbbbbb', name: 'Bao' });
      room.first = first;
      game.startGame(room, 'pa', ctxAt(0, 3));
      expect(room.defuserId).toBe(expected);
    }
  });
});
