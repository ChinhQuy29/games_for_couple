// A busy painted scene, generated from a seed so both screens draw exactly the same thing.
// Only the seed travels over the network.

export type Shape =
  | { t: 'rect'; x: number; y: number; w: number; h: number; rot: number; color: string }
  | { t: 'blob'; x: number; y: number; rx: number; ry: number; rot: number; color: string }
  | { t: 'flower'; x: number; y: number; r: number; color: string; center: string }
  | { t: 'leaf'; x: number; y: number; len: number; rot: number; color: string }
  | { t: 'dot'; x: number; y: number; r: number; color: string };

export const PALETTES = [
  ['#ff4f8b', '#ffc93c', '#3ddc97', '#4cc9f0', '#9b5de5', '#fff8e7'],
  ['#e07a4f', '#f2c57c', '#6b8f71', '#2b4a3e', '#f6e7c8', '#a86d3a'],
  ['#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#e63946', '#ffb703'],
  ['#5f0f40', '#9a031e', '#fb8b24', '#e36414', '#0f4c5c', '#f6d8ae'],
  ['#2d6a4f', '#40916c', '#95d5b2', '#d8f3dc', '#ffafcc', '#fefae0'],
];

/** Small, fast, seedable RNG (mulberry32). */
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

export function buildScene(seed: number, w: number, h: number): { bg: string; shapes: Shape[] } {
  const rng = rngFrom(seed);
  const pal = PALETTES[Math.floor(rng() * PALETTES.length)]!;
  const pick = () => pal[Math.floor(rng() * pal.length)]!;
  const shapes: Shape[] = [];
  const rand = (a: number, b: number) => a + rng() * (b - a);
  for (let i = 0; i < 7; i++) shapes.push({ t: 'rect', x: rand(-100, w), y: rand(-100, h), w: rand(150, 500), h: rand(80, 300), rot: rand(-40, 40), color: pick() });
  for (let i = 0; i < 14; i++) shapes.push({ t: 'blob', x: rand(0, w), y: rand(0, h), rx: rand(40, 160), ry: rand(30, 120), rot: rand(0, 180), color: pick() });
  for (let i = 0; i < 60; i++) shapes.push({ t: 'leaf', x: rand(0, w), y: rand(0, h), len: rand(30, 80), rot: rand(0, 360), color: pick() });
  for (let i = 0; i < 28; i++) shapes.push({ t: 'flower', x: rand(0, w), y: rand(0, h), r: rand(12, 34), color: pick(), center: pick() });
  for (let i = 0; i < 160; i++) shapes.push({ t: 'dot', x: rand(0, w), y: rand(0, h), r: rand(3, 11), color: pick() });
  return { bg: pick(), shapes };
}
