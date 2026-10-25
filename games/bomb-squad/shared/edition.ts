// The manual changes every bomb. An Edition is plain data generated from a seed: the
// Expert's manual is rendered from it, and the server checks every action against it.
// Solvers here are pure functions of (edition, bomb info, module).

export type WireColor = 'red' | 'blue' | 'yellow' | 'white' | 'black';
export const WIRE_COLORS: WireColor[] = ['red', 'blue', 'yellow', 'white', 'black'];
export type ButtonColor = 'red' | 'blue' | 'yellow' | 'white';
export const BUTTON_COLORS: ButtonColor[] = ['red', 'blue', 'yellow', 'white'];
export const BUTTON_LABELS = ['ABORT', 'DETONATE', 'HOLD', 'PRESS'] as const;
export type ButtonLabel = (typeof BUTTON_LABELS)[number];
export type SimonColor = 'red' | 'blue' | 'green' | 'yellow';
export const SIMON_COLORS: SimonColor[] = ['red', 'blue', 'green', 'yellow'];
export type LedColor = 'red' | 'green' | 'blue' | 'yellow';
export const LED_COLORS: LedColor[] = ['red', 'green', 'blue', 'yellow'];

export const SYMBOL_POOL = ['Ϙ', 'Ѧ', 'ƛ', 'Ϟ', 'Ѭ', 'ϗ', 'Ͽ', 'Ӭ', 'Ҩ', '☆', '¿', '©', 'Ѽ', 'Ж', 'Ԇ', 'б', '¶', 'Ѣ', 'ټ', 'Ψ', 'Ͼ', 'Ѯ', '★', '҂', 'æ', 'Ҋ', 'Ω', '♁'];

export const PASSWORD_POOL = [
  'about', 'after', 'again', 'below', 'could', 'every', 'first', 'found', 'great', 'house', 'large', 'learn', 'never',
  'other', 'place', 'plant', 'point', 'right', 'small', 'sound', 'spell', 'still', 'study', 'their', 'there', 'these',
  'thing', 'think', 'three', 'water', 'where', 'which', 'world', 'would', 'write', 'apple', 'beach', 'brave', 'chair',
  'dance', 'dream', 'earth', 'flame', 'ghost', 'happy', 'heart', 'jelly', 'light', 'lucky', 'magic', 'mango', 'music',
  'night', 'ocean', 'party', 'piano', 'queen', 'river', 'smile', 'storm', 'sugar', 'tiger', 'toast', 'virus', 'whale',
];

export const MORSE: Record<string, string> = {
  a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--',
  n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..',
};
export const MORSE_POOL = ['shell', 'halls', 'slick', 'trick', 'boxes', 'leaks', 'strobe', 'bistro', 'flick', 'bombs', 'break', 'brick', 'steak', 'sting', 'vector', 'beats'];

export interface BombInfo {
  serial: string;
  batteries: number;
}

const lastDigit = (serial: string) => Number([...serial].reverse().find((c) => /\d/.test(c)) ?? 0);
export const serialOdd = (b: BombInfo) => lastDigit(b.serial) % 2 === 1;
export const serialHasVowel = (b: BombInfo) => /[AEIOU]/.test(b.serial);

// ---------- rule types ----------

export type WireCond =
  | { k: 'none'; color: WireColor }
  | { k: 'exactly'; color: WireColor; n: number }
  | { k: 'moreThan'; color: WireColor; n: number }
  | { k: 'last'; color: WireColor }
  | { k: 'first'; color: WireColor }
  | { k: 'batteries'; n: number }
  | { k: 'odd' }
  | { k: 'even' }
  | { k: 'vowel' };
export type WireTarget = { k: 'pos'; i: number } | { k: 'lastPos' } | { k: 'firstOf'; color: WireColor } | { k: 'lastOf'; color: WireColor };
export interface WireRule {
  when: WireCond[];
  cut: WireTarget;
}

export type ButtonAtom = { k: 'color'; c: ButtonColor } | { k: 'label'; l: ButtonLabel } | { k: 'batteries'; n: number } | { k: 'vowel' } | { k: 'odd' };
export interface ButtonRule {
  when: ButtonAtom[];
  act: 'tap' | 'hold';
}

/** Memory: what to press at stage s when the display shows d. */
export type MemoryStep = { k: 'pos'; i: number } | { k: 'label'; l: number } | { k: 'samePos'; stage: number } | { k: 'sameLabel'; stage: number };

export type SwitchRule = { k: 'always'; up: boolean } | { k: 'odd'; up: boolean } | { k: 'vowel'; up: boolean } | { k: 'batteries'; n: number; up: boolean } | { k: 'many'; n: number; up: boolean };

export interface MazeDef {
  /** 6×6 cells, walls bitmask N=1 E=2 S=4 W=8. */
  walls: number[];
  /** The two circles that identify this maze. */
  markers: [[number, number], [number, number]];
}

export interface Edition {
  id: number;
  wires: Record<3 | 4 | 5 | 6, { rules: WireRule[]; otherwise: WireTarget }>;
  button: { rules: ButtonRule[]; otherwise: 'tap' | 'hold'; strip: Record<ButtonColor, string> };
  symbols: string[][];
  simon: Record<'vowel' | 'noVowel', Record<SimonColor, SimonColor>[]>;
  passwords: string[];
  morse: { word: string; freq: string }[];
  mazes: MazeDef[];
  memory: MemoryStep[][];
  switches: Record<LedColor, SwitchRule>;
}

// ---------- generation ----------

export function rngFrom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pickR = <T>(arr: readonly T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)]!;
function shuffleR<T>(arr: readonly T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function wireRule(n: number, rng: () => number): WireRule {
  const color = pickR(WIRE_COLORS, rng);
  const pos = (): WireTarget => (rng() < 0.2 ? { k: 'lastPos' } : { k: 'pos', i: Math.floor(rng() * n) });
  switch (Math.floor(rng() * 8)) {
    case 0:
      return { when: [{ k: 'none', color }], cut: pos() };
    case 1:
      return { when: [{ k: 'exactly', color, n: 1 }], cut: rng() < 0.5 ? { k: 'firstOf', color } : pos() };
    case 2:
      return { when: [{ k: 'moreThan', color, n: 1 }, rng() < 0.5 ? { k: 'odd' } : { k: 'even' }], cut: { k: 'lastOf', color } };
    case 3:
      return { when: [{ k: 'last', color }], cut: pos() };
    case 4:
      return { when: [{ k: 'first', color }], cut: rng() < 0.5 ? { k: 'firstOf', color } : pos() };
    case 5:
      return { when: [{ k: 'batteries', n: 2 + Math.floor(rng() * 2) }, { k: 'moreThan', color, n: 0 }], cut: { k: 'lastOf', color } };
    case 6:
      return { when: [{ k: 'vowel' }, { k: 'none', color }], cut: pos() };
    default:
      return { when: [{ k: 'exactly', color, n: 2 }], cut: rng() < 0.5 ? { k: 'lastOf', color } : pos() };
  }
}

function buttonRule(rng: () => number): ButtonRule {
  const c = pickR(BUTTON_COLORS, rng);
  const l = pickR(BUTTON_LABELS, rng);
  const act = rng() < 0.5 ? 'tap' : 'hold';
  switch (Math.floor(rng() * 5)) {
    case 0:
      return { when: [{ k: 'color', c }, { k: 'label', l }], act };
    case 1:
      return { when: [{ k: 'batteries', n: 2 + Math.floor(rng() * 2) }, { k: 'label', l }], act };
    case 2:
      return { when: [{ k: 'color', c }, { k: 'vowel' }], act };
    case 3:
      return { when: [{ k: 'batteries', n: 2 + Math.floor(rng() * 2) }, { k: 'color', c }], act };
    default:
      return { when: [{ k: 'label', l }, { k: 'odd' }], act };
  }
}

export function makeMaze(rng: () => number): number[] {
  const size = 6;
  const walls = Array.from({ length: size * size }, () => 15);
  const seen = new Set([0]);
  const stack = [0];
  const dirs: [number, number, number, number][] = [
    [0, -1, 1, 4],
    [1, 0, 2, 8],
    [0, 1, 4, 1],
    [-1, 0, 8, 2],
  ];
  while (stack.length) {
    const cur = stack[stack.length - 1]!;
    const x = cur % size;
    const y = Math.floor(cur / size);
    const opts = dirs.filter(([dx, dy]) => x + dx >= 0 && y + dy >= 0 && x + dx < size && y + dy < size && !seen.has((y + dy) * size + x + dx));
    if (!opts.length) {
      stack.pop();
      continue;
    }
    const [dx, dy, wall, back] = pickR(opts, rng);
    const next = (y + dy) * size + x + dx;
    walls[cur]! &= ~wall;
    walls[next]! &= ~back;
    seen.add(next);
    stack.push(next);
  }
  return walls;
}

function memoryTable(rng: () => number): MemoryStep[][] {
  return Array.from({ length: 5 }, (_, s) =>
    Array.from({ length: 4 }, (): MemoryStep => {
      const r = rng();
      if (s === 0 || r < 0.35) return { k: 'pos', i: Math.floor(rng() * 4) };
      if (r < 0.6) return { k: 'label', l: 1 + Math.floor(rng() * 4) };
      const stage = Math.floor(rng() * s);
      return rng() < 0.5 ? { k: 'samePos', stage } : { k: 'sameLabel', stage };
    }),
  );
}

function switchRule(rng: () => number): SwitchRule {
  const up = rng() < 0.5;
  switch (Math.floor(rng() * 5)) {
    case 0:
      return { k: 'always', up };
    case 1:
      return { k: 'odd', up };
    case 2:
      return { k: 'vowel', up };
    case 3:
      return { k: 'batteries', n: 1 + Math.floor(rng() * 3), up };
    default:
      return { k: 'many', n: 2, up };
  }
}

export function makeEdition(id: number): Edition {
  const rng = rngFrom(id * 7919 + 17);
  const wires = Object.fromEntries(
    ([3, 4, 5, 6] as const).map((n) => [n, { rules: Array.from({ length: 3 }, () => wireRule(n, rng)), otherwise: { k: 'pos', i: Math.floor(rng() * n) } as WireTarget }]),
  ) as Edition['wires'];
  const digits = shuffleR(['1', '2', '3', '4', '5'], rng);
  const button: Edition['button'] = {
    rules: Array.from({ length: 4 }, () => buttonRule(rng)),
    otherwise: rng() < 0.5 ? 'tap' : 'hold',
    strip: { red: digits[0]!, blue: digits[1]!, yellow: digits[2]!, white: digits[3]! },
  };
  const symbols = Array.from({ length: 6 }, () => shuffleR(SYMBOL_POOL, rng).slice(0, 7));
  const perm = () => {
    const p = shuffleR(SIMON_COLORS, rng);
    return Object.fromEntries(SIMON_COLORS.map((c, i) => [c, p[i]!])) as Record<SimonColor, SimonColor>;
  };
  const simon = { vowel: [perm(), perm(), perm()], noVowel: [perm(), perm(), perm()] };
  const passwords = shuffleR(PASSWORD_POOL, rng).slice(0, 30);
  const freqs = shuffleR(Array.from({ length: 16 }, (_, i) => (3.5 + i * 0.01 + (i > 7 ? 0.02 : 0)).toFixed(3)), rng);
  const morse = shuffleR(MORSE_POOL, rng)
    .slice(0, 8)
    .map((word, i) => ({ word, freq: freqs[i]! }))
    .sort((a, b) => a.word.localeCompare(b.word));
  // Six mazes, each identified by a unique pair of circle cells.
  const cells = shuffleR(Array.from({ length: 36 }, (_, i) => i), rng);
  const mazes: MazeDef[] = Array.from({ length: 6 }, (_, i) => ({
    walls: makeMaze(rng),
    markers: [
      [cells[i * 2]! % 6, Math.floor(cells[i * 2]! / 6)],
      [cells[i * 2 + 1]! % 6, Math.floor(cells[i * 2 + 1]! / 6)],
    ],
  }));
  const switches = Object.fromEntries(LED_COLORS.map((c) => [c, switchRule(rng)])) as Record<LedColor, SwitchRule>;
  return { id, wires, button, symbols, simon, passwords, morse, mazes, memory: memoryTable(rng), switches };
}

// ---------- solvers ----------

const count = <T>(arr: T[], v: T) => arr.filter((x) => x === v).length;

function wireCond(c: WireCond, wires: WireColor[], b: BombInfo): boolean {
  switch (c.k) {
    case 'none':
      return count(wires, c.color) === 0;
    case 'exactly':
      return count(wires, c.color) === c.n;
    case 'moreThan':
      return count(wires, c.color) > c.n;
    case 'last':
      return wires[wires.length - 1] === c.color;
    case 'first':
      return wires[0] === c.color;
    case 'batteries':
      return b.batteries >= c.n;
    case 'odd':
      return serialOdd(b);
    case 'even':
      return !serialOdd(b);
    case 'vowel':
      return serialHasVowel(b);
  }
}

function target(t: WireTarget, wires: WireColor[]): number {
  switch (t.k) {
    case 'pos':
      return Math.min(t.i, wires.length - 1);
    case 'lastPos':
      return wires.length - 1;
    case 'firstOf':
      return wires.indexOf(t.color);
    case 'lastOf':
      return wires.lastIndexOf(t.color);
  }
}

/** Index of the wire to cut: the first rule whose conditions all hold (and whose target exists). */
export function wireToCut(ed: Edition, wires: WireColor[], b: BombInfo): number {
  const table = ed.wires[wires.length as 3 | 4 | 5 | 6];
  for (const r of table.rules) {
    if (r.when.every((c) => wireCond(c, wires, b))) {
      const i = target(r.cut, wires);
      if (i >= 0) return i;
    }
  }
  return target(table.otherwise, wires);
}

function buttonAtom(a: ButtonAtom, color: ButtonColor, label: ButtonLabel, b: BombInfo): boolean {
  switch (a.k) {
    case 'color':
      return color === a.c;
    case 'label':
      return label === a.l;
    case 'batteries':
      return b.batteries >= a.n;
    case 'vowel':
      return serialHasVowel(b);
    case 'odd':
      return serialOdd(b);
  }
}

export function buttonAction(ed: Edition, color: ButtonColor, label: ButtonLabel, b: BombInfo): 'tap' | 'hold' {
  return ed.button.rules.find((r) => r.when.every((a) => buttonAtom(a, color, label, b)))?.act ?? ed.button.otherwise;
}

export const releaseDigit = (ed: Edition, strip: ButtonColor) => ed.button.strip[strip];

/** Columns containing all of these symbols. */
export const symbolColumns = (ed: Edition, symbols: string[]) => ed.symbols.map((col, i) => (symbols.every((s) => col.includes(s)) ? i : -1)).filter((i) => i >= 0);

export function symbolOrder(ed: Edition, symbols: string[]): string[] {
  const col = ed.symbols[symbolColumns(ed, symbols)[0]!]!;
  return [...symbols].sort((a, b) => col.indexOf(a) - col.indexOf(b));
}

export const simonMap = (ed: Edition, flashed: SimonColor, strikes: number, b: BombInfo) => ed.simon[serialHasVowel(b) ? 'vowel' : 'noVowel'][Math.min(2, strikes)]![flashed];

export const spellable = (ed: Edition, columns: string[][]) => ed.passwords.filter((w) => [...w].every((ch, i) => columns[i]!.includes(ch)));

/** Which position (0–3) to press on the memory module. */
export function memoryPress(ed: Edition, stage: number, display: number, labels: number[], history: { pos: number; label: number }[]): number {
  const step = ed.memory[stage]![display - 1]!;
  switch (step.k) {
    case 'pos':
      return step.i;
    case 'label':
      return labels.indexOf(step.l);
    case 'samePos':
      return history[step.stage]!.pos;
    case 'sameLabel':
      return labels.indexOf(history[step.stage]!.label);
  }
}

export function switchShouldBeUp(ed: Edition, led: LedColor, leds: LedColor[], b: BombInfo): boolean {
  const r = ed.switches[led];
  switch (r.k) {
    case 'always':
      return r.up;
    case 'odd':
      return serialOdd(b) ? r.up : !r.up;
    case 'vowel':
      return serialHasVowel(b) ? r.up : !r.up;
    case 'batteries':
      return b.batteries >= r.n ? r.up : !r.up;
    case 'many':
      return count(leds, led) >= r.n ? r.up : !r.up;
  }
}

/** Which maze the two circles identify (the circles can be listed either way round). */
export function mazeFor(ed: Edition, a: [number, number], b: [number, number]): number {
  const same = (p: [number, number], q: [number, number]) => p[0] === q[0] && p[1] === q[1];
  return ed.mazes.findIndex((m) => (same(m.markers[0], a) && same(m.markers[1], b)) || (same(m.markers[0], b) && same(m.markers[1], a)));
}

export function morseFor(word: string): string {
  return [...word].map((c) => MORSE[c] ?? '').join(' ');
}

// ---------- manual text ----------

const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

function condText(c: WireCond): string {
  switch (c.k) {
    case 'none':
      return `there are no ${c.color} wires`;
    case 'exactly':
      return `there ${c.n === 1 ? 'is' : 'are'} exactly ${plural(c.n, `${c.color} wire`)}`;
    case 'moreThan':
      return c.n === 0 ? `there is at least one ${c.color} wire` : `there are more than ${plural(c.n, `${c.color} wire`)}`;
    case 'last':
      return `the last wire is ${c.color}`;
    case 'first':
      return `the first wire is ${c.color}`;
    case 'batteries':
      return `there are ${c.n} or more batteries`;
    case 'odd':
      return "the serial number's last digit is odd";
    case 'even':
      return "the serial number's last digit is even";
    case 'vowel':
      return 'the serial number contains a vowel';
  }
}

function targetText(t: WireTarget): string {
  switch (t.k) {
    case 'pos':
      return `the ${ORD[t.i]} wire`;
    case 'lastPos':
      return 'the last wire';
    case 'firstOf':
      return `the first ${t.color} wire`;
    case 'lastOf':
      return `the last ${t.color} wire`;
  }
}

export function wireRuleText(r: WireRule, first: boolean): string {
  return `${first ? 'If' : 'Otherwise, if'} ${r.when.map(condText).join(' and ')}, cut ${targetText(r.cut)}.`;
}
export const wireOtherwiseText = (t: WireTarget) => `Otherwise, cut ${targetText(t)}.`;

function atomText(a: ButtonAtom): string {
  switch (a.k) {
    case 'color':
      return `the button is ${a.c}`;
    case 'label':
      return `it says "${a.l}"`;
    case 'batteries':
      return `there are ${a.n} or more batteries`;
    case 'vowel':
      return 'the serial number contains a vowel';
    case 'odd':
      return "the serial number's last digit is odd";
  }
}
export const buttonRuleText = (r: ButtonRule, first: boolean) => `${first ? 'If' : 'Otherwise, if'} ${r.when.map(atomText).join(' and ')}, ${r.act} it.`;

export function memoryStepText(s: MemoryStep): string {
  switch (s.k) {
    case 'pos':
      return `press the button in the ${ORD[s.i]} position`;
    case 'label':
      return `press the button labeled "${s.l}"`;
    case 'samePos':
      return `press the button in the same position as in stage ${s.stage + 1}`;
    case 'sameLabel':
      return `press the button with the same label as in stage ${s.stage + 1}`;
  }
}

export function switchRuleText(led: LedColor, r: SwitchRule): string {
  const dir = (up: boolean) => (up ? 'UP' : 'DOWN');
  switch (r.k) {
    case 'always':
      return `${led} light: always ${dir(r.up)}.`;
    case 'odd':
      return `${led} light: ${dir(r.up)} if the serial's last digit is odd, otherwise ${dir(!r.up)}.`;
    case 'vowel':
      return `${led} light: ${dir(r.up)} if the serial contains a vowel, otherwise ${dir(!r.up)}.`;
    case 'batteries':
      return `${led} light: ${dir(r.up)} with ${r.n}+ batteries, otherwise ${dir(!r.up)}.`;
    case 'many':
      return `${led} light: ${dir(r.up)} if ${r.n} or more switches have a ${led} light, otherwise ${dir(!r.up)}.`;
  }
}
